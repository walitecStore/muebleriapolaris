export type CenterPosition = 'before' | 'center' | 'after' | 'unknown';
export type PricingMode =
  | 'EXACT_REFERENCE'
  | 'INTERPOLATED'
  | 'CORRIDOR_EXTRAPOLATED'
  | 'MANUAL_QUOTE';

export type DistancePriceAnchor = {
  name: string;
  corridor: string;
  distanceKm: number;
  price: number;
};

export type PriceCalibration = {
  normalizedName: string;
  pricingCorridor: string;
  centerRouteDistanceKm: number | null;
  referencePrice: number | null;
};

export type DistancePriceResult =
  | {
      requiresQuote: false;
      price: number;
      lowerAnchor: DistancePriceAnchor;
      upperAnchor: DistancePriceAnchor;
      mode: 'INTERPOLATED' | 'CORRIDOR_EXTRAPOLATED';
    }
  | {
      requiresQuote: true;
      price: null;
      lowerAnchor: null;
      upperAnchor: null;
      mode: 'MANUAL_QUOTE';
      reason: string;
    };

export function nullableFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeLocationName(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const LOCATION_ALIASES: Record<string, string> = {
  'cercado de lima': 'lima',
  'lima cercado': 'lima',
  chosica: 'lurigancho-chosica',
  lurigancho: 'lurigancho-chosica',
  'lurigancho chosica': 'lurigancho-chosica',
};

export function canonicalLocationName(value: string) {
  const normalized = normalizeLocationName(value);
  return LOCATION_ALIASES[normalized] ?? normalized;
}

export const canonicalDistrictName = canonicalLocationName;

export function classifyAgainstCenter(
  customerDistanceKm: number,
  centerDistanceKm: number | null,
  toleranceKm = 1
): CenterPosition {
  if (centerDistanceKm === null || !Number.isFinite(centerDistanceKm)) return 'unknown';
  const delta = customerDistanceKm - centerDistanceKm;
  if (Math.abs(delta) <= toleranceKm) return 'center';
  return delta < 0 ? 'before' : 'after';
}

export function roundShippingPrice(price: number, increment = 5) {
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(increment) || increment <= 0)
    throw new Error('Invalid shipping price');
  return Number((Math.round(price / increment) * increment).toFixed(2));
}

function manual(reason: string): DistancePriceResult {
  return {
    requiresQuote: true,
    price: null,
    lowerAnchor: null,
    upperAnchor: null,
    mode: 'MANUAL_QUOTE',
    reason,
  };
}

export function calculateDistanceBasedCommercialPrice(input: {
  customerDistanceKm: number;
  anchors: DistancePriceAnchor[];
  minimumExtrapolationRate?: number | null;
  maximumExtrapolationRate?: number | null;
}): DistancePriceResult {
  if (!Number.isFinite(input.customerDistanceKm) || input.customerDistanceKm <= 0)
    throw new Error('Invalid route distance');
  const anchors = input.anchors
    .filter(
      (anchor) =>
        Number.isFinite(anchor.distanceKm) &&
        anchor.distanceKm > 0 &&
        Number.isFinite(anchor.price) &&
        anchor.price > 0
    )
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .filter(
      (anchor, index, sorted) => index === 0 || anchor.distanceKm !== sorted[index - 1].distanceKm
    );
  if (anchors.length < 2)
    return manual('No existen suficientes anclajes viales válidos para este corredor.');

  for (let index = 1; index < anchors.length; index += 1) {
    const lower = anchors[index - 1];
    const upper = anchors[index];
    if (
      input.customerDistanceKm >= lower.distanceKm &&
      input.customerDistanceKm <= upper.distanceKm
    ) {
      const ratio =
        (input.customerDistanceKm - lower.distanceKm) / (upper.distanceKm - lower.distanceKm);
      return {
        requiresQuote: false,
        price: lower.price + ratio * (upper.price - lower.price),
        lowerAnchor: lower,
        upperAnchor: upper,
        mode: 'INTERPOLATED',
      };
    }
  }

  const below = input.customerDistanceKm < anchors[0].distanceKm;
  const minRate = input.minimumExtrapolationRate;
  const maxRate = input.maximumExtrapolationRate;
  const pairIndexes = Array.from({ length: anchors.length - 1 }, (_, index) => index);
  if (!below) pairIndexes.reverse();
  for (const index of pairIndexes) {
    const lower = anchors[index];
    const upper = anchors[index + 1];
    const slope = (upper.price - lower.price) / (upper.distanceKm - lower.distanceKm);
    if (
      !Number.isFinite(slope) ||
      (minRate !== null && minRate !== undefined && slope < minRate) ||
      (maxRate !== null && maxRate !== undefined && slope > maxRate)
    )
      continue;
    const price = lower.price + (input.customerDistanceKm - lower.distanceKm) * slope;
    if (!Number.isFinite(price) || price <= 0) continue;
    return {
      requiresQuote: false,
      price,
      lowerAnchor: lower,
      upperAnchor: upper,
      mode: 'CORRIDOR_EXTRAPOLATED',
    };
  }
  return manual('La extrapolación comercial no produjo un precio válido dentro de las guardas.');
}

export function calculateFinalShippingPrice(input: {
  commercialRoutePrice: number;
  productFactor: number | null;
  centerAdjustment: number;
  roundingIncrement?: number;
}) {
  const factor = input.productFactor ?? 1;
  if (
    !Number.isFinite(input.commercialRoutePrice) ||
    input.commercialRoutePrice < 0 ||
    !Number.isFinite(input.centerAdjustment) ||
    !Number.isFinite(factor) ||
    factor <= 0
  )
    throw new Error('Invalid shipping configuration');
  const adjustedCommercialPrice = Math.max(0, input.commercialRoutePrice + input.centerAdjustment);
  const productAdjustment = adjustedCommercialPrice * (factor - 1);
  return {
    commercialRoutePrice: roundShippingPrice(adjustedCommercialPrice, input.roundingIncrement),
    productAdjustment: Number(productAdjustment.toFixed(2)),
    finalPrice: roundShippingPrice(
      adjustedCommercialPrice + productAdjustment,
      input.roundingIncrement
    ),
  };
}

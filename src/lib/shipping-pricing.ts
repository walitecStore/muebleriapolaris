export type CenterPosition = 'before_center' | 'center' | 'after_center';

export type DistrictPricing = {
  centerDistanceKm: number;
  basePrice: number;
  userDistanceKm: number;
  toleranceKm: number;
  beforeAdjustment: number;
  afterAdjustment: number;
  minimumPrice: number;
  maximumPrice?: number | null;
  productFactor?: number;
};

export type CalibrationPoint = { distanceKm: number; price: number };

export function nullableFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function isValidPeruCoordinate(latitude: unknown, longitude: unknown) {
  const lat = nullableFiniteNumber(latitude);
  const lng = nullableFiniteNumber(longitude);
  return lat !== null && lng !== null && lat >= -18.5 && lat <= -3 && lng >= -82 && lng <= -68;
}

const normalizeTerritory = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function territoryKind(province: unknown, department: unknown) {
  const provinceName = normalizeTerritory(province);
  const departmentName = normalizeTerritory(department);
  if (
    provinceName === 'callao' ||
    provinceName.includes('provincia constitucional del callao') ||
    departmentName === 'callao' ||
    departmentName.includes('provincia constitucional del callao')
  )
    return 'callao' as const;
  if (
    provinceName === 'lima' ||
    provinceName.includes('provincia de lima') ||
    provinceName.includes('lima metropolitana')
  )
    return 'lima_metropolitana' as const;
  return 'other' as const;
}

export function interpolateCenterPrice(distanceKm: number, points: CalibrationPoint[]): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) throw new Error('Invalid route distance');
  const sorted = points
    .filter((point) => Number.isFinite(point.distanceKm) && Number.isFinite(point.price))
    .sort((a, b) => a.distanceKm - b.distanceKm);
  if (sorted.length < 2) throw new Error('At least two calibration points are required');
  const upperIndex = sorted.findIndex((point) => point.distanceKm >= distanceKm);
  const upper = upperIndex < 0 ? sorted.at(-1)! : sorted[Math.max(1, upperIndex)];
  const lower = upperIndex < 0 ? sorted.at(-2)! : sorted[Math.max(0, upperIndex - 1)];
  if (upper.distanceKm === lower.distanceKm) return upper.price;
  return (
    lower.price +
    ((distanceKm - lower.distanceKm) / (upper.distanceKm - lower.distanceKm)) *
      (upper.price - lower.price)
  );
}

export function calculateDistrictShipping(input: DistrictPricing) {
  const values = [
    input.centerDistanceKm,
    input.basePrice,
    input.userDistanceKm,
    input.toleranceKm,
    input.beforeAdjustment,
    input.afterAdjustment,
    input.minimumPrice,
    input.productFactor ?? 1,
  ];
  if (
    values.some((value) => !Number.isFinite(value)) ||
    input.centerDistanceKm < 0 ||
    input.userDistanceKm < 0 ||
    (input.maximumPrice !== null &&
      input.maximumPrice !== undefined &&
      (!Number.isFinite(input.maximumPrice) || input.maximumPrice < input.minimumPrice))
  )
    throw new Error('Invalid shipping configuration');
  const deltaKm = input.userDistanceKm - input.centerDistanceKm;
  const position: CenterPosition =
    deltaKm < -input.toleranceKm
      ? 'before_center'
      : deltaKm > input.toleranceKm
        ? 'after_center'
        : 'center';
  const adjustment =
    position === 'before_center'
      ? input.beforeAdjustment
      : position === 'after_center'
        ? input.afterAdjustment
        : 0;
  const routePrice = input.basePrice * Math.max(1, input.productFactor ?? 1) + adjustment;
  const boundedPrice = Math.min(
    input.maximumPrice ?? Number.POSITIVE_INFINITY,
    Math.max(input.minimumPrice, routePrice)
  );
  return {
    position,
    deltaKm: Number(deltaKm.toFixed(2)),
    adjustment,
    routePrice: Number(routePrice.toFixed(2)),
    shippingCost: Number((Math.round(boundedPrice / 5) * 5).toFixed(2)),
  };
}

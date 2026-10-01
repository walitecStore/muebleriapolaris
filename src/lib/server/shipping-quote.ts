import {
  calculateDistanceBasedCommercialPrice,
  calculateFinalShippingPrice,
  canonicalLocationName,
  classifyAgainstCenter,
  nullableFiniteNumber,
  type DistancePriceAnchor,
  type PriceCalibration,
} from '../shipping-pricing.ts';
import {
  geocodeReferenceLocation,
  getDrivingRoute,
  getShippingOrigin,
  isValidCoordinate,
  reverseGeocode,
  ShippingError,
  type Coordinate,
  type GeocodedLocation,
  type NormalizedDestination,
  type RouteResult,
} from './shipping.ts';

type QueryResult = { data: unknown; error: unknown };
type SupabaseLike = { from: (table: string) => any };
type CalibrationRow = {
  location_name: string;
  normalized_name: string;
  location_type: 'DISTRICT' | 'PROVINCE' | 'LOCALITY';
  department: string | null;
  province: string | null;
  district: string | null;
  aliases: string[] | null;
  center_lat: unknown;
  center_lng: unknown;
  center_reference_name: string | null;
  center_route_distance_km: unknown;
  reference_price: unknown;
  center_tolerance_km: unknown;
  before_center_adjustment: unknown;
  after_center_adjustment: unknown;
  pricing_corridor: string;
  coverage_type: 'METROPOLITAN' | 'NEAR_LIMA' | 'MANUAL_QUOTE' | 'OUT_OF_COVERAGE';
};
type RuleRow = {
  minimum_extrapolation_rate: unknown;
  maximum_extrapolation_rate: unknown;
  rounding_increment: unknown;
};

export type ProductFactorAudit = {
  factor: number;
  productId: string | null;
  productName: string | null;
  shippingCategory: string | null;
  source: 'products.shipping_factor';
};

export type QuoteDependencies = {
  getOrigin?: () => Promise<Coordinate> | Coordinate;
  geocode?: (destination: Coordinate) => Promise<GeocodedLocation>;
  geocodeReference?: (reference: string) => Promise<Coordinate>;
  route?: (origin: Coordinate, destination: Coordinate) => Promise<RouteResult>;
};

const anchorPromiseCache = new Map<string, Promise<DistancePriceAnchor | null>>();

function mapCalibration(row: CalibrationRow, distanceKm: number | null): PriceCalibration {
  return {
    normalizedName: row.normalized_name,
    pricingCorridor: row.pricing_corridor,
    centerRouteDistanceKm: distanceKm,
    referencePrice: nullableFiniteNumber(row.reference_price),
  };
}

function calibrationNames(row: CalibrationRow) {
  return [row.location_name, row.normalized_name, ...(row.aliases ?? [])]
    .map(canonicalLocationName)
    .filter(Boolean);
}

export function findDestinationCalibration(rows: CalibrationRow[], candidates: string[]) {
  for (const candidate of candidates) {
    const name = canonicalLocationName(candidate);
    if (!name) continue;
    const match = rows.find((row) => calibrationNames(row).includes(name));
    if (match) return match;
  }
  return undefined;
}

function normalizedDestination(
  location: GeocodedLocation,
  calibration: CalibrationRow
): NormalizedDestination & { address: string } {
  return {
    address: location.address,
    district:
      calibration.location_type === 'DISTRICT'
        ? (calibration.district ?? calibration.location_name)
        : null,
    province: location.province ?? calibration.province,
    department: location.department ?? calibration.department,
    locality:
      location.locality ??
      (calibration.location_type === 'LOCALITY' ? calibration.location_name : null),
  };
}

async function resolveAnchor(
  origin: Coordinate,
  row: CalibrationRow,
  route: (origin: Coordinate, destination: Coordinate) => Promise<RouteResult>,
  geocodeReference: (reference: string) => Promise<Coordinate>
): Promise<DistancePriceAnchor | null> {
  const price = nullableFiniteNumber(row.reference_price);
  if (price === null || price <= 0) return null;
  let distanceKm = nullableFiniteNumber(row.center_route_distance_km);
  if (distanceKm === null) {
    let center: Coordinate | null = null;
    const lat = nullableFiniteNumber(row.center_lat);
    const lng = nullableFiniteNumber(row.center_lng);
    if (lat !== null && lng !== null && isValidCoordinate(lat, lng)) center = { lat, lng };
    else if (row.center_reference_name) center = await geocodeReference(row.center_reference_name);
    if (!center) return null;
    distanceKm = (await route(origin, center)).distanceKm;
  }
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
  return {
    name: row.location_name,
    corridor: row.pricing_corridor,
    distanceKm,
    price,
  };
}

export async function resolveCalibrationAnchors(
  origin: Coordinate,
  rows: CalibrationRow[],
  dependencies: Pick<QuoteDependencies, 'route' | 'geocodeReference'> = {}
) {
  const route = dependencies.route ?? getDrivingRoute;
  const geocodeReference = dependencies.geocodeReference ?? geocodeReferenceLocation;
  const useCache = !dependencies.route && !dependencies.geocodeReference;
  const anchors: Array<DistancePriceAnchor | null> = [];
  // Sequential bootstrap avoids bursts against the public Nominatim fallback.
  for (const row of rows) {
    const key = `${origin.lat},${origin.lng}:${row.normalized_name}`;
    if (!useCache) {
      try {
        anchors.push(await resolveAnchor(origin, row, route, geocodeReference));
      } catch {
        anchors.push(null);
      }
      continue;
    }
    if (!anchorPromiseCache.has(key))
      anchorPromiseCache.set(
        key,
        resolveAnchor(origin, row, route, geocodeReference).catch(() => null)
      );
    anchors.push(await anchorPromiseCache.get(key)!);
  }
  return anchors.filter((anchor): anchor is DistancePriceAnchor => anchor !== null);
}

export async function buildShippingQuote(
  supabase: SupabaseLike,
  destinationCoordinate: Coordinate,
  product: ProductFactorAudit,
  dependencies: QuoteDependencies = {}
) {
  const origin = await (dependencies.getOrigin ?? getShippingOrigin)();
  const [calibrationsResult, rulesResult] = (await Promise.all([
    supabase.from('shipping_price_calibrations').select('*').eq('active', true),
    supabase.from('shipping_pricing_rules').select('*').eq('active', true).limit(1),
  ])) as [QueryResult, QueryResult];
  if (calibrationsResult.error || rulesResult.error)
    throw new ShippingError(
      'SHIPPING_CONFIG_ERROR',
      'No se pudo consultar la configuración comercial de envíos.'
    );

  const geocode = dependencies.geocode ?? reverseGeocode;
  const route = dependencies.route ?? getDrivingRoute;
  const [location, customerRoute] = await Promise.all([
    geocode(destinationCoordinate),
    route(origin, destinationCoordinate),
  ]);
  const rows = (calibrationsResult.data ?? []) as CalibrationRow[];
  const destinationCandidates = [
    ...location.districtCandidates,
    location.locality,
    location.province,
  ].filter((value): value is string => Boolean(value));
  const destinationCalibration = findDestinationCalibration(rows, destinationCandidates);
  if (!destinationCalibration || destinationCalibration.coverage_type === 'OUT_OF_COVERAGE')
    throw new ShippingError(
      'DISTRICT_NOT_COVERED',
      'El destino no está incluido en la cobertura comercial configurada.'
    );

  const corridorCalibrationRows = rows.filter(
    (row) =>
      row.pricing_corridor === destinationCalibration.pricing_corridor &&
      nullableFiniteNumber(row.reference_price) !== null
  );
  const anchorRows =
    corridorCalibrationRows.length >= 2
      ? corridorCalibrationRows
      : rows.filter((row) => nullableFiniteNumber(row.reference_price) !== null);
  const anchors = await resolveCalibrationAnchors(origin, anchorRows, dependencies);
  const destinationAnchor = anchors.find(
    (anchor) => canonicalLocationName(anchor.name) === destinationCalibration.normalized_name
  );
  const calibration = mapCalibration(
    destinationCalibration,
    destinationAnchor?.distanceKm ??
      nullableFiniteNumber(destinationCalibration.center_route_distance_km)
  );
  const destination = normalizedDestination(location, destinationCalibration);
  const centerPosition = classifyAgainstCenter(
    customerRoute.distanceKm,
    calibration.centerRouteDistanceKm,
    nullableFiniteNumber(destinationCalibration.center_tolerance_km) ?? 1
  );
  const centerAdjustment =
    calibration.referencePrice !== null && centerPosition === 'before'
      ? (nullableFiniteNumber(destinationCalibration.before_center_adjustment) ?? -5)
      : calibration.referencePrice !== null && centerPosition === 'after'
        ? (nullableFiniteNumber(destinationCalibration.after_center_adjustment) ?? 10)
        : 0;
  const corridorAnchors = anchors.filter(
    (anchor) => anchor.corridor === destinationCalibration.pricing_corridor
  );
  const selectedAnchors = corridorAnchors.length >= 2 ? corridorAnchors : anchors;
  const rule = ((rulesResult.data ?? []) as RuleRow[])[0];
  const curve = calculateDistanceBasedCommercialPrice({
    customerDistanceKm: customerRoute.distanceKm,
    anchors: selectedAnchors,
    minimumExtrapolationRate: nullableFiniteNumber(rule?.minimum_extrapolation_rate),
    maximumExtrapolationRate: nullableFiniteNumber(rule?.maximum_extrapolation_rate),
  });
  const exactPrice = calibration.referencePrice;
  const requiresQuote =
    destinationCalibration.coverage_type === 'MANUAL_QUOTE' ||
    (exactPrice === null && curve.requiresQuote);
  if (requiresQuote) {
    return {
      status: 'requires_quote' as const,
      ok: true as const,
      requiresQuote: true as const,
      message: curve.requiresQuote
        ? curve.reason
        : 'Ruta calculada. La tarifa para este destino requiere configuración comercial.',
      origin: { configured: true as const },
      destination,
      corridor: destinationCalibration.pricing_corridor,
      route: customerRoute,
      pricing: {
        pricingMode: 'MANUAL_QUOTE' as const,
        lowerAnchor: null,
        upperAnchor: null,
        interpolatedRoutePrice: null,
        commercialRoutePrice: null,
        productFactor: product.factor,
        productAdjustment: null,
        factorSource: product,
        centerPosition,
        centerAdjustment: 0,
        finalPrice: null,
      },
    };
  }

  const interpolatedRoutePrice = exactPrice ?? curve.price!;
  const finalPricing = calculateFinalShippingPrice({
    commercialRoutePrice: interpolatedRoutePrice,
    productFactor: product.factor,
    centerAdjustment,
    roundingIncrement: nullableFiniteNumber(rule?.rounding_increment) ?? 5,
  });
  const quote = {
    status: 'calculated' as const,
    ok: true as const,
    requiresQuote: false as const,
    origin: { configured: true as const },
    destination,
    corridor: destinationCalibration.pricing_corridor,
    route: customerRoute,
    pricing: {
      pricingMode: exactPrice !== null ? ('EXACT_REFERENCE' as const) : curve.mode,
      lowerAnchor: curve.requiresQuote ? null : curve.lowerAnchor,
      upperAnchor: curve.requiresQuote ? null : curve.upperAnchor,
      interpolatedRoutePrice: Number(interpolatedRoutePrice.toFixed(2)),
      ...finalPricing,
      productFactor: product.factor,
      factorSource: product,
      centerPosition,
      centerAdjustment,
    },
    audit: {
      centerRouteDistanceKm: calibration.centerRouteDistanceKm,
      centerDeltaKm:
        calibration.centerRouteDistanceKm === null
          ? null
          : Number((customerRoute.distanceKm - calibration.centerRouteDistanceKm).toFixed(2)),
      coverageType: destinationCalibration.coverage_type,
      calibrationName: destinationCalibration.normalized_name,
      pricingVersion: 'corridor-route-v5',
    },
  };
  if (process.env.NODE_ENV !== 'production')
    console.info('[shipping]', {
      provider: customerRoute.provider,
      destination: destinationCoordinate,
      corridor: quote.corridor,
      route: customerRoute,
      pricing: quote.pricing,
    });
  return quote;
}

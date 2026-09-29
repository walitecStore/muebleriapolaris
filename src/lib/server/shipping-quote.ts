import 'server-only';
import {
  calculateDistrictShipping,
  interpolateCenterPrice,
  nullableFiniteNumber,
} from '@/lib/shipping-pricing';
import { drivingRoute, geocodePublicReference, verifyShippingDestination } from './shipping';

type QueryResult = { data: unknown; error: unknown };
type SupabaseLike = { from: (table: string) => any };
type CenterRow = {
  district: string;
  aliases: string[] | null;
  province: string;
  department: string;
  center_lat: unknown;
  center_lng: unknown;
  center_reference_name: string;
  center_route_distance_km: unknown;
  base_shipping_price: unknown;
  before_center_adjustment: unknown;
  after_center_adjustment: unknown;
  center_tolerance_km: unknown;
  minimum_shipping_price: unknown;
  maximum_shipping_price: unknown;
  automatic_shipping: boolean;
};

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

function requiredNumber(value: unknown, label: string) {
  const number = nullableFiniteNumber(value);
  if (number === null) throw new Error(`Configuración inválida: ${label}.`);
  return number;
}

async function resolveCenterRoute(center: CenterRow) {
  const configuredDistance = nullableFiniteNumber(center.center_route_distance_km);
  if (configuredDistance !== null) return configuredDistance;
  let latitude = nullableFiniteNumber(center.center_lat);
  let longitude = nullableFiniteNumber(center.center_lng);
  if (latitude === null || longitude === null) {
    const point = await geocodePublicReference(
      `${center.center_reference_name}, ${center.district}, ${center.province}, ${center.department}, Perú`
    );
    latitude = point.latitude;
    longitude = point.longitude;
  }
  return (await drivingRoute(latitude, longitude)).distanceKm;
}

export async function buildShippingQuote(
  supabase: SupabaseLike,
  latitude: number,
  longitude: number,
  productFactor: number
) {
  const destination = await verifyShippingDestination(latitude, longitude);
  const districtKey = normalize(destination.district);
  const result = (await supabase
    .from('shipping_district_centers')
    .select('*')
    .eq('active', true)) as QueryResult;
  if (result.error) throw new Error('No se pudo consultar la cobertura de envíos.');
  const centers = (result.data ?? []) as CenterRow[];
  const center = centers.find((row) =>
    [row.district, ...(row.aliases ?? [])].some((name) => normalize(name) === districtKey)
  );
  if (!center || !center.automatic_shipping) {
    return {
      status: 'requires_quote' as const,
      message: 'Esta ubicación requiere cotización.',
      destination,
    };
  }

  const centerDistanceKm = await resolveCenterRoute(center);
  let basePrice = nullableFiniteNumber(center.base_shipping_price);
  if (basePrice === null) {
    const pricedCenters = centers.filter(
      (row) => nullableFiniteNumber(row.base_shipping_price) !== null
    );
    const calibration = await Promise.all(
      pricedCenters.map(async (row) => ({
        distanceKm: await resolveCenterRoute(row),
        price: requiredNumber(row.base_shipping_price, `tarifa de ${row.district}`),
      }))
    );
    basePrice = interpolateCenterPrice(centerDistanceKm, calibration);
  }
  const pricing = calculateDistrictShipping({
    centerDistanceKm,
    basePrice,
    userDistanceKm: destination.distanceKm,
    toleranceKm: requiredNumber(center.center_tolerance_km, 'tolerancia'),
    beforeAdjustment: requiredNumber(center.before_center_adjustment, 'ajuste anterior'),
    afterAdjustment: requiredNumber(center.after_center_adjustment, 'ajuste posterior'),
    minimumPrice: requiredNumber(center.minimum_shipping_price, 'tarifa mínima'),
    maximumPrice: nullableFiniteNumber(center.maximum_shipping_price),
    productFactor: Number.isFinite(productFactor) && productFactor > 0 ? productFactor : 1,
  });
  return {
    status: 'calculated' as const,
    destination,
    shippingCost: pricing.shippingCost,
    audit: {
      ...pricing,
      centerDistanceKm: Number(centerDistanceKm.toFixed(2)),
      basePrice: Number(basePrice.toFixed(2)),
      productFactor,
      pricingVersion: 'district-centers-v2',
    },
  };
}

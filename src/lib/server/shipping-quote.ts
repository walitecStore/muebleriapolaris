import 'server-only';
import { calculateDistrictShipping, nullableFiniteNumber } from '@/lib/shipping-pricing';
import { verifyShippingDestination, type StoreOrigin } from './shipping';
type SupabaseLike = { from: (table: string) => any };
const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
export async function buildShippingQuote(
  supabase: SupabaseLike,
  latitude: number,
  longitude: number,
  productFactor: number
) {
  const { data: store, error: storeError } = await supabase
    .from('store_settings')
    .select('origin_lat,origin_lng,origin_address')
    .eq('id', 1)
    .single();
  if (storeError || !store)
    throw new Error('No se pudo consultar el origen de entrega configurado.');
  const origin: StoreOrigin = {
    latitude: Number(store.origin_lat),
    longitude: Number(store.origin_lng),
    address: store.origin_address,
  };
  const destination = await verifyShippingDestination(latitude, longitude, origin);
  const { data: centers, error } = await supabase
    .from('shipping_district_centers')
    .select('*')
    .eq('active', true);
  if (error) throw new Error('No se pudo consultar la cobertura de envíos.');
  const names = [destination.district, ...(destination.districtCandidates || [])]
    .filter(Boolean)
    .map(normalize);
  const center = (centers || []).find(
    (row: { district: string; aliases?: string[]; province: string }) =>
      [row.district, ...(row.aliases || [])].some((name) => names.includes(normalize(name)))
  );
  if (!center || !center.automatic_shipping || !destination.isLimaMetropolitana)
    return {
      status: 'requires_quote' as const,
      message:
        'Esta ubicación está fuera de la cobertura automática de Lima. Coordina una cotización.',
      destination,
    };
  // Only verified, configured center distances influence before/after adjustments.
  // Missing center data no longer launches dozens of geocoding and routing calls.
  const centerDistanceKm =
    nullableFiniteNumber(center.center_route_distance_km) ?? destination.distanceKm;
  let basePrice = nullableFiniteNumber(center.base_shipping_price);
  if (basePrice === null) {
    const { data: bands, error: bandError } = await supabase
      .from('shipping_distance_bands')
      .select('min_distance_km,max_distance_km,base_cost,cost_per_extra_km,minimum_cost,priority')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('min_distance_km', { ascending: false });
    if (bandError) throw new Error('No se pudieron consultar las tarifas por distancia.');
    const band = (bands || []).find(
      (b: { min_distance_km: number; max_distance_km: number | null }) =>
        destination.distanceKm >= Number(b.min_distance_km) &&
        (b.max_distance_km === null || destination.distanceKm < Number(b.max_distance_km))
    );
    if (!band) throw new Error('No hay una tarifa configurada para esta distancia.');
    basePrice = Math.max(
      Number(band.minimum_cost),
      Number(band.base_cost) +
        Math.max(0, destination.distanceKm - Number(band.min_distance_km)) *
          Number(band.cost_per_extra_km)
    );
  }
  const price = Number(basePrice.toFixed(2));
  const factor = Number.isFinite(productFactor) && productFactor >= 1 ? productFactor : 1;
  const pricing = calculateDistrictShipping({
    centerDistanceKm,
    basePrice: price,
    userDistanceKm: destination.distanceKm,
    toleranceKm: Number(center.center_tolerance_km),
    beforeAdjustment: Number(center.before_center_adjustment),
    afterAdjustment: Number(center.after_center_adjustment),
    minimumPrice: Number(center.minimum_shipping_price),
    maximumPrice: nullableFiniteNumber(center.maximum_shipping_price),
    productFactor: factor,
  });
  return {
    status: 'calculated' as const,
    destination: {
      ...destination,
      district: center.district,
      province: center.province,
      department: center.department,
    },
    shippingCost: pricing.shippingCost,
    audit: {
      ...pricing,
      centerDistanceKm,
      basePrice: price,
      productFactor: factor,
      pricingVersion: 'lima-road-bands-v3',
    },
  };
}

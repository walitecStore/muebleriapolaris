import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  calculateDistanceBasedCommercialPrice,
  calculateFinalShippingPrice,
  canonicalLocationName,
  classifyAgainstCenter,
  normalizeLocationName,
  nullableFiniteNumber,
  roundShippingPrice,
} from '../src/lib/shipping-pricing.ts';
import {
  clearShippingOriginCacheForTests,
  getShippingOrigin,
  isValidCoordinate,
  routeWithGoogle,
  routeWithOsrm,
  validateRouteResult,
} from '../src/lib/server/shipping.ts';
import { buildShippingQuote, resolveCalibrationAnchors } from '../src/lib/server/shipping-quote.ts';

process.env.NODE_ENV = 'production';

const savedEnv = {
  lat: process.env.SHIPPING_ORIGIN_LAT,
  lng: process.env.SHIPPING_ORIGIN_LNG,
  address: process.env.SHIPPING_ORIGIN_ADDRESS,
  google: process.env.GOOGLE_MAPS_SERVER_API_KEY,
};
process.env.SHIPPING_ORIGIN_LAT = '-12.1';
process.env.SHIPPING_ORIGIN_LNG = '-77.1';
assert.deepEqual(await getShippingOrigin(), { lat: -12.1, lng: -77.1 });
delete process.env.SHIPPING_ORIGIN_LAT;
assert.rejects(
  () => getShippingOrigin(),
  (error) => error.code === 'ORIGIN_NOT_CONFIGURED'
);
delete process.env.SHIPPING_ORIGIN_LNG;
process.env.SHIPPING_ORIGIN_ADDRESS = 'Dirección comercial verificada';
delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
clearShippingOriginCacheForTests();
let originRequests = 0;
const originFetcher = async () => {
  originRequests += 1;
  return new Response(JSON.stringify([{ lat: '-12.2', lon: '-77.2' }]));
};
assert.deepEqual(await getShippingOrigin(originFetcher), { lat: -12.2, lng: -77.2 });
assert.deepEqual(await getShippingOrigin(originFetcher), { lat: -12.2, lng: -77.2 });
assert.equal(
  originRequests,
  1,
  'la dirección de origen debe geocodificarse una sola vez por proceso'
);
for (const [name, value] of [
  ['SHIPPING_ORIGIN_LAT', savedEnv.lat],
  ['SHIPPING_ORIGIN_LNG', savedEnv.lng],
  ['SHIPPING_ORIGIN_ADDRESS', savedEnv.address],
  ['GOOGLE_MAPS_SERVER_API_KEY', savedEnv.google],
]) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
clearShippingOriginCacheForTests();

assert.equal(isValidCoordinate(-11.99, -77.07), true);
assert.equal(isValidCoordinate(null, null), false);
assert.equal(isValidCoordinate(Number.NaN, -77), false);
assert.equal(isValidCoordinate(91, 0), false);

let requestedUrl = '';
const osrm = await routeWithOsrm(
  { lat: -12.1, lng: -77.1 },
  { lat: -11.991645, lng: -77.070057 },
  async (url) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({ routes: [{ distance: 8420, duration: 1320 }] }));
  }
);
assert.match(requestedUrl, /-77\.1,-12\.1;-77\.070057,-11\.991645/);
assert.deepEqual(osrm, { provider: 'osrm', distanceKm: 8.42, durationSeconds: 1320 });
let googleBody;
await routeWithGoogle(
  { lat: -12.1, lng: -77.1 },
  { lat: -11.99, lng: -77.07 },
  'test-key',
  async (_url, init) => {
    googleBody = JSON.parse(String(init.body));
    return new Response(JSON.stringify({ routes: [{ distanceMeters: 9000, duration: '1200s' }] }));
  }
);
assert.deepEqual(googleBody.origin.location.latLng, { latitude: -12.1, longitude: -77.1 });
assert.deepEqual(googleBody.destination.location.latLng, { latitude: -11.99, longitude: -77.07 });
assert.throws(() => validateRouteResult({ provider: 'osrm', distanceKm: 0, durationSeconds: 2 }));
assert.throws(() => validateRouteResult({ provider: 'osrm', distanceKm: 2, durationSeconds: 0 }));

assert.equal(normalizeLocationName(' San Martín  de Porres '), 'san martin de porres');
assert.equal(normalizeLocationName('Jesús María'), 'jesus maria');
assert.equal(canonicalLocationName('Chosica'), 'lurigancho-chosica');
assert.equal(canonicalLocationName('Cercado de Lima'), 'lima');
assert.equal(nullableFiniteNumber(null), null);
assert.equal(classifyAgainstCenter(10, null), 'unknown');
assert.equal(classifyAgainstCenter(8, 10, 1), 'before');
assert.equal(classifyAgainstCenter(10, 10, 1), 'center');
assert.equal(classifyAgainstCenter(12, 10, 1), 'after');

const anchors = [
  { name: 'Los Olivos', corridor: 'NORTH', distanceKm: 10, price: 50 },
  { name: 'Comas', corridor: 'NORTH', distanceKm: 20, price: 70 },
  { name: 'Puente Piedra', corridor: 'NORTH', distanceKm: 30, price: 80 },
];
const interpolated = calculateDistanceBasedCommercialPrice({
  customerDistanceKm: 15,
  anchors,
});
assert.equal(interpolated.requiresQuote, false);
assert.equal(interpolated.price, 60);
assert.equal(interpolated.mode, 'INTERPOLATED');
assert.equal(interpolated.lowerAnchor?.name, 'Los Olivos');
assert.equal(interpolated.upperAnchor?.name, 'Comas');
const beforeCurve = calculateDistanceBasedCommercialPrice({ customerDistanceKm: 5, anchors });
assert.equal(beforeCurve.requiresQuote, false);
assert.equal(beforeCurve.mode, 'CORRIDOR_EXTRAPOLATED');
const longCurve = calculateDistanceBasedCommercialPrice({ customerDistanceKm: 70, anchors });
assert.equal(longCurve.requiresQuote, false);
assert.equal(longCurve.price, 120);
assert.equal(longCurve.mode, 'CORRIDOR_EXTRAPOLATED');
assert.equal(
  calculateDistanceBasedCommercialPrice({ customerDistanceKm: 10, anchors: [] }).requiresQuote,
  true
);
assert.equal(
  calculateDistanceBasedCommercialPrice({
    customerDistanceKm: 10,
    anchors: [{ name: 'null', corridor: 'NORTH', distanceKm: Number.NaN, price: 50 }],
  }).requiresQuote,
  true
);
assert.equal(
  calculateDistanceBasedCommercialPrice({
    customerDistanceKm: 10,
    anchors: [
      { name: 'a', corridor: 'NORTH', distanceKm: 10, price: 50 },
      { name: 'b', corridor: 'NORTH', distanceKm: 10, price: 70 },
    ],
  }).requiresQuote,
  true,
  'anchors duplicados no deben dividir por cero'
);
assert.equal(
  calculateDistanceBasedCommercialPrice({
    customerDistanceKm: 30,
    anchors: [
      { name: 'a', corridor: 'NORTH', distanceKm: 10, price: 100 },
      { name: 'b', corridor: 'NORTH', distanceKm: 20, price: 50 },
    ],
    minimumExtrapolationRate: 0,
  }).requiresQuote,
  true,
  'una pendiente fuera de las guardas configuradas se rechaza'
);
assert.throws(() =>
  calculateDistanceBasedCommercialPrice({ customerDistanceKm: Number.NaN, anchors })
);
assert.equal(roundShippingPrice(77), 75);
assert.equal(roundShippingPrice(78), 80);
assert.throws(() => roundShippingPrice(-1));
assert.deepEqual(
  calculateFinalShippingPrice({
    commercialRoutePrice: 50,
    productFactor: null,
    centerAdjustment: 0,
  }),
  { commercialRoutePrice: 50, productAdjustment: 0, finalPrice: 50 }
);
assert.deepEqual(
  calculateFinalShippingPrice({
    commercialRoutePrice: 50,
    productFactor: 1.5,
    centerAdjustment: 0,
  }),
  { commercialRoutePrice: 50, productAdjustment: 25, finalPrice: 75 }
);

const migration = readFileSync(
  new URL(
    '../supabase/migrations/20261001120000_authoritative_shipping_engine_v3.sql',
    import.meta.url
  ),
  'utf8'
);
const executedCoverageMigration = readFileSync(
  new URL(
    '../supabase/migrations/20260929180000_stage_5_6_shipping_payments_refunds_fix.sql',
    import.meta.url
  ),
  'utf8'
);
assert.equal(
  [...executedCoverageMigration.matchAll(/^ \('([^']+)'[^\n]+,'Lima','Lima',/gm)].length,
  43,
  'la migración V3 debe importar los 43 distritos de Provincia de Lima'
);
assert.match(migration, /pricing_corridor/);
assert.match(migration, /'Puente Piedra'[^\n]+,80,'NORTH'/);
for (const destination of ['Huaral', 'Chancay', 'Huacho', 'Barranca'])
  assert.match(migration, new RegExp(`\\('${destination}'[^\\n]+,'NORTH','NEAR_LIMA'`));
assert.match(
  migration,
  /GRANT EXECUTE ON FUNCTION public\.create_server_validated_order[\s\S]+service_role/
);
assert.match(
  migration,
  /REVOKE ALL ON FUNCTION public\.create_server_validated_order[\s\S]+authenticated/
);

const bootstrapped = await resolveCalibrationAnchors(
  { lat: -12.1, lng: -77.1 },
  [
    {
      location_name: 'Centro verificable',
      normalized_name: 'centro verificable',
      pricing_corridor: 'NORTH',
      reference_price: 50,
      center_route_distance_km: null,
      center_lat: null,
      center_lng: null,
      center_reference_name: 'Municipalidad verificable',
    },
  ],
  {
    geocodeReference: async () => ({ lat: -12.2, lng: -77.2 }),
    route: async (origin, destination) => {
      assert.deepEqual(origin, { lat: -12.1, lng: -77.1 });
      assert.deepEqual(destination, { lat: -12.2, lng: -77.2 });
      return { provider: 'osrm', distanceKm: 14, durationSeconds: 1200 };
    },
  }
);
assert.deepEqual(bootstrapped, [
  { name: 'Centro verificable', corridor: 'NORTH', distanceKm: 14, price: 50 },
]);

function query(data, error = null) {
  const result = Promise.resolve({ data, error });
  const chain = {
    select: () => chain,
    eq: () => chain,
    limit: () => result,
    then: result.then.bind(result),
  };
  return chain;
}

function row(name, corridor, distance, price, options = {}) {
  return {
    location_name: name,
    normalized_name: canonicalLocationName(name),
    location_type: options.locationType ?? 'DISTRICT',
    department: options.department ?? 'Lima',
    province: options.province ?? 'Lima',
    district: options.locationType === 'LOCALITY' ? null : name,
    aliases: options.aliases ?? [],
    center_lat: null,
    center_lng: null,
    center_reference_name: `${name} centro`,
    center_route_distance_km: distance,
    reference_price: price,
    center_tolerance_km: 1,
    before_center_adjustment: -5,
    after_center_adjustment: 10,
    pricing_corridor: corridor,
    coverage_type: options.coverageType ?? 'METROPOLITAN',
  };
}

const calibrationRows = [
  row('Los Olivos', 'NORTH', 10, 50),
  row('Comas', 'NORTH', 20, 70),
  row('Puente Piedra', 'NORTH', 30, 80),
  row('La Victoria', 'CENTRAL', 12, 200),
  row('Chorrillos', 'SOUTH', 25, 160),
  row('Lurigancho-Chosica', 'EAST', 35, 290, { aliases: ['Chosica', 'Lurigancho'] }),
  row('Carabayllo', 'NORTH', null, null),
  row('Ate', 'EAST', null, null),
  row('Villa El Salvador', 'SOUTH', null, null),
  row('Lima', 'CENTRAL', null, null),
  ...['Chancay', 'Huaral', 'Huacho', 'Barranca'].map((name) =>
    row(name, 'NORTH', null, null, {
      locationType: 'LOCALITY',
      province: name === 'Huacho' ? 'Huaura' : name,
      coverageType: 'NEAR_LIMA',
    })
  ),
];
const rule = {
  minimum_extrapolation_rate: null,
  maximum_extrapolation_rate: null,
  rounding_increment: 5,
};
const supabase = {
  from: (table) => query(table === 'shipping_price_calibrations' ? calibrationRows : [rule]),
};
const factorOne = {
  factor: 1,
  productId: 'product-id',
  productName: 'Producto real',
  shippingCategory: 'SECCIONAL',
  source: 'products.shipping_factor',
};

async function quoteFor(name, distanceKm, factor = factorOne) {
  return buildShippingQuote(supabase, { lat: -11.9, lng: -77.1 }, factor, {
    getOrigin: async () => ({ lat: -12.1, lng: -77.1 }),
    geocode: async () => ({
      address: name,
      districtCandidates: [name],
      locality: name,
      province: name,
      department: 'Lima',
    }),
    route: async () => ({ provider: 'osrm', distanceKm, durationSeconds: distanceKm * 100 }),
  });
}

for (const [name, near, center, far, expected] of [
  ['Los Olivos', 8, 10, 12, [45, 50, 60]],
  ['Comas', 18, 20, 22, [65, 70, 80]],
  ['Puente Piedra', 28, 30, 32, [75, 80, 90]],
]) {
  const quotes = await Promise.all([
    quoteFor(name, near),
    quoteFor(name, center),
    quoteFor(name, far),
  ]);
  assert.deepEqual(
    quotes.map((quote) => quote.pricing.finalPrice),
    expected,
    `${name} debe respetar cerca/centro/lejos`
  );
  assert.ok(quotes.every((quote) => !quote.requiresQuote));
}

for (const [name, distance, expected] of [
  ['La Victoria', 12, 200],
  ['Chorrillos', 25, 160],
  ['Chosica', 35, 290],
]) {
  const quote = await quoteFor(name, distance);
  assert.equal(quote.requiresQuote, false);
  assert.equal(quote.pricing.finalPrice, expected);
}

for (const [name, distance] of [
  ['Carabayllo', 25],
  ['Ate', 24],
  ['Villa El Salvador', 28],
  ['Lima', 9],
  ['Chancay', 40],
  ['Huaral', 50],
  ['Huacho', 60],
  ['Barranca', 70],
]) {
  const quote = await quoteFor(name, distance);
  assert.equal(quote.requiresQuote, false, `${name} debe calcular automáticamente`);
  assert.ok(quote.pricing.finalPrice > 0);
  assert.ok(['INTERPOLATED', 'CORRIDOR_EXTRAPOLATED'].includes(quote.pricing.pricingMode));
}

const localityOnlyQuote = await buildShippingQuote(
  supabase,
  { lat: -11.9, lng: -77.1 },
  factorOne,
  {
    getOrigin: async () => ({ lat: -12.1, lng: -77.1 }),
    geocode: async () => ({
      address: 'Huaral',
      districtCandidates: [],
      locality: 'Huaral',
      province: 'Huaral',
      department: 'Lima',
    }),
    route: async () => ({ provider: 'osrm', distanceKm: 50, durationSeconds: 5000 }),
  }
);
assert.equal(localityOnlyQuote.requiresQuote, false);
await assert.rejects(() =>
  buildShippingQuote(supabase, { lat: -11.9, lng: -77.1 }, factorOne, {
    getOrigin: async () => ({ lat: -12.1, lng: -77.1 }),
    geocode: async () => ({
      address: 'Los Olivos',
      districtCandidates: ['Los Olivos'],
      locality: 'Los Olivos',
      province: 'Lima',
      department: 'Lima',
    }),
    route: async () => {
      throw new Error('routing failed');
    },
  })
);

const factorQuote = await quoteFor('Los Olivos', 10, { ...factorOne, factor: 1.5 });
assert.equal(factorQuote.pricing.commercialRoutePrice, 50);
assert.equal(factorQuote.pricing.productAdjustment, 25);
assert.equal(factorQuote.pricing.finalPrice, 75);

const noAnchorSupabase = {
  from: (table) =>
    query(table === 'shipping_price_calibrations' ? [row('Destino', 'NORTH', null, null)] : [rule]),
};
const manualQuote = await buildShippingQuote(noAnchorSupabase, { lat: -12, lng: -77 }, factorOne, {
  getOrigin: async () => ({ lat: -12.1, lng: -77.1 }),
  geocode: async () => ({
    address: 'Destino',
    districtCandidates: ['Destino'],
    locality: 'Destino',
    province: 'Lima',
    department: 'Lima',
  }),
  route: async () => ({ provider: 'osrm', distanceKm: 10, durationSeconds: 1000 }),
  geocodeReference: async () => {
    throw new Error('unavailable');
  },
});
assert.equal(
  manualQuote.requiresQuote,
  true,
  'solo la ausencia absoluta de anchors exige cotización'
);

const checkoutSource = readFileSync(
  new URL('../src/app/api/checkout/route.ts', import.meta.url),
  'utf8'
);
assert.match(
  checkoutSource,
  /buildShippingQuote\(adminForQuote, destinationCoordinate, productFactor\)/
);
assert.doesNotMatch(checkoutSource, /shippingPrice/);
const cartSource = readFileSync(
  new URL('../src/app/components/CartDrawer.tsx', import.meta.url),
  'utf8'
);
assert.match(cartSource, /setSelectedLocation\(location\);\s+setShippingQuote\(null\)/);
console.info('shipping v5 corridor curve, bootstrap, coverage and checkout tests passed');

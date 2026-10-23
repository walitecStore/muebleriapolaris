// Exercise the actual server quote module with provider response fixtures, not
// assertions against source text. Node's resolver maps the project's TS alias.
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'server-only')
      return { url: 'data:text/javascript,export {};', shortCircuit: true };
    if (specifier.startsWith('@/'))
      return next(new URL('../src/' + specifier.slice(2) + '.ts', import.meta.url).href, context);
    if (
      specifier.startsWith('.') &&
      !/\.[a-z]+$/i.test(specifier) &&
      context.parentURL?.includes('/src/')
    )
      return next(new URL(specifier + '.ts', context.parentURL).href, context);
    return next(specifier, context);
  },
});
const { buildShippingQuote } = await import('../src/lib/server/shipping-quote.ts');
const origin = { origin_lat: -11.993057, origin_lng: -77.071283, origin_address: 'Test origin' };
const center = (district, price = null) => ({
  district,
  aliases: district === 'San Martín de Porres' ? ['San Martin de Porres'] : [],
  province: 'Lima',
  department: 'Lima',
  active: true,
  automatic_shipping: true,
  center_route_distance_km: null,
  base_shipping_price: price,
  center_tolerance_km: 1.5,
  before_center_adjustment: -5,
  after_center_adjustment: 10,
  minimum_shipping_price: 0,
  maximum_shipping_price: null,
});
const centers = [center('Comas', 70), center('Miraflores'), center('San Martín de Porres')];
const bands = [
  {
    min_distance_km: 0,
    max_distance_km: 8,
    base_cost: 70,
    cost_per_extra_km: 0,
    minimum_cost: 70,
    priority: 10,
  },
  {
    min_distance_km: 8,
    max_distance_km: 15,
    base_cost: 120,
    cost_per_extra_km: 0,
    minimum_cost: 70,
    priority: 10,
  },
  {
    min_distance_km: 15,
    max_distance_km: 25,
    base_cost: 180,
    cost_per_extra_km: 0,
    minimum_cost: 70,
    priority: 10,
  },
];
function db() {
  return {
    from(table) {
      const result = {
        data:
          table === 'store_settings'
            ? origin
            : table === 'shipping_district_centers'
              ? centers
              : bands,
        error: null,
      };
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        order() {
          return q;
        },
        single() {
          return Promise.resolve(result);
        },
        then(a, b) {
          return Promise.resolve(result).then(a, b);
        },
      };
      return q;
    },
  };
}
let calls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  const url = new URL(input);
  calls.push(url);
  if (url.hostname === 'nominatim.openstreetmap.org') {
    const lat = Number(url.searchParams.get('lat'));
    const city =
      lat === -11.95
        ? 'Comas'
        : lat === -12.12
          ? 'Miraflores'
          : lat === -12.03
            ? 'San Martin de Porres'
            : 'Callao';
    return Response.json({
      display_name: city + ', Perú',
      address: {
        suburb: city,
        city,
        state_district: city === 'Callao' ? 'Callao' : 'Lima Metropolitana',
        state: city === 'Callao' ? 'Callao' : 'Lima',
      },
    });
  }
  if (url.hostname === 'router.project-osrm.org') {
    const far = url.pathname.includes('-12.12');
    return Response.json({
      code: 'Ok',
      routes: [{ distance: far ? 18000 : 6077.5, duration: 1200 }],
    });
  }
  throw new Error('Unexpected provider ' + url.hostname);
};
try {
  await test('Comas location from a real Nominatim address shape is covered and uses S/70', async () => {
    const quote = await buildShippingQuote(db(), -11.95, -77.06, 1);
    assert.equal(quote.status, 'calculated');
    assert.equal(quote.destination.district, 'Comas');
    assert.equal(quote.destination.isLimaMetropolitana, true);
    assert.equal(quote.shippingCost, 70);
    assert.equal(calls.length, 2, 'Unnecessary center geocoding calls');
    await buildShippingQuote(db(), -11.95, -77.06, 1);
    assert.equal(calls.length, 2, 'Quote retry bypassed route cache');
  });
  await test('unpriced Miraflores uses configured road bands and product volume factor', async () => {
    const quote = await buildShippingQuote(db(), -12.12, -77.03, 1.5);
    assert.equal(quote.status, 'calculated');
    assert.equal(quote.shippingCost, 270);
    assert.equal(quote.audit.basePrice, 180);
    assert.equal(quote.destination.district, 'Miraflores');
  });
  await test('accentless San Martin resolves the configured district and Callao needs a quote', async () => {
    const smp = await buildShippingQuote(db(), -12.03, -77.07, 1);
    assert.equal(smp.status, 'calculated');
    assert.equal(smp.destination.district, 'San Martín de Porres');
    assert.equal(smp.shippingCost, 70);
    const callao = await buildShippingQuote(db(), -12.05, -77.12, 1);
    assert.equal(callao.status, 'requires_quote');
  });
  await test('invalid destinations fail before any external lookup', async () => {
    const before = calls.length;
    await assert.rejects(buildShippingQuote(db(), 0, 0, 1), /Perú/);
    assert.equal(calls.length, before);
  });
} finally {
  globalThis.fetch = originalFetch;
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeAuthDestination } from '../src/lib/auth-redirect.ts';
import { salesRange, limaDate, csvCell } from '../src/lib/sales-period.ts';
import { validCheckoutBody } from '../src/lib/checkout-validation.ts';
import { manualPaymentReady } from '../src/lib/payments.ts';
test('authentication rejects external, protocol-relative and backslash redirects', () => {
  for (const next of [
    'https://attacker.test',
    '//attacker.test',
    '/\\attacker.test',
    '/\n//attacker.test',
    null,
  ])
    assert.equal(safeAuthDestination(next), '/');
  assert.equal(safeAuthDestination('/restablecer-contrasena'), '/restablecer-contrasena');
  assert.equal(safeAuthDestination('/admin?tab=products'), '/admin?tab=products');
});
test('Peru periods use midnight Lima, Monday weeks and exclusive end dates', () => {
  assert.equal(limaDate(new Date('2026-01-01T02:00:00Z')), '2025-12-31');
  assert.deepEqual(salesRange('day', '2026-10-23'), {
    start: '2026-10-23T05:00:00.000Z',
    end: '2026-10-24T05:00:00.000Z',
  });
  assert.deepEqual(salesRange('week', '2026-01-01'), {
    start: '2025-12-29T05:00:00.000Z',
    end: '2026-01-05T05:00:00.000Z',
  });
  assert.deepEqual(salesRange('month', '2024-02-29'), {
    start: '2024-02-01T05:00:00.000Z',
    end: '2024-03-01T05:00:00.000Z',
  });
  assert.deepEqual(salesRange('year', '2026-12-31'), {
    start: '2026-01-01T05:00:00.000Z',
    end: '2027-01-01T05:00:00.000Z',
  });
  for (const d of ['2026-02-30', 'not-a-date', '1900-01-01', '2026-13-01'])
    assert.throws(() => salesRange('day', d));
  assert.throws(() => salesRange('bogus', '2026-01-01'));
});
test('CSV escapes quotes and formula injection in exported names', () => {
  assert.equal(csvCell('name,"quoted"'), '"name,""quoted"""');
  assert.equal(csvCell('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvCell('  +danger'), '"\'  +danger"');
});
test('checkout requires stable keys, UUIDs, integer quantities and finite Peru coordinates', () => {
  const body = {
    checkoutKey: '11111111-1111-4111-8111-111111111111',
    items: [{ productId: '22222222-2222-4222-8222-222222222222', quantity: 1 }],
    shipping: { latitude: -12, longitude: -77, reference: 'Address' },
  };
  assert.equal(validCheckoutBody(body), true);
  for (const quantity of [null, 0, -1, 1.5, 100, '2'])
    assert.equal(validCheckoutBody({ ...body, items: [{ ...body.items[0], quantity }] }), false);
  assert.equal(validCheckoutBody({ ...body, checkoutKey: undefined }), false);
  assert.equal(validCheckoutBody({ ...body, items: [{ productId: '1', quantity: 1 }] }), false);
  assert.equal(validCheckoutBody({ ...body, shipping: { latitude: null, longitude: -77 } }), false);
  assert.equal(
    validCheckoutBody({ ...body, shipping: { latitude: -12, longitude: Infinity } }),
    false
  );
});
test('only configured operational manual payments can be advertised', () => {
  assert.equal(manualPaymentReady({ code: 'card', metadata: {} }), false);
  assert.equal(
    manualPaymentReady({
      code: 'yape',
      metadata: {
        qr_url: 'https://example.test/qr',
        account_holder: 'Store',
        phone: '51999999999',
      },
    }),
    true
  );
  assert.equal(
    manualPaymentReady({ code: 'yape', metadata: { qr_url: 'http://example.test/qr' } }),
    false
  );
  assert.equal(
    manualPaymentReady({
      code: 'bank_transfer',
      metadata: { bank: 'Bank', account_holder: 'Store', account_number: '123' },
    }),
    true
  );
  assert.equal(manualPaymentReady({ code: 'bank_transfer', metadata: { bank: 'Bank' } }), false);
});

import { calculateDistrictShipping } from '../src/lib/shipping-pricing.ts';
test('shipping rounding respects commercial caps and exact tolerance boundaries', () => {
  const base = {
    centerDistanceKm: 10,
    userDistanceKm: 10,
    basePrice: 82,
    toleranceKm: 1.5,
    beforeAdjustment: -5,
    afterAdjustment: 10,
    minimumPrice: 82,
    maximumPrice: 83,
  };
  assert.equal(calculateDistrictShipping(base).shippingCost, 82);
  assert.equal(calculateDistrictShipping({ ...base, basePrice: 84 }).shippingCost, 83);
  assert.equal(
    calculateDistrictShipping({ ...base, centerDistanceKm: 10.12, userDistanceKm: 11.62 }).position,
    'center'
  );
});

import { readRequestJson } from '../src/lib/request-json.ts';
test('request limits apply without Content-Length and reject malformed JSON', async () => {
  const make = (text) => new Request('http://localhost/test', { method: 'POST', body: text });
  assert.deepEqual(await readRequestJson(make('{"ok":true}'), 32), { ok: true });
  await assert.rejects(
    () => readRequestJson(make('not-json')),
    (e) => e.status === 400
  );
  await assert.rejects(
    () => readRequestJson(make(JSON.stringify({ large: 'x'.repeat(100) })), 32),
    (e) => e.status === 413
  );
});

import { shippingLocationDetails } from '../src/lib/shipping-pricing.ts';
import { eligibleDiscount } from '../src/lib/discovery.ts';
test('Nominatim Lima cities use state_district to verify metropolitan coverage', () => {
  const comas = shippingLocationDetails(
    {
      city: 'Comas',
      suburb: 'Comas',
      state_district: 'Lima Metropolitana',
      region: 'Lima',
      state: 'Lima',
    },
    'Comas, Lima'
  );
  assert.equal(comas.district, 'Comas');
  assert.equal(comas.isLimaMetropolitana, true);
  assert.equal(
    shippingLocationDetails(
      { city: 'Miraflores', state_district: 'Lima Metropolitana', state: 'Lima' },
      'Miraflores'
    ).isLimaMetropolitana,
    true
  );
  assert.equal(
    shippingLocationDetails({ city: 'Callao', state: 'Callao' }, 'Callao').isLimaMetropolitana,
    false
  );
  assert.equal(
    shippingLocationDetails({ city: 'Huacho', county: 'Huaura', state: 'Lima' }, 'Huacho')
      .isLimaMetropolitana,
    false
  );
});
test('tier discounts are exact multiples of 150 and never apply to shipping', () => {
  for (const [total, discount] of [
    [0, 0],
    [149.99, 0],
    [150, 10],
    [299.99, 10],
    [300, 20],
    [450, 30],
  ])
    assert.equal(eligibleDiscount(total), discount);
  const body = {
    checkoutKey: '11111111-1111-4111-8111-111111111111',
    items: [{ productId: '22222222-2222-4222-8222-222222222222', quantity: 1 }],
    shipping: { latitude: -12, longitude: -77 },
    couponId: 'invalid',
  };
  assert.equal(validCheckoutBody(body), false);
});

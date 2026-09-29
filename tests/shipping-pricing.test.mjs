import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  calculateDistrictShipping,
  interpolateCenterPrice,
  isValidPeruCoordinate,
  nullableFiniteNumber,
  territoryKind,
} from '../src/lib/shipping-pricing.ts';

// Distancias ficticias exclusivamente para probar el motor puro; no son datos de producción.
const fixture = {
  centerDistanceKm: 10,
  userDistanceKm: 10,
  basePrice: 70,
  toleranceKm: 1,
  beforeAdjustment: -5,
  afterAdjustment: 10,
  minimumPrice: 0,
};
assert.equal(nullableFiniteNumber(null), null, 'NULL no debe convertirse en cero');
assert.equal(nullableFiniteNumber(undefined), null);
assert.equal(nullableFiniteNumber(''), null);
assert.equal(nullableFiniteNumber('0'), 0);
assert.equal(isValidPeruCoordinate(-12.05, -77.04), true);
assert.equal(isValidPeruCoordinate(null, null), false);
assert.equal(isValidPeruCoordinate(0, 0), false);
const nullableBase = nullableFiniteNumber(null);
const interpolatedBase =
  nullableBase ??
  interpolateCenterPrice(15, [
    { distanceKm: 10, price: 50 },
    { distanceKm: 20, price: 100 },
  ]);
assert.equal(interpolatedBase, 75, 'una tarifa NULL debe interpolarse');
assert.equal(territoryKind('Lima Metropolitana', 'Lima'), 'lima_metropolitana');
assert.equal(
  territoryKind('Provincia Constitucional del Callao', 'Callao'),
  'callao',
  'La Perla/Callao no debe clasificarse como Provincia de Lima'
);
assert.equal(calculateDistrictShipping(fixture).shippingCost, 70);
assert.equal(calculateDistrictShipping({ ...fixture, userDistanceKm: 8 }).shippingCost, 65);
assert.equal(calculateDistrictShipping({ ...fixture, userDistanceKm: 12 }).shippingCost, 80);
assert.equal(
  calculateDistrictShipping({ ...fixture, basePrice: 70, productFactor: 1.5 }).shippingCost,
  105,
  'el factor se aplica a la tarifa de ruta antes del ajuste'
);
const puente = { ...fixture, basePrice: 75, minimumPrice: 80, maximumPrice: 115 };
assert.equal(calculateDistrictShipping({ ...puente, userDistanceKm: 8 }).shippingCost, 80);
assert.equal(calculateDistrictShipping({ ...puente, userDistanceKm: 12 }).shippingCost, 85);
assert.ok(calculateDistrictShipping({ ...puente, basePrice: 200 }).shippingCost <= 115);
assert.throws(() => calculateDistrictShipping({ ...fixture, userDistanceKm: -1 }));
assert.throws(() =>
  interpolateCenterPrice(Number.NaN, [
    { distanceKm: 1, price: 1 },
    { distanceKm: 2, price: 2 },
  ])
);
const migration = readFileSync(
  new URL(
    '../supabase/migrations/20260929180000_stage_5_6_shipping_payments_refunds_fix.sql',
    import.meta.url
  ),
  'utf8'
);
assert.match(
  migration,
  /REVOKE ALL ON FUNCTION public\.create_validated_order[\s\S]+authenticated/
);
assert.match(
  migration,
  /GRANT EXECUTE ON FUNCTION public\.create_server_validated_order[\s\S]+service_role/
);
assert.match(migration, /v_shipping IS NULL OR v_shipping<0 OR abs\(v_shipping-v_expected\)>0\.01/);
assert.match(migration, /v_factor:=GREATEST\(v_factor,COALESCE\(v_product\.shipping_factor,1\)\)/);
assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\(p_order_item_id::text,0\)\)/);
console.info('shipping pricing and security tests passed');

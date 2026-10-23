const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validCheckoutBody(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const b = value as Record<string, unknown>;
  if (
    typeof b.checkoutKey !== 'string' ||
    !uuid.test(b.checkoutKey) ||
    !Array.isArray(b.items) ||
    b.items.length < 1 ||
    b.items.length > 50
  )
    return false;
  if (
    !b.items.every((item: unknown) => {
      if (!item || typeof item !== 'object') return false;
      const i = item as Record<string, unknown>;
      return (
        typeof i.productId === 'string' &&
        uuid.test(i.productId) &&
        (i.variantId === null ||
          i.variantId === undefined ||
          (typeof i.variantId === 'string' && uuid.test(i.variantId))) &&
        Number.isInteger(i.quantity) &&
        Number(i.quantity) >= 1 &&
        Number(i.quantity) <= 99
      );
    })
  )
    return false;
  const s = b.shipping as Record<string, unknown> | undefined;
  return (
    !!s &&
    typeof s.latitude === 'number' &&
    Number.isFinite(s.latitude) &&
    s.latitude >= -18.5 &&
    s.latitude <= -3 &&
    typeof s.longitude === 'number' &&
    Number.isFinite(s.longitude) &&
    s.longitude >= -82 &&
    s.longitude <= -68 &&
    (s.reference === undefined || (typeof s.reference === 'string' && s.reference.length <= 500))
  );
}

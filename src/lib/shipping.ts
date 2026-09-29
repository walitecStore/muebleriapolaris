export type ShippingResult = {
  distanceKm: number;
  shippingCost: number;
  category: string;
  requiresWhatsApp: boolean;
};

/**
 * Distancia geográfica aproximada entre dos coordenadas.
 */
export function calculateStraightDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export async function calculateShipping(
  latitude: number,
  longitude: number,
  category: string
): Promise<ShippingResult> {
  const normalizedCategory = category.toUpperCase();
  const response = await fetch('/api/shipping', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude,
      longitude,
      categories: [normalizedCategory],
    }),
  });

  if (!response.ok) {
    throw new Error('No se pudo calcular el envío');
  }

  const data = await response.json();
  const requiresWhatsApp = data.status === 'requires_quote';

  return {
    distanceKm: Number(data.destination?.distanceKm || 0),
    shippingCost: Number(data.shippingCost || 0),
    category: normalizedCategory,
    requiresWhatsApp,
  };
}

export type Coordinate = { lat: number; lng: number };
export type RouteResult = {
  provider: 'google' | 'osrm';
  distanceKm: number;
  durationSeconds: number;
};

export type GeocodedLocation = {
  address: string;
  districtCandidates: string[];
  locality: string | null;
  province: string | null;
  department: string | null;
};

export type NormalizedDestination = {
  district: string | null;
  province: string | null;
  department: string | null;
  locality: string | null;
};

export type ShippingErrorCode =
  | 'INVALID_COORDINATES'
  | 'ORIGIN_NOT_CONFIGURED'
  | 'GEOCODING_FAILED'
  | 'DISTRICT_NOT_COVERED'
  | 'ROUTING_FAILED'
  | 'SHIPPING_CONFIG_ERROR';

export class ShippingError extends Error {
  readonly code: ShippingErrorCode;
  constructor(code: ShippingErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ShippingError';
  }
}

let cachedOriginAddress: string | null = null;
let cachedOriginPromise: Promise<Coordinate> | null = null;
const referenceCoordinateCache = new Map<string, Promise<Coordinate>>();

async function geocodeAddressCoordinate(
  address: string,
  fetcher: typeof fetch,
  errorMessage: string
): Promise<Coordinate> {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
  if (key) {
    try {
      const response = await fetcher(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=pe&language=es&key=${encodeURIComponent(key)}`,
        { cache: 'no-store' }
      );
      const point = response.ok ? (await response.json())?.results?.[0]?.geometry?.location : null;
      if (isValidCoordinate(point?.lat, point?.lng) && !(point.lat === 0 && point.lng === 0))
        return { lat: point.lat, lng: point.lng };
    } catch {
      // Nominatim is the explicit geocoding fallback.
    }
  }
  try {
    const response = await fetcher(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=pe&q=${encodeURIComponent(address)}`,
      {
        headers: { 'User-Agent': 'MuebleriaPolaris/1.0 (shipping-origin)' },
        cache: 'no-store',
      }
    );
    const point = response.ok ? (await response.json())?.[0] : null;
    const coordinate = parseCoordinatePair(point?.lat, point?.lon);
    if (coordinate && !(coordinate.lat === 0 && coordinate.lng === 0)) return coordinate;
  } catch {
    // Converted to a controlled configuration error below.
  }
  throw new ShippingError('ORIGIN_NOT_CONFIGURED', errorMessage);
}

/** Única fuente del origen; coordinates win, otherwise the configured address is geocoded once. */
export async function getShippingOrigin(fetcher: typeof fetch = fetch): Promise<Coordinate> {
  const latRaw = process.env.SHIPPING_ORIGIN_LAT?.trim();
  const lngRaw = process.env.SHIPPING_ORIGIN_LNG?.trim();
  if (latRaw || lngRaw) {
    if (!latRaw || !lngRaw)
      throw new ShippingError(
        'ORIGIN_NOT_CONFIGURED',
        'Las dos coordenadas del origen deben configurarse juntas.'
      );
    const coordinate = parseCoordinatePair(latRaw, lngRaw);
    if (!coordinate || (coordinate.lat === 0 && coordinate.lng === 0))
      throw new ShippingError(
        'ORIGIN_NOT_CONFIGURED',
        'Las coordenadas del origen configurado no son válidas.'
      );
    return coordinate;
  }
  const address = process.env.SHIPPING_ORIGIN_ADDRESS?.trim();
  if (!address)
    throw new ShippingError('ORIGIN_NOT_CONFIGURED', 'No existe un origen logístico configurado.');
  if (cachedOriginAddress !== address || !cachedOriginPromise) {
    cachedOriginAddress = address;
    cachedOriginPromise = geocodeAddressCoordinate(
      address,
      fetcher,
      'No se pudo verificar la dirección del origen logístico.'
    ).catch((error) => {
      cachedOriginPromise = null;
      throw error;
    });
  }
  return cachedOriginPromise;
}

export async function geocodeReferenceLocation(
  reference: string,
  fetcher: typeof fetch = fetch
): Promise<Coordinate> {
  const key = reference.trim();
  if (!key)
    throw new ShippingError('SHIPPING_CONFIG_ERROR', 'La referencia de calibración está vacía.');
  if (!referenceCoordinateCache.has(key)) {
    referenceCoordinateCache.set(
      key,
      geocodeAddressCoordinate(
        key,
        fetcher,
        `No se pudo verificar el centro de calibración: ${key}.`
      ).catch((error) => {
        referenceCoordinateCache.delete(key);
        throw error;
      })
    );
  }
  return referenceCoordinateCache.get(key)!;
}

export function clearShippingOriginCacheForTests() {
  cachedOriginAddress = null;
  cachedOriginPromise = null;
  referenceCoordinateCache.clear();
}

export function isValidCoordinate(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function parseCoordinatePair(lat: unknown, lng: unknown): Coordinate | null {
  if (
    (typeof lat !== 'number' && typeof lat !== 'string') ||
    (typeof lng !== 'number' && typeof lng !== 'string')
  )
    return null;
  if (typeof lat === 'string' && !lat.trim()) return null;
  if (typeof lng === 'string' && !lng.trim()) return null;
  const parsedLat = typeof lat === 'number' ? lat : Number(lat);
  const parsedLng = typeof lng === 'number' ? lng : Number(lng);
  return isValidCoordinate(parsedLat, parsedLng) ? { lat: parsedLat, lng: parsedLng } : null;
}

export function validateRouteResult(route: RouteResult): RouteResult {
  if (!Number.isFinite(route.distanceKm) || route.distanceKm <= 0)
    throw new ShippingError('ROUTING_FAILED', 'El proveedor devolvió una distancia inválida.');
  if (!Number.isFinite(route.durationSeconds) || route.durationSeconds <= 0)
    throw new ShippingError('ROUTING_FAILED', 'El proveedor devolvió una duración inválida.');
  return route;
}

export async function routeWithGoogle(
  origin: Coordinate,
  destination: Coordinate,
  key: string,
  fetcher: typeof fetch = fetch
): Promise<RouteResult> {
  const response = await fetcher('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: {
        location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
      },
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Google Routes falló con estado ${response.status}.`);
  const data = await response.json();
  const first = data?.routes?.[0];
  const durationSeconds = Number(String(first?.duration ?? '').replace(/s$/, ''));
  return validateRouteResult({
    provider: 'google',
    distanceKm: Number(first?.distanceMeters) / 1000,
    durationSeconds,
  });
}

export async function routeWithOsrm(
  origin: Coordinate,
  destination: Coordinate,
  fetcher: typeof fetch = fetch
): Promise<RouteResult> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false&steps=false`;
  const response = await fetcher(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`OSRM falló con estado ${response.status}.`);
  const data = await response.json();
  const first = data?.routes?.[0];
  return validateRouteResult({
    provider: 'osrm',
    distanceKm: Number(first?.distance) / 1000,
    durationSeconds: Number(first?.duration),
  });
}

export async function getDrivingRoute(
  origin: Coordinate,
  destination: Coordinate,
  fetcher: typeof fetch = fetch
) {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
  if (key) {
    try {
      return await routeWithGoogle(origin, destination, key, fetcher);
    } catch {
      // OSRM is the explicit fallback; no synthetic route is returned.
    }
  }
  try {
    return await routeWithOsrm(origin, destination, fetcher);
  } catch {
    throw new ShippingError(
      'ROUTING_FAILED',
      'No se encontró una ruta vial válida para el destino.'
    );
  }
}

function uniqueStrings(values: unknown[]) {
  return [
    ...new Set(
      values.filter((value): value is string => typeof value === 'string' && !!value.trim())
    ),
  ];
}

export async function reverseGeocode(
  destination: Coordinate,
  fetcher: typeof fetch = fetch
): Promise<GeocodedLocation> {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
  if (key) {
    try {
      const response = await fetcher(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${destination.lat},${destination.lng}&language=es&key=${encodeURIComponent(key)}`,
        { cache: 'no-store' }
      );
      const data = response.ok ? await response.json() : null;
      const result = data?.results?.[0];
      if (result) {
        const components = Object.fromEntries(
          result.address_components.flatMap((component: { long_name: string; types: string[] }) =>
            component.types.map((type) => [type, component.long_name])
          )
        );
        return {
          address: result.formatted_address,
          districtCandidates: uniqueStrings([
            components.administrative_area_level_3,
            components.sublocality_level_1,
            components.sublocality,
            components.locality,
          ]),
          locality:
            components.locality ?? components.sublocality_level_1 ?? components.sublocality ?? null,
          province: components.administrative_area_level_2 ?? null,
          department: components.administrative_area_level_1 ?? null,
        };
      }
    } catch {
      // Continue with Nominatim.
    }
  }
  try {
    const response = await fetcher(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${destination.lat}&lon=${destination.lng}&addressdetails=1&accept-language=es`,
      { headers: { 'User-Agent': 'MuebleriaPolaris/1.0 (shipping-checkout)' }, cache: 'no-store' }
    );
    const data = response.ok ? await response.json() : null;
    if (!data?.address) throw new Error('missing address');
    const address = data.address;
    return {
      address: data.display_name || 'Ubicación seleccionada',
      districtCandidates: uniqueStrings([
        address.city_district,
        address.district,
        address.suburb,
        address.city,
        address.town,
        address.municipality,
        address.county,
      ]),
      locality: address.city || address.town || address.municipality || address.suburb || null,
      province: address.province || address.county || address.city || null,
      department: address.state || address.region || null,
    };
  } catch {
    throw new ShippingError('GEOCODING_FAILED', 'No se pudo identificar el distrito del destino.');
  }
}

export function formatRouteDuration(durationSeconds: number) {
  const minutes = Math.max(1, Math.round(durationSeconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours} h` : `${hours} h ${remaining} min`;
}

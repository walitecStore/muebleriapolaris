import 'server-only';

export const STORE_LOCATION = {
  latitude: -11.993057,
  longitude: -77.071283,
  address: 'Av. 12 de Octubre 1805, San Martín de Porres, Lima',
} as const;

type LocationDetails = {
  address: string;
  district: string | null;
  province: string | null;
  department: string | null;
  isLimaMetropolitana: boolean;
};

export type VerifiedRoute = LocationDetails & {
  distanceKm: number;
  durationMinutes: number | null;
  provider: 'google' | 'osrm';
};

function validCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -18.5 &&
    latitude <= -3 &&
    longitude >= -82 &&
    longitude <= -68
  );
}

const normalized = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

function locationFromAddress(
  address: Record<string, string | undefined>,
  displayName: string
): LocationDetails {
  const district = address.city_district || address.district || address.suburb || null;
  const province = address.province || address.city || address.county || null;
  const department = address.state || address.region || null;
  const provinceName = normalized(province);
  const departmentName = normalized(department);
  const isLimaMetropolitana =
    provinceName === 'lima' ||
    provinceName.includes('provincia de lima') ||
    provinceName === 'callao' ||
    departmentName.includes('callao');

  return { address: displayName, district, province, department, isLimaMetropolitana };
}

async function reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails> {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (key) {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=es&key=${encodeURIComponent(key)}`,
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
      return locationFromAddress(
        {
          district:
            components.locality ||
            components.sublocality_level_1 ||
            components.administrative_area_level_3,
          province: components.administrative_area_level_2,
          state: components.administrative_area_level_1,
        },
        result.formatted_address
      );
    }
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=es`,
    {
      headers: { 'User-Agent': 'MuebleriaPolaris/1.0 (shipping-checkout)' },
      cache: 'no-store',
    }
  );
  const data = response.ok ? await response.json() : null;
  if (!data?.address) throw new Error('No se pudo identificar el distrito y la provincia.');
  return locationFromAddress(data.address, data.display_name || 'Ubicación seleccionada');
}

async function drivingRoute(latitude: number, longitude: number) {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (key) {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: STORE_LOCATION.latitude, longitude: STORE_LOCATION.longitude },
          },
        },
        destination: { location: { latLng: { latitude, longitude } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
      }),
      cache: 'no-store',
    });
    const data = response.ok ? await response.json() : null;
    const route = data?.routes?.[0];
    if (route?.distanceMeters) {
      return {
        distanceKm: Number(route.distanceMeters) / 1000,
        durationMinutes: route.duration
          ? Math.ceil(Number(String(route.duration).replace('s', '')) / 60)
          : null,
        provider: 'google' as const,
      };
    }
  }

  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${STORE_LOCATION.longitude},${STORE_LOCATION.latitude};${longitude},${latitude}?overview=false&alternatives=false&steps=false`,
    { headers: { Accept: 'application/json' }, cache: 'no-store' }
  );
  const data = response.ok ? await response.json() : null;
  const route = data?.routes?.[0];
  if (!route?.distance) throw new Error('No se encontró una ruta por carretera para el destino.');
  return {
    distanceKm: Number(route.distance) / 1000,
    durationMinutes: route.duration ? Math.ceil(Number(route.duration) / 60) : null,
    provider: 'osrm' as const,
  };
}

export async function verifyShippingDestination(
  latitude: number,
  longitude: number
): Promise<VerifiedRoute> {
  if (!validCoordinate(latitude, longitude))
    throw new Error('Las coordenadas no corresponden a Perú.');
  const [route, location] = await Promise.all([
    drivingRoute(latitude, longitude),
    reverseGeocode(latitude, longitude),
  ]);
  return { ...route, ...location, distanceKm: Number(route.distanceKm.toFixed(2)) };
}

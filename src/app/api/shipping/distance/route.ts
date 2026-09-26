import { NextResponse } from 'next/server';

/**
 * PUNTO DE PARTIDA
 *
 * Aquí colocaremos las coordenadas exactas
 * de tu punto de partida en San Martín de Porres.
 *
 * Por ahora NO vamos a inventar coordenadas definitivas.
 * Se dejará temporalmente el centro de SMP.
 */

const STORE_LATITUDE = -11.996;
const STORE_LONGITUDE = -77.083;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        {
          error: 'Coordenadas inválidas.',
        },
        {
          status: 400,
        }
      );
    }

    if (latitude < -18 || latitude > -3 || longitude < -82 || longitude > -68) {
      return NextResponse.json(
        {
          error: 'La ubicación seleccionada no corresponde a Perú.',
        },
        {
          status: 400,
        }
      );
    }

    const routeUrl =
      'https://router.project-osrm.org/route/v1/driving/' +
      `${STORE_LONGITUDE},${STORE_LATITUDE};` +
      `${longitude},${latitude}` +
      '?overview=false';

    const response = await fetch(routeUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: 'No fue posible calcular la ruta.',
        },
        {
          status: 502,
        }
      );
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
      return NextResponse.json(
        {
          error: 'No se encontró una ruta válida.',
        },
        {
          status: 422,
        }
      );
    }

    const route = data.routes[0];

    const distanceKm = Number(route.distance) / 1000;

    const durationMinutes = Number(route.duration) / 60;

    return NextResponse.json({
      success: true,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMinutes: Math.round(durationMinutes),
    });
  } catch (error) {
    console.error('Error calculando distancia:', error);

    return NextResponse.json(
      {
        error: 'Error interno calculando la distancia.',
      },
      {
        status: 500,
      }
    );
  }
}

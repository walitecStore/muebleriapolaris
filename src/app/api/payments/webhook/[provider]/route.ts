import { NextResponse } from 'next/server';

// Punto de extensión deliberadamente cerrado: cada adaptador deberá validar la firma
// antes de usar service_role, registrar event_id y aplicar el estado idempotentemente.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  return NextResponse.json(
    { error: `El proveedor ${provider} no está configurado; no se procesó el evento.` },
    { status: 501 }
  );
}

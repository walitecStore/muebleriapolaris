import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/server/admin';
import { limaDate, salesRange, type SalesPeriod } from '@/lib/sales-period';

export async function GET(request: NextRequest) {
  const { supabase, user, isAdmin } = await getAdminSession();
  if (!user || !isAdmin)
    return NextResponse.json(
      { error: 'Acceso administrativo requerido.' },
      { status: user ? 403 : 401 }
    );
  let range;
  try {
    range = salesRange(
      (request.nextUrl.searchParams.get('period') || 'day') as SalesPeriod,
      request.nextUrl.searchParams.get('date') || limaDate()
    );
  } catch {
    return NextResponse.json({ error: 'Período o fecha no válidos.' }, { status: 400 });
  }
  const { data, error } = await supabase.rpc('admin_sales_report', {
    p_start: range.start,
    p_end: range.end,
  });
  if (error) {
    console.error('admin_sales_report', error.code);
    return NextResponse.json(
      {
        error: 'No se pudo cargar el reporte. Comprueba que la migración del panel esté aplicada.',
      },
      { status: 503 }
    );
  }
  return NextResponse.json(
    { ...data, range },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}

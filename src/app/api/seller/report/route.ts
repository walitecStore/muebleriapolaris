import { NextResponse, NextRequest } from 'next/server';
import { getSellerSession } from '@/lib/server/seller';
import { limaDate, salesRange, type SalesPeriod } from '@/lib/sales-period';
export async function GET(request: NextRequest) {
  const { supabase, user } = await getSellerSession();
  if (!user) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });
  try {
    const range = salesRange(
      (request.nextUrl.searchParams.get('period') || 'month') as SalesPeriod,
      request.nextUrl.searchParams.get('date') || limaDate()
    );
    const { data, error } = await supabase.rpc('seller_sales_report', {
      p_start: range.start,
      p_end: range.end,
    });
    if (error)
      return NextResponse.json(
        { error: 'No se pudieron cargar tus estadísticas.' },
        { status: 503 }
      );
    return NextResponse.json(
      { ...data, range },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return NextResponse.json({ error: 'Fecha o período no válido.' }, { status: 400 });
  }
}

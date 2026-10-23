import { getSellerSession } from '@/lib/server/seller';
import { whatsappLink } from '@/lib/store-profile';
import Link from 'next/link';
export default async function Orders() {
  const { supabase, profile } = await getSellerSession();
  const { data, error } = await supabase.rpc('seller_orders');
  type Row = {
    id: string;
    order_number: string;
    created_at: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    status: string;
    payment_status: string;
    shipping_address: string | null;
    shipping_reference: string | null;
    shipping_district: string;
    delivery_vehicle: string;
    delivery_partner: string;
  };
  const rows = (data || []) as Row[];
  const { data: store } = await supabase
    .from('store_settings')
    .select('whatsapp')
    .eq('id', 1)
    .single();
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-10">
      <h1 className="text-3xl font-black">Ventas y entregas</h1>
      <p className="text-sm text-slate-600">
        Tus 200 líneas de pedido más recientes. La dirección se muestra después de aprobar el pago.
        Coordina el transporte antes de despachar; solo Polaris confirma pagos y estados globales.
      </p>
      {error ? (
        <p role="alert">No se pudieron cargar las ventas.</p>
      ) : !rows.length ? (
        <p>Aún no tienes ventas registradas.</p>
      ) : (
        rows.map((r) => (
          <article key={r.id} className="space-y-2 rounded-2xl border bg-white p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <h2 className="font-bold">
                {r.order_number} · {r.product_name}
              </h2>
              <strong>
                {(r.unit_price * r.quantity).toLocaleString('es-PE', {
                  style: 'currency',
                  currency: 'PEN',
                })}
              </strong>
            </div>
            <p className="text-sm">
              {r.quantity} unidad(es) · {r.status} · Pago: {r.payment_status}
            </p>
            <p className="text-sm">
              {r.shipping_district} · {r.delivery_vehicle === 'truck' ? 'Camión' : 'Motorizado'} ·{' '}
              {r.delivery_partner === 'polaris'
                ? 'Coordina con Polaris'
                : 'Transportista particular'}
            </p>
            {r.shipping_address && (
              <p className="text-sm">
                {r.shipping_address} · {r.shipping_reference}
              </p>
            )}
            {store?.whatsapp && (
              <Link
                href={
                  whatsappLink(
                    store.whatsapp,
                    `Soy ${profile?.display_name || 'vendedor'} de Polaris. Quiero coordinar la entrega del pedido ${r.order_number}: ${r.product_name}, ${r.quantity} unidades.`
                  ) || '/vender'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-cyan-700 underline"
              >
                Coordinar entrega
              </Link>
            )}
          </article>
        ))
      )}
    </main>
  );
}

import OrdersManager from '@/components/admin/OrdersManager';
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;
  return (
    <OrdersManager customerId={cliente && /^[0-9a-f-]{36}$/i.test(cliente) ? cliente : undefined} />
  );
}

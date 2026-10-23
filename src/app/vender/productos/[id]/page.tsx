import { redirect, notFound } from 'next/navigation';
import { getSellerSession } from '@/lib/server/seller';
import ProductEditor from '@/components/admin/ProductEditor';
export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { active, user, supabase } = await getSellerSession();
  if (!active || !user) redirect('/vender');
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) notFound();
  const { data } = await supabase
    .from('products')
    .select('id')
    .eq('id', id)
    .eq('seller_id', user.id)
    .maybeSingle();
  if (!data) notFound();
  return <ProductEditor id={id} sellerId={user.id} />;
}

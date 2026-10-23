import { redirect } from 'next/navigation';
import { getSellerSession } from '@/lib/server/seller';
import ProductEditor from '@/components/admin/ProductEditor';
export default async function New() {
  const { active, user } = await getSellerSession();
  if (!active || !user) redirect('/vender');
  return <ProductEditor sellerId={user.id} />;
}

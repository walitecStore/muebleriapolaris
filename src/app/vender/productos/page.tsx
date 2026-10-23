import { redirect } from 'next/navigation';
import { getSellerSession } from '@/lib/server/seller';
import ProductsManager from '@/components/admin/ProductsManager';
export default async function Products() {
  const { active, user } = await getSellerSession();
  if (!active || !user) redirect('/vender');
  return <ProductsManager sellerId={user.id} />;
}

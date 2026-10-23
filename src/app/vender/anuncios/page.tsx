import { redirect } from 'next/navigation';
import { getSellerSession } from '@/lib/server/seller';
import AdStudio from '@/components/seller/AdStudio';
export default async function Ads() {
  const { active } = await getSellerSession();
  if (!active) redirect('/vender');
  return <AdStudio />;
}

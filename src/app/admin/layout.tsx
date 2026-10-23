import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminSession } from '@/lib/server/admin';
import DashboardSidebar from '@/components/admin/DashboardSidebar';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Administración | Polaris',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = await getAdminSession();
  if (!user) redirect('/login?next=/admin');
  if (!isAdmin) redirect('/?access=denied');
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

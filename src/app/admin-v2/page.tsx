'use client';

import { useEffect, useState } from 'react';

import DashboardSidebar from '@/components/admin/DashboardSidebar';
import DashboardHeader from '@/components/admin/DashboardHeader';
import StatsCards from '@/components/admin/StatsCards';
import SalesChart from '@/components/admin/SalesChart';
import RecentOrders from '@/components/admin/RecentOrders';
import QuickActions from '@/components/admin/QuickActions';

import {
  getDashboardStats,
  type DashboardStats,
} from '@/lib/dashboardData';

const initialStats: DashboardStats = {
  totalProducts: 0,
  totalOrders: 0,
  totalUsers: 0,
  totalSales: 0,
};

export default function AdminV2Page() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        const data = await getDashboardStats();

        if (mounted) {
          setStats(data);
        }
      } catch (error) {
        console.error('Error cargando Dashboard:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Contenido principal */}
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <DashboardHeader />

        {/* Estadísticas */}
        <div className="mt-6">
          <StatsCards
            totalProducts={stats.totalProducts}
            totalOrders={stats.totalOrders}
            totalUsers={stats.totalUsers}
            totalSales={stats.totalSales}
          />
        </div>

        {/* Ventas */}
        <div className="mt-6">
          <SalesChart />
        </div>

        {/* Pedidos + acciones rápidas */}
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
          <RecentOrders />

          <QuickActions />
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="mt-3 text-right text-xs text-slate-400">
            Actualizando información...
          </div>
        )}
      </main>
    </div>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type OrderStatus = 'confirmado' | 'preparando' | 'empaquetando' | 'preparando_envio' | 'camino' | 'entregado' | 'cancelado';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products?: { name: string; image_url: string };
}

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  tracking_code: string | null;
  payment_method: string | null;
  created_at: string;
  estimated_delivery: string | null;
  order_items: OrderItem[];
  addresses?: { street: string; city: string; state: string; country: string } | null;
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'confirmado', label: 'Pedido confirmado', icon: '✅' },
  { key: 'preparando', label: 'Preparando artículo', icon: '🔧' },
  { key: 'empaquetando', label: 'Empaquetando', icon: '📦' },
  { key: 'preparando_envio', label: 'Preparando envío', icon: '🏷️' },
  { key: 'camino', label: 'En camino', icon: '🚚' },
  { key: 'entregado', label: 'Entregado', icon: '🎉' },
];

const STATUS_COLORS: Record<string, string> = {
  confirmado: '#6b7280',
  preparando: '#3b82f6',
  empaquetando: '#f59e0b',
  preparando_envio: '#f97316',
  camino: '#8b5cf6',
  entregado: '#22c55e',
};

function getStepIndex(status: OrderStatus): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function AnimatedCartBar({ status }: { status: OrderStatus }) {
  const stepIdx = getStepIndex(status);
  const progress = stepIdx < 0 ? 0 : (stepIdx / (STATUS_STEPS.length - 1)) * 100;
  const color = STATUS_COLORS[status] || '#6b7280';
  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimProgress(progress), 200);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-8">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-in-out"
          style={{ width: `${animProgress}%`, backgroundColor: color }}
        />
        {/* Cart icon on bar */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{ left: `calc(${animProgress}% - 16px)` }}
        >
          <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2" style={{ borderColor: color }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= stepIdx;
          const active = idx === stepIdx;
          return (
            <div key={step.key} className={`flex flex-col items-center gap-1.5 text-center transition-all duration-500 ${done ? 'opacity-100' : 'opacity-40'}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${
                  active ? 'scale-110 shadow-lg' : ''
                }`}
                style={{
                  backgroundColor: done ? color : '#f3f4f6',
                  borderColor: done ? color : '#e5e7eb',
                }}
              >
                {step.icon}
              </div>
              <span className={`text-xs font-semibold leading-tight ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Delivered celebration */}
      {status === 'entregado' && (
        <div className="mt-8 flex flex-col items-center gap-3 p-6 bg-green-50 border border-green-200 rounded-2xl animate-in-up">
          <div className="text-5xl animate-bounce">🎉</div>
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-extrabold text-green-700">¡Tu pedido fue entregado correctamente!</p>
          <p className="text-green-600 text-sm">Gracias por confiar en Mueblería Polaris. ¡Esperamos que disfrutes tu nuevo mueble!</p>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const stepIdx = getStepIndex(order.status);
  const color = STATUS_COLORS[order.status] || '#6b7280';

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium">Pedido</p>
          <p className="font-extrabold text-foreground text-sm font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Fecha</p>
          <p className="font-semibold text-foreground text-sm">{new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">Total</p>
          <p className="font-extrabold text-primary text-lg">S/ {Number(order.total).toFixed(2)}</p>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: color }}>
            {STATUS_STEPS[stepIdx]?.icon} {STATUS_STEPS[stepIdx]?.label || order.status}
          </span>
        </div>
      </div>

      {/* Animated progress */}
      <div className="px-6 py-6">
        <AnimatedCartBar status={order.status} />
      </div>

      {/* Items */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="px-6 pb-4 border-t border-border pt-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Productos</p>
          <div className="space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground font-medium">{item.products?.name || 'Producto'}</span>
                <span className="text-muted-foreground">x{item.quantity} — S/ {Number(item.unit_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Address & payment */}
      <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
        {order.addresses && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Dirección</p>
            <p className="text-sm text-foreground">{order.addresses.street}, {order.addresses.city}, {order.addresses.state}</p>
          </div>
        )}
        {order.payment_method && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Método de pago</p>
            <p className="text-sm text-foreground capitalize">{order.payment_method}</p>
          </div>
        )}
        {order.tracking_code && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Código de seguimiento</p>
            <p className="text-sm font-mono text-primary">{order.tracking_code}</p>
          </div>
        )}
        {order.estimated_delivery && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Entrega estimada</p>
            <p className="text-sm text-foreground">{new Date(order.estimated_delivery).toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PedidosPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, image_url)), addresses(street, city, state, country)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchOrders]);

  if (authLoading || loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Cargando pedidos...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-3xl p-10 text-center shadow-xl">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Mis Pedidos</h1>
            <p className="text-muted-foreground mb-6">Inicia sesión para ver el estado de tus pedidos.</p>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition-all">
              Iniciar sesión
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">📦 Mis Pedidos</h1>
            <p className="text-muted-foreground">
              {orders.length === 0 ? 'No tienes pedidos aún.' : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} encontrado${orders.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="text-7xl">🛋️</div>
              <p className="text-xl font-bold text-foreground">Aún no tienes pedidos</p>
              <p className="text-muted-foreground text-sm">Explora el catálogo y realiza tu primera compra</p>
              <Link href="/#catalogo" className="mt-4 px-8 py-3 bg-primary text-primary-foreground font-bold rounded-full hover:bg-primary/90 transition-all">
                Ver catálogo
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

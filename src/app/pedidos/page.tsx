'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isPaymentApproved, paymentStatusLabel } from '@/lib/payments';

type OrderStatus =
  | 'confirmado'
  | 'preparando'
  | 'empaquetando'
  | 'preparando_envio'
  | 'camino'
  | 'entregado'
  | 'cancelado';

type FilterStatus = 'todos' | OrderStatus;

interface Product {
  name: string;
  image_url?: string | null;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal?: number | null;
  product_name?: string | null;
  product_image_url?: string | null;
  variant_name?: string | null;
  products?: Product | null;
}

interface Address {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

interface Order {
  id: string;
  order_number?: string | null;
  user_id: string;
  status: OrderStatus;
  total: number;
  subtotal?: number | null;
  shipping_cost?: number | null;
  tracking_code?: string | null;
  payment_method?: string | null;
  payment_status?: string | null;
  payment_id?: string | null;
  payment_provider?: string | null;
  paid_at?: string | null;
  notes?: string | null;

  estimated_delivery?: string | null;
  created_at: string;
  updated_at?: string | null;

  shipping_latitude?: number | null;
  shipping_longitude?: number | null;
  shipping_place_id?: string | null;
  shipping_address?: string | null;
  shipping_reference?: string | null;
  shipping_department?: string | null;
  shipping_province?: string | null;
  shipping_district?: string | null;
  shipping_distance_km?: number | null;
  shipping_duration_minutes?: number | null;

  order_items: OrderItem[];

  addresses?: Address | Address[] | null;
}

const STATUS_STEPS: {
  key: OrderStatus;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    key: 'confirmado',
    label: 'Pedido confirmado',
    icon: '✅',
    description: 'Hemos recibido tu pedido.',
  },
  {
    key: 'preparando',
    label: 'Preparando artículo',
    icon: '🔧',
    description: 'Estamos preparando tus productos.',
  },
  {
    key: 'empaquetando',
    label: 'Empaquetando',
    icon: '📦',
    description: 'Estamos protegiendo y empaquetando tu pedido.',
  },
  {
    key: 'preparando_envio',
    label: 'Preparando envío',
    icon: '🏷️',
    description: 'Tu pedido está listo para salir.',
  },
  {
    key: 'camino',
    label: 'En camino',
    icon: '🚚',
    description: 'Tu pedido está siendo trasladado.',
  },
  {
    key: 'entregado',
    label: 'Entregado',
    icon: '🎉',
    description: 'Tu pedido fue entregado.',
  },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  confirmado: '#6b7280',
  preparando: '#3b82f6',
  empaquetando: '#f59e0b',
  preparando_envio: '#f97316',
  camino: '#8b5cf6',
  entregado: '#22c55e',
  cancelado: '#ef4444',
};

const FILTERS: {
  key: FilterStatus;
  label: string;
}[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'confirmado', label: 'Confirmados' },
  { key: 'preparando', label: 'Preparando' },
  { key: 'empaquetando', label: 'Empaquetando' },
  { key: 'preparando_envio', label: 'Preparando envío' },
  { key: 'camino', label: 'En camino' },
  { key: 'entregado', label: 'Entregados' },
  { key: 'cancelado', label: 'Cancelados' },
];

function getStepIndex(status: OrderStatus) {
  return STATUS_STEPS.findIndex((step) => step.key === status);
}

function formatCurrency(value: number | null | undefined) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return 'No disponible';

  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(value?: string | null) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusLabel(status: OrderStatus) {
  if (status === 'cancelado') return 'Pedido cancelado';

  return STATUS_STEPS.find((step) => step.key === status)?.label || status;
}

function getOrderNumber(order: Order) {
  return order.order_number || `POL-${order.id.slice(0, 8).toUpperCase()}`;
}

function itemName(item: OrderItem) {
  return item.product_name || item.products?.name || 'Producto';
}

function itemImage(item: OrderItem) {
  return item.product_image_url || item.products?.image_url || null;
}

function getAddress(order: Order) {
  if (order.shipping_address) {
    return order.shipping_address;
  }

  const address = Array.isArray(order.addresses) ? order.addresses[0] : order.addresses;

  if (!address) return 'Dirección no registrada';

  return [address.street, address.city, address.state, address.country].filter(Boolean).join(', ');
}

function getWhatsAppNumber() {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    ''
  ).replace(/\D/g, '');
}

function createWhatsAppMessage(order: Order) {
  return `Hola, deseo consultar el estado de mi pedido #${getOrderNumber(order)}.`;
}

function openWhatsApp(order: Order) {
  const message = createWhatsAppMessage(order);
  const number = getWhatsAppNumber();

  if (number) {
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
    return;
  }

  navigator.clipboard
    ?.writeText(message)
    .then(() => {
      alert(
        'El mensaje fue copiado. Configura NEXT_PUBLIC_WHATSAPP_NUMBER para abrir WhatsApp directamente.'
      );
    })
    .catch(() => {
      alert(message);
    });
}

function AnimatedCartBar({ status }: { status: OrderStatus }) {
  const stepIdx = getStepIndex(status);
  const progress = stepIdx < 0 ? 0 : (stepIdx / (STATUS_STEPS.length - 1)) * 100;

  const color = STATUS_COLORS[status] || STATUS_COLORS.confirmado;

  const [animProgress, setAnimProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimProgress(progress);
    }, 150);

    return () => clearTimeout(timer);
  }, [progress]);

  if (status === 'cancelado') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
        <div className="text-3xl mb-2">❌</div>
        <p className="font-extrabold text-red-700">Pedido cancelado</p>
        <p className="text-sm text-red-600 mt-1">
          Si necesitas ayuda, puedes comunicarte con nosotros por WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative h-3 bg-gray-200 rounded-full overflow-visible mb-10">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-in-out"
          style={{
            width: `${animProgress}%`,
            backgroundColor: color,
          }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{
            left: `calc(${animProgress}% - 18px)`,
          }}
        >
          <div
            className="w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center border-2"
            style={{
              borderColor: color,
            }}
          >
            <span className="text-base">🛒</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= stepIdx;
          const active = idx === stepIdx;

          return (
            <div
              key={step.key}
              className={`flex flex-col items-center text-center transition-all duration-500 ${
                done ? 'opacity-100' : 'opacity-35'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-lg border-2 transition-all duration-500 ${
                  active ? 'scale-110 shadow-xl' : ''
                }`}
                style={{
                  backgroundColor: done ? color : '#f3f4f6',
                  borderColor: done ? color : '#e5e7eb',
                }}
              >
                {step.icon}
              </div>

              <span
                className={`text-[11px] mt-2 font-semibold leading-tight ${
                  active ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {status === 'entregado' && (
        <div className="mt-7 rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
          <div className="text-4xl mb-2">🎉</div>

          <p className="font-extrabold text-green-700">¡Pedido entregado!</p>

          <p className="text-sm text-green-600 mt-1">Gracias por confiar en Mueblería Polaris.</p>
        </div>
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const subtotal = Number(
    order.subtotal ??
      order.order_items?.reduce(
        (sum, item) =>
          sum + Number(item.subtotal ?? Number(item.unit_price) * Number(item.quantity)),
        0
      ) ??
      0
  );

  const shipping = Number(order.shipping_cost || 0);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-background w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl border border-border">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-5 sm:px-7 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Detalle del pedido</p>

            <h2 className="font-extrabold text-lg sm:text-xl">#{getOrderNumber(order)}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full border border-border hover:bg-muted transition flex items-center justify-center text-xl"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Fecha del pedido</p>

              <p className="font-bold">{formatDate(order.created_at)}</p>
            </div>

            <span
              className="px-4 py-2 rounded-full text-xs font-bold text-white"
              style={{
                backgroundColor: STATUS_COLORS[order.status],
              }}
            >
              {isPaymentApproved(order.payment_status)
                ? getStatusLabel(order.status)
                : paymentStatusLabel(order.payment_status)}
            </span>
          </div>

          <section>
            <h3 className="font-extrabold mb-4">🚚 Seguimiento del pedido</h3>

            {isPaymentApproved(order.payment_status) ? (
              <AnimatedCartBar status={order.status} />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
                <p className="font-extrabold text-amber-900">
                  {paymentStatusLabel(order.payment_status)}
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  El proceso logístico comenzará cuando el pago sea aprobado.
                </p>
              </div>
            )}
          </section>

          <section>
            <h3 className="font-extrabold mb-4">🛋️ Productos</h3>

            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-border p-3"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                    {itemImage(item) ? (
                      <img
                        src={itemImage(item)!}
                        alt={itemName(item)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🛋️
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{itemName(item)}</p>

                    <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-extrabold text-sm">
                      {formatCurrency(Number(item.unit_price) * Number(item.quantity))}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unit_price)} c/u
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border p-5">
            <h3 className="font-extrabold mb-4">💰 Resumen del pedido</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Productos</span>

                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>

                <span className="font-semibold">{formatCurrency(shipping)}</span>
              </div>

              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-extrabold">TOTAL</span>

                <span className="font-extrabold text-primary text-xl">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border p-5">
              <h3 className="font-extrabold mb-3">📍 Entrega</h3>

              <p className="text-sm text-muted-foreground">{getAddress(order)}</p>

              {order.shipping_reference && (
                <p className="text-sm mt-2">
                  <strong>Referencia:</strong> {order.shipping_reference}
                </p>
              )}

              {order.shipping_distance_km && (
                <p className="text-sm mt-2">
                  <strong>Distancia:</strong> {Number(order.shipping_distance_km).toFixed(2)} km
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border p-5">
              <h3 className="font-extrabold mb-3">💳 Pago</h3>

              <p className="text-sm">
                <strong>Método:</strong> {order.payment_method || 'No registrado'}
              </p>

              {order.payment_status && (
                <p className="text-sm mt-2">
                  <strong>Estado:</strong> {paymentStatusLabel(order.payment_status)}
                </p>
              )}
            </div>
          </section>

          {(order.tracking_code || order.estimated_delivery) && (
            <section className="rounded-2xl border border-border p-5">
              <h3 className="font-extrabold mb-4">📦 Información de entrega</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {order.tracking_code && (
                  <div>
                    <p className="text-xs text-muted-foreground">Código de seguimiento</p>

                    <p className="font-mono font-bold text-primary mt-1">{order.tracking_code}</p>
                  </div>
                )}

                {order.estimated_delivery && (
                  <div>
                    <p className="text-xs text-muted-foreground">Entrega estimada</p>

                    <p className="font-bold mt-1 capitalize">
                      {formatDate(order.estimated_delivery)}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => openWhatsApp(order)}
              className="w-full py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-extrabold transition flex items-center justify-center gap-2"
            >
              💬 Consultar por WhatsApp
            </button>

            <Link
              href="/#catalogo"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl border-2 border-primary text-primary hover:bg-primary hover:text-white font-extrabold transition flex items-center justify-center gap-2"
            >
              🛍️ Seguir comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onViewDetail,
}: {
  order: Order;
  onViewDetail: (order: Order) => void;
}) {
  const stepIdx = getStepIndex(order.status);

  const color = STATUS_COLORS[order.status] || STATUS_COLORS.confirmado;

  const productsCount =
    order.order_items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;

  return (
    <article className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
      <div className="px-5 sm:px-6 py-5 border-b border-border bg-muted/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-5">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Pedido</p>

              <p className="font-extrabold font-mono">#{getOrderNumber(order)}</p>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Fecha</p>

              <p className="font-semibold text-sm">{formatShortDate(order.created_at)}</p>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Productos
              </p>

              <p className="font-semibold text-sm">{productsCount}</p>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total</p>

              <p className="font-extrabold text-primary">{formatCurrency(order.total)}</p>
            </div>
          </div>

          <span
            className="self-start lg:self-center inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold text-white"
            style={{
              backgroundColor: color,
            }}
          >
            {!isPaymentApproved(order.payment_status)
              ? '⏳'
              : order.status === 'cancelado'
                ? '❌'
                : STATUS_STEPS[stepIdx]?.icon}

            {isPaymentApproved(order.payment_status)
              ? getStatusLabel(order.status)
              : paymentStatusLabel(order.payment_status)}
          </span>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-6">
        {isPaymentApproved(order.payment_status) ? (
          <AnimatedCartBar status={order.status} />
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="font-extrabold text-amber-900">
              {paymentStatusLabel(order.payment_status)}
            </p>
            <p className="mt-1 text-sm text-amber-700">
              El proceso logístico comenzará cuando el pago sea aprobado.
            </p>
          </div>
        )}
      </div>

      {order.order_items?.length > 0 && (
        <div className="px-5 sm:px-6 pb-5 border-t border-border pt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Productos
            </p>

            <span className="text-xs text-muted-foreground">
              {productsCount} {productsCount === 1 ? 'unidad' : 'unidades'}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {order.order_items.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border p-2 text-sm"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {itemImage(item) ? (
                    <img
                      src={itemImage(item)!}
                      alt={itemName(item)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center">🛋️</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{itemName(item)}</p>
                  <p className="text-xs text-muted-foreground">
                    x{item.quantity} · {formatCurrency(item.unit_price)} c/u
                  </p>
                </div>
              </div>
            ))}

            {order.order_items.length > 3 && (
              <p className="text-xs text-primary font-semibold">
                + {order.order_items.length - 3} producto(s) más
              </p>
            )}
          </div>
        </div>
      )}

      <div className="px-5 sm:px-6 py-5 border-t border-border bg-muted/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Entrega
            </p>

            <p className="text-sm mt-1 line-clamp-2">{getAddress(order)}</p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Pago
            </p>

            <p className="text-sm mt-1 capitalize">{order.payment_method || 'No registrado'}</p>
            <p className="mt-1 text-xs font-bold text-muted-foreground">
              {paymentStatusLabel(order.payment_status)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row gap-3">
        {!isPaymentApproved(order.payment_status) &&
          !['cancelled', 'cancelado'].includes(order.payment_status?.toLowerCase() || '') && (
            <Link
              href={`/pago/${order.id}`}
              className="flex-1 rounded-2xl bg-amber-500 py-3 text-center font-extrabold text-slate-950 hover:bg-amber-400 transition"
            >
              {['rejected', 'failed', 'rechazado', 'fallido'].includes(
                order.payment_status?.toLowerCase() || ''
              )
                ? 'Reintentar pago'
                : 'Continuar con el pago'}
            </Link>
          )}
        <button
          type="button"
          onClick={() => onViewDetail(order)}
          className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-extrabold hover:bg-primary/90 transition"
        >
          👁️ Ver detalle
        </button>

        <Link
          href="/#catalogo"
          className="flex-1 py-3 rounded-2xl border border-border text-center font-extrabold hover:bg-muted transition"
        >
          🛍️ Comprar
        </Link>
      </div>
    </article>
  );
}

export default function PedidosPage() {
  const { user, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('todos');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(
    async (showRefreshing = false) => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (showRefreshing) {
        setRefreshing(true);
      }

      const supabase = createClient();

      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          order_items(
            id,
            product_id,
            quantity,
            unit_price,
            subtotal,
            product_name,
            product_image_url,
            variant_name,
            products(
              name,
              image_url
            )
          ),
          addresses(
            street,
            city,
            state,
            country
          )
        `
        )
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error('Error cargando pedidos:', error);

        setOrders([]);
      } else {
        setOrders((data as unknown as Order[]) || []);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [user]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /*
   * Realtime:
   * actualiza el pedido cuando cambia su estado.
   */
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    const ordersChannel = supabase
      .channel(`orders_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    const itemsChannel = supabase
      .channel(`order_items_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);

      supabase.removeChannel(itemsChannel);
    };
  }, [user, fetchOrders]);

  const counters = useMemo(() => {
    const result: Record<FilterStatus, number> = {
      todos: orders.length,
      confirmado: 0,
      preparando: 0,
      empaquetando: 0,
      preparando_envio: 0,
      camino: 0,
      entregado: 0,
      cancelado: 0,
    };

    orders.forEach((order) => {
      if (result[order.status] !== undefined) {
        result[order.status]++;
      }
    });

    return result;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesFilter = filter === 'todos' || order.status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const orderNumber = order.id.slice(0, 8).toLowerCase();

      const productNames =
        order.order_items
          ?.map((item) => item.products?.name || '')
          .join(' ')
          .toLowerCase() || '';

      const tracking = order.tracking_code?.toLowerCase() || '';

      return (
        orderNumber.includes(normalizedSearch) ||
        productNames.includes(normalizedSearch) ||
        tracking.includes(normalizedSearch)
      );
    });
  }, [orders, search, filter]);

  if (authLoading || loading) {
    return (
      <>
        <Header />

        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />

            <p className="text-muted-foreground font-medium">Cargando tus pedidos...</p>
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

            <h1 className="text-2xl font-extrabold mb-2">Mis Pedidos</h1>

            <p className="text-muted-foreground mb-6">
              Inicia sesión para consultar tus pedidos y realizar seguimiento.
            </p>

            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-bold rounded-2xl hover:bg-primary/90 transition"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-center mt-3 px-6 py-3 border border-border font-bold rounded-2xl hover:bg-muted transition"
            >
              ← Volver al inicio
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* CABECERA */}
          <div className="mb-7">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
                  📦 Mis Pedidos
                </h1>

                <p className="text-muted-foreground mt-1">
                  Consulta y realiza seguimiento de todas tus compras.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fetchOrders(true)}
                  disabled={refreshing}
                  className="px-4 py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-muted transition disabled:opacity-50"
                >
                  {refreshing ? '↻ Actualizando...' : '↻ Actualizar'}
                </button>

                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition"
                >
                  🏠 Inicio
                </Link>
              </div>
            </div>
          </div>

          {/* RESUMEN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Todos</p>

              <p className="text-2xl font-extrabold mt-1">{counters.todos}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">En proceso</p>

              <p className="text-2xl font-extrabold mt-1 text-blue-600">
                {counters.confirmado +
                  counters.preparando +
                  counters.empaquetando +
                  counters.preparando_envio}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">En camino</p>

              <p className="text-2xl font-extrabold mt-1 text-purple-600">{counters.camino}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Entregados</p>

              <p className="text-2xl font-extrabold mt-1 text-green-600">{counters.entregado}</p>
            </div>
          </div>

          {/* BUSCADOR */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔎</span>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por número de pedido, producto o código de seguimiento..."
                className="w-full h-12 rounded-xl border border-border bg-background pl-11 pr-4 outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* FILTROS */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-5">
            {FILTERS.map((item) => {
              const active = filter === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition ${
                    active
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-muted'
                  }`}
                >
                  {item.label} <span className="opacity-70">({counters[item.key]})</span>
                </button>
              );
            })}
          </div>

          {/* RESULTADOS */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredOrders.length}{' '}
              {filteredOrders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
            </p>

            {(search || filter !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilter('todos');
                }}
                className="text-sm font-bold text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-10 sm:p-16 text-center">
              <div className="text-7xl mb-5">{orders.length === 0 ? '🛋️' : '🔎'}</div>

              <h2 className="text-xl font-extrabold mb-2">
                {orders.length === 0 ? 'Aún no tienes pedidos' : 'No encontramos pedidos'}
              </h2>

              <p className="text-muted-foreground max-w-md mx-auto">
                {orders.length === 0
                  ? 'Explora nuestro catálogo y encuentra el sofá ideal para tu hogar.'
                  : 'Prueba con otro término de búsqueda o cambia el filtro.'}
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                <Link
                  href="/#catalogo"
                  className="px-7 py-3 rounded-2xl bg-primary text-primary-foreground font-extrabold hover:bg-primary/90 transition"
                >
                  🛍️ Ver catálogo
                </Link>

                <Link
                  href="/"
                  className="px-7 py-3 rounded-2xl border border-border font-extrabold hover:bg-muted transition"
                >
                  🏠 Volver al inicio
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} onViewDetail={setSelectedOrder} />
              ))}
            </div>
          )}

          {/* PIE */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto px-7 py-3 rounded-2xl border border-border bg-card text-center font-extrabold hover:bg-muted transition"
            >
              ← Volver al inicio
            </Link>

            <Link
              href="/#catalogo"
              className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-primary text-primary-foreground text-center font-extrabold hover:bg-primary/90 transition"
            >
              🛍️ Seguir comprando
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </>
  );
}

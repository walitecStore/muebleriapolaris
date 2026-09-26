'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Eye,
  Package,
  RefreshCw,
  Search,
  Truck,
  User,
  X,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

type OrderStatus =
  | 'confirmado'
  | 'preparando'
  | 'empaquetando'
  | 'preparando_envio'
  | 'camino'
  | 'entregado'
  | 'cancelado';

interface OrderRow {
  id: string;
  user_id: string | null;
  address_id: string | null;
  status: OrderStatus;
  total: number | null;
  tracking_code: string | null;
  payment_method: string | null;
  notes: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface ProductRow {
  id: string;
  name: string | null;
  image_url: string | null;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number | null;
  subtotal: number | null;
  created_at: string;
}

interface AddressRow {
  id: string;
  street: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

interface AdminOrder {
  id: string;
  userId: string | null;

  customerName: string;
  customerEmail: string;

  status: OrderStatus;

  total: number;

  trackingCode: string | null;
  payment_method: string | null;
  notes: string | null;
  estimatedDelivery: string | null;

  createdAt: string;
  updatedAt: string;

  address: AddressRow | null;

  items: AdminOrderItem[];
}

interface AdminOrderItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/*
|--------------------------------------------------------------------------
| ESTADOS
|--------------------------------------------------------------------------
*/

const STATUS_OPTIONS: {
  value: OrderStatus;
  label: string;
}[] = [
  {
    value: 'confirmado',
    label: 'Confirmado',
  },
  {
    value: 'preparando',
    label: 'Preparando artículo',
  },
  {
    value: 'empaquetando',
    label: 'Empaquetando',
  },
  {
    value: 'preparando_envio',
    label: 'Preparando envío',
  },
  {
    value: 'camino',
    label: 'En camino',
  },
  {
    value: 'entregado',
    label: 'Entregado',
  },
  {
    value: 'cancelado',
    label: 'Cancelado',
  },
];

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
  }
> = {
  confirmado: {
    label: 'Confirmado',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-500',
  },

  preparando: {
    label: 'Preparando',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },

  empaquetando: {
    label: 'Empaquetando',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },

  preparando_envio: {
    label: 'Preparando envío',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },

  camino: {
    label: 'En camino',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    dot: 'bg-violet-500',
  },

  entregado: {
    label: 'Entregado',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },

  cancelado: {
    label: 'Cancelado',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

const STATUS_FLOW: OrderStatus[] = [
  'confirmado',
  'preparando',
  'empaquetando',
  'preparando_envio',
  'camino',
  'entregado',
];

/*
|--------------------------------------------------------------------------
| UTILIDADES
|--------------------------------------------------------------------------
*/

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value: string): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function shortOrderId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

function getInitials(name: string): string {
  const clean = name.trim();

  if (!clean) {
    return 'C';
  }

  const parts = clean.split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getStatusLabel(status: OrderStatus): string {
  return STATUS_CONFIG[status]?.label ?? status;
}

function getStatusIndex(status: OrderStatus): number {
  return STATUS_FLOW.indexOf(status);
}

/*
|--------------------------------------------------------------------------
| ESTADO VISUAL
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />

      {config.label}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| PROGRESO DEL PEDIDO
|--------------------------------------------------------------------------
*/

function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === 'cancelado') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-red-700">
          <AlertCircle size={18} />
          Pedido cancelado
        </div>

        <p className="mt-1 text-xs text-red-600">
          Este pedido ya no continúa en el flujo de entrega.
        </p>
      </div>
    );
  }

  const currentIndex = getStatusIndex(status);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Estado del pedido
          </p>

          <p className="mt-1 text-sm font-black text-slate-800">{getStatusLabel(status)}</p>
        </div>

        <Truck size={21} className="text-cyan-600" />
      </div>

      <div className="relative">
        <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-slate-200" />

        <div
          className="absolute left-0 top-4 h-1 rounded-full bg-cyan-500 transition-all duration-500"
          style={{
            width: currentIndex <= 0 ? '0%' : `${(currentIndex / (STATUS_FLOW.length - 1)) * 100}%`,
          }}
        />

        <div className="relative grid grid-cols-3 gap-2 sm:grid-cols-6">
          {STATUS_FLOW.map((step, index) => {
            const completed = index <= currentIndex;

            const active = index === currentIndex;

            return (
              <div key={step} className="flex flex-col items-center text-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white text-xs font-black transition-all ${
                    completed
                      ? 'border-cyan-500 bg-cyan-500 text-white'
                      : 'border-slate-200 text-slate-300'
                  } ${active ? 'scale-110 shadow-lg shadow-cyan-500/20' : ''}`}
                >
                  {completed ? <CheckCircle2 size={15} /> : index + 1}
                </div>

                <span
                  className={`mt-2 text-[10px] font-semibold leading-tight ${
                    completed ? 'text-slate-700' : 'text-slate-400'
                  }`}
                >
                  {getStatusLabel(step)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PÁGINA
|--------------------------------------------------------------------------
*/

export default function AdminPedidosPage() {
  const supabase = useMemo(() => createClient(), []);

  const [orders, setOrders] = useState<AdminOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState<'todos' | OrderStatus>('todos');

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | CARGAR PEDIDOS
  |--------------------------------------------------------------------------
  */

  const fetchOrders = useCallback(
    async (showRefresh = false) => {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      try {
        /*
          |--------------------------------------------------------------------------
          | 1. PEDIDOS
          |--------------------------------------------------------------------------
          */

        const { data: orderRows, error: ordersError } = await supabase
          .from('orders')
          .select(
            'id, user_id, address_id, status, total, tracking_code, payment_method, notes, estimated_delivery, created_at, updated_at'
          )
          .order('created_at', {
            ascending: false,
          });

        if (ordersError) {
          throw new Error(ordersError.message);
        }

        const rawOrders = (orderRows ?? []) as OrderRow[];

        /*
          |--------------------------------------------------------------------------
          | 2. OBTENER IDS DE USUARIOS
          |--------------------------------------------------------------------------
          */

        const userIds = [
          ...new Set(
            rawOrders.map((order) => order.user_id).filter((id): id is string => Boolean(id))
          ),
        ];

        /*
          |--------------------------------------------------------------------------
          | 3. OBTENER IDS DE DIRECCIONES
          |--------------------------------------------------------------------------
          */

        const addressIds = [
          ...new Set(
            rawOrders.map((order) => order.address_id).filter((id): id is string => Boolean(id))
          ),
        ];

        /*
          |--------------------------------------------------------------------------
          | 4. PEDIR PERFILES Y DIRECCIONES
          |--------------------------------------------------------------------------
          */

        const [profilesResult, addressesResult] = await Promise.all([
          userIds.length > 0
            ? supabase.from('profiles').select('id, full_name, email').in('id', userIds)
            : Promise.resolve({
                data: [],
                error: null,
              }),

          addressIds.length > 0
            ? supabase
                .from('addresses')
                .select('id, street, city, state, country')
                .in('id', addressIds)
            : Promise.resolve({
                data: [],
                error: null,
              }),
        ]);

        if (profilesResult.error) {
          throw new Error(profilesResult.error.message);
        }

        if (addressesResult.error) {
          throw new Error(addressesResult.error.message);
        }

        const profiles = (profilesResult.data ?? []) as ProfileRow[];

        const addresses = (addressesResult.data ?? []) as AddressRow[];

        /*
          |--------------------------------------------------------------------------
          | 5. MAPAS
          |--------------------------------------------------------------------------
          */

        const profilesMap = new Map(profiles.map((profile) => [profile.id, profile]));

        const addressesMap = new Map(addresses.map((address) => [address.id, address]));

        /*
          |--------------------------------------------------------------------------
          | 6. ITEMS DE PEDIDO
          |--------------------------------------------------------------------------
          */

        const orderIds = rawOrders.map((order) => order.id);

        let orderItems: OrderItemRow[] = [];

        if (orderIds.length > 0) {
          const { data: itemRows, error: itemsError } = await supabase
            .from('order_items')
            .select('id, order_id, product_id, quantity, unit_price, subtotal, created_at')
            .in('order_id', orderIds);

          if (itemsError) {
            throw new Error(itemsError.message);
          }

          orderItems = (itemRows ?? []) as OrderItemRow[];
        }

        /*
          |--------------------------------------------------------------------------
          | 7. PRODUCTOS
          |--------------------------------------------------------------------------
          */

        const productIds = [...new Set(orderItems.map((item) => item.product_id).filter(Boolean))];

        let products: ProductRow[] = [];

        if (productIds.length > 0) {
          const { data: productRows, error: productsError } = await supabase
            .from('products')
            .select('id, name, image_url')
            .in('id', productIds);

          if (productsError) {
            throw new Error(productsError.message);
          }

          products = (productRows ?? []) as ProductRow[];
        }

        const productsMap = new Map(products.map((product) => [product.id, product]));

        /*
          |--------------------------------------------------------------------------
          | 8. AGRUPAR ITEMS
          |--------------------------------------------------------------------------
          */

        const itemsMap = new Map<string, AdminOrderItem[]>();

        orderItems.forEach((item) => {
          const product = productsMap.get(item.product_id);

          const formattedItem: AdminOrderItem = {
            id: item.id,

            productId: item.product_id,

            productName: product?.name || 'Producto',

            imageUrl: product?.image_url ?? null,

            quantity: Number(item.quantity ?? 0),

            unitPrice: Number(item.unit_price ?? 0),

            subtotal: Number(item.subtotal ?? 0),
          };

          const current = itemsMap.get(item.order_id) ?? [];

          current.push(formattedItem);

          itemsMap.set(item.order_id, current);
        });

        /*
          |--------------------------------------------------------------------------
          | 9. FORMATEAR PEDIDOS
          |--------------------------------------------------------------------------
          */

        const formattedOrders = rawOrders.map((order) => {
          const profile = order.user_id ? profilesMap.get(order.user_id) : undefined;

          const address = order.address_id ? (addressesMap.get(order.address_id) ?? null) : null;

          return {
            id: order.id,

            userId: order.user_id,

            customerName: profile?.full_name?.trim() || 'Cliente',

            customerEmail: profile?.email?.trim() || 'Sin correo',

            status: order.status,

            total: Number(order.total ?? 0),

            trackingCode: order.tracking_code,

            payment_method: order.payment_method,

            notes: order.notes,

            estimatedDelivery: order.estimated_delivery,

            createdAt: order.created_at,

            updatedAt: order.updated_at,

            address,

            items: itemsMap.get(order.id) ?? [],
          };
        });

        setOrders(formattedOrders);
      } catch (loadError) {
        console.error('Error cargando pedidos:', loadError);

        setError(
          loadError instanceof Error ? loadError.message : 'No se pudieron cargar los pedidos.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [supabase]
  );

  /*
  |--------------------------------------------------------------------------
  | CARGA INICIAL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /*
  |--------------------------------------------------------------------------
  | FILTROS
  |--------------------------------------------------------------------------
  */

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.customerEmail.toLowerCase().includes(term) ||
        order.items.some((item) => item.productName.toLowerCase().includes(term));

      const matchesStatus = statusFilter === 'todos' || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  /*
  |--------------------------------------------------------------------------
  | ESTADÍSTICAS
  |--------------------------------------------------------------------------
  */

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);

  const confirmedCount = orders.filter((order) => order.status === 'confirmado').length;

  const preparingCount = orders.filter(
    (order) =>
      order.status === 'preparando' ||
      order.status === 'empaquetando' ||
      order.status === 'preparando_envio'
  ).length;

  const shippingCount = orders.filter((order) => order.status === 'camino').length;

  const deliveredCount = orders.filter((order) => order.status === 'entregado').length;

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR ESTADO
  |--------------------------------------------------------------------------
  */

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
                updatedAt: new Date().toISOString(),
              }
            : order
        )
      );

      setSelectedOrder((current) =>
        current && current.id === orderId
          ? {
              ...current,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            }
          : current
      );
    } catch (updateError) {
      console.error('Error actualizando estado:', updateError);

      setError(
        updateError instanceof Error ? updateError.message : 'No se pudo actualizar el estado.'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4 px-6 py-4">
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-xl font-black text-slate-900">Pedidos</h1>

              <p className="text-xs text-slate-500">Gestiona los pedidos de Polaris.</p>
            </div>
          </div>
        </header>

        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />

            <p className="mt-4 text-sm font-semibold text-slate-500">Cargando pedidos...</p>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | INTERFAZ
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <h1 className="text-xl font-black text-slate-900">Pedidos</h1>

              <p className="text-xs text-slate-500">Gestiona los pedidos de Polaris.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </header>

      <div className="p-6">
        {/* ERROR */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle size={19} />

            <div>
              <p className="text-sm font-bold">Se produjo un problema</p>

              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* ESTADÍSTICAS */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => setStatusFilter('todos')}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Todos los pedidos</p>

                <p className="mt-2 text-2xl font-black text-slate-900">{orders.length}</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Package size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">Pedidos registrados</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('confirmado')}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-medium text-slate-500">Confirmados</p>

            <p className="mt-2 text-2xl font-black text-slate-900">{confirmedCount}</p>

            <p className="mt-3 text-xs text-slate-400">Esperando preparación</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('preparando')}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-medium text-slate-500">En preparación</p>

            <p className="mt-2 text-2xl font-black text-slate-900">{preparingCount}</p>

            <p className="mt-3 text-xs text-slate-400">Preparando y empaquetando</p>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('camino')}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-medium text-slate-500">En camino</p>

            <p className="mt-2 text-2xl font-black text-slate-900">{shippingCount}</p>

            <p className="mt-3 text-xs text-slate-400">Pedidos enviados</p>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Ventas</p>

                <p className="mt-2 text-xl font-black text-slate-900">
                  {formatCurrency(totalSales)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CircleDollarSign size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-emerald-600">{deliveredCount} entregados</p>
          </div>
        </section>

        {/* TABLA */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* BARRA */}

          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-black text-slate-900">Lista de pedidos</h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredOrders.length} pedidos encontrados
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar pedido o cliente..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'todos' | OrderStatus)}
                  className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="todos">Todos los estados</option>

                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* SIN PEDIDOS */}

          {filteredOrders.length === 0 && (
            <div className="flex min-h-[350px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Package size={30} />
              </div>

              <h3 className="mt-4 font-black text-slate-800">No hay pedidos</h3>

              <p className="mt-2 max-w-md text-sm text-slate-400">
                No encontramos pedidos con los filtros seleccionados.
              </p>
            </div>
          )}

          {/* TABLA */}

          {filteredOrders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Pedido
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Cliente
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Fecha
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Productos
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Total
                    </th>

                    <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Pago
                    </th>

                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Estado
                    </th>

                    <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/60"
                    >
                      {/* PEDIDO */}

                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-black text-slate-800">
                          {shortOrderId(order.id)}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          {order.items.length} producto
                          {order.items.length !== 1 ? 's' : ''}
                        </p>
                      </td>

                      {/* CLIENTE */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-[10px] font-black text-cyan-700">
                            {getInitials(order.customerName)}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">{order.customerName}</p>

                            <p className="max-w-[180px] truncate text-[10px] text-slate-400">
                              {order.customerEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* FECHA */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <CalendarDays size={14} className="text-slate-400" />

                          {formatDateTime(order.createdAt)}
                        </div>
                      </td>

                      {/* PRODUCTOS */}

                      <td className="px-5 py-4">
                        <div className="max-w-[210px]">
                          {order.items.slice(0, 2).map((item) => (
                            <p
                              key={item.id}
                              className="truncate text-xs font-medium text-slate-700"
                            >
                              {item.quantity}x {item.productName}
                            </p>
                          ))}

                          {order.items.length > 2 && (
                            <p className="mt-1 text-[10px] font-bold text-cyan-600">
                              +{order.items.length - 2} producto
                              {order.items.length - 2 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-black text-slate-900">
                          {formatCurrency(order.total)}
                        </span>
                      </td>

                      {/* PAGO */}

                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-slate-600">
                          {order.payment_method || '—'}
                        </span>
                      </td>

                      {/* ESTADO */}

                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* ACCIONES */}

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center">
                          <button
                            type="button"
                            title="Ver detalle"
                            onClick={() => setSelectedOrder(order)}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* MODAL */}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedOrder(null);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-cyan-600" />

                  <h2 className="text-lg font-black text-slate-900">Detalle del pedido</h2>
                </div>

                <p className="mt-1 font-mono text-xs text-slate-400">
                  {shortOrderId(selectedOrder.id)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-85px)] overflow-y-auto p-6">
              {/* RESUMEN */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <User size={16} />

                    <span className="text-xs font-semibold">Cliente</span>
                  </div>

                  <p className="mt-2 text-sm font-black text-slate-800">
                    {selectedOrder.customerName}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    {selectedOrder.customerEmail}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarDays size={16} />

                    <span className="text-xs font-semibold">Fecha del pedido</span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-slate-800">
                    {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CircleDollarSign size={16} />

                    <span className="text-xs font-semibold">Total</span>
                  </div>

                  <p className="mt-2 text-lg font-black text-slate-900">
                    {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
              </div>

              {/* ESTADO */}

              <div className="mt-5">
                <OrderProgress status={selectedOrder.status} />
              </div>

              {/* CAMBIO DE ESTADO */}

              <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50/50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">
                      Gestionar pedido
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Cambia el estado y se guardará directamente en Supabase.
                    </p>
                  </div>

                  <div className="relative">
                    <select
                      value={selectedOrder.status}
                      disabled={updatingStatus}
                      onChange={(event) =>
                        updateOrderStatus(selectedOrder.id, event.target.value as OrderStatus)
                      }
                      className="appearance-none rounded-xl border border-cyan-200 bg-white py-3 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* PRODUCTOS */}

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 px-5 py-4">
                  <h3 className="font-black text-slate-900">Productos del pedido</h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedOrder.items.length} producto
                    {selectedOrder.items.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {selectedOrder.items.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">
                    No hay productos asociados a este pedido.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 px-5 py-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-300">
                                <Package size={20} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {item.productName}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">Cantidad: {item.quantity}</p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-black text-slate-800">
                            {formatCurrency(item.subtotal)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {formatCurrency(item.unitPrice)} c/u
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4">
                  <span className="text-sm font-bold text-slate-600">Total del pedido</span>

                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>

              {/* INFORMACIÓN ADICIONAL */}

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black text-slate-900">Información de entrega</h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Dirección
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {selectedOrder.address
                          ? [
                              selectedOrder.address.street,
                              selectedOrder.address.city,
                              selectedOrder.address.state,
                              selectedOrder.address.country,
                            ]
                              .filter(Boolean)
                              .join(', ')
                          : 'No registrada'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Código de seguimiento
                      </p>

                      <p className="mt-1 font-mono text-sm font-bold text-cyan-700">
                        {selectedOrder.trackingCode || 'Pendiente'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Entrega estimada
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {selectedOrder.estimatedDelivery
                          ? formatDate(selectedOrder.estimatedDelivery)
                          : 'No definida'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="font-black text-slate-900">Información de pago</h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Método de pago
                      </p>

                      <p className="mt-1 text-sm font-bold text-slate-700">
                        {selectedOrder.payment_method || 'No registrado'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        ID del pedido
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        {selectedOrder.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Última actualización
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {formatDateTime(selectedOrder.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* NOTAS */}

              {selectedOrder.notes && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                    Notas del pedido
                  </p>

                  <p className="mt-2 text-sm leading-relaxed text-amber-900">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* CERRAR */}

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

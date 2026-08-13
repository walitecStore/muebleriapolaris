'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Search,
  Users,
  Mail,
  ShoppingBag,
  Eye,
  RefreshCw,
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  AlertCircle,
  X,
  ReceiptText,
} from 'lucide-react';

import Link from 'next/link';

import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at?: string | null;
}

interface Order {
  id: string;
  user_id: string | null;
  total: number | null;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  orders: number;
  totalSpent: number;
}

interface CustomerOrder {
  id: string;
  total: number;
  created_at: string;
}

/*
|--------------------------------------------------------------------------
| MONEDA
|--------------------------------------------------------------------------
*/

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
}

/*
|--------------------------------------------------------------------------
| FECHA
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| FECHA Y HORA
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| INICIALES
|--------------------------------------------------------------------------
*/

function getInitials(name: string): string {
  const cleanName = name.trim();

  if (!cleanName) {
    return 'C';
  }

  const parts = cleanName
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

/*
|--------------------------------------------------------------------------
| PÁGINA
|--------------------------------------------------------------------------
*/

export default function ClientesPage() {
  const supabase = useMemo(
    () => createClient(),
    [],
  );

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | CLIENTE SELECCIONADO
  |--------------------------------------------------------------------------
  */

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [customerOrders, setCustomerOrders] =
    useState<CustomerOrder[]>([]);

  const [loadingOrders, setLoadingOrders] =
    useState(false);

  const [ordersError, setOrdersError] =
    useState('');

  /*
  |--------------------------------------------------------------------------
  | CARGAR CLIENTES
  |--------------------------------------------------------------------------
  */

  const loadCustomers =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        try {
          const {
            data: profiles,
            error: profilesError,
          } = await supabase
            .from('profiles')
            .select(
              'id, full_name, email, role, created_at',
            )
            .eq('role', 'user')
            .order(
              'created_at',
              {
                ascending: false,
              },
            );

          if (profilesError) {
            console.error(
              'Error obteniendo clientes:',
              profilesError,
            );

            throw new Error(
              profilesError.message ||
                'No se pudieron obtener los clientes.',
            );
          }

          const {
            data: orders,
            error: ordersError,
          } = await supabase
            .from('orders')
            .select(
              'id, user_id, total, created_at',
            );

          if (ordersError) {
            console.error(
              'Error obteniendo pedidos:',
              ordersError,
            );

            throw new Error(
              ordersError.message ||
                'No se pudieron obtener los pedidos.',
            );
          }

          const orderStats =
            new Map<
              string,
              {
                orders: number;
                totalSpent: number;
              }
            >();

          (orders ?? []).forEach(
            (order: Order) => {
              if (!order.user_id) {
                return;
              }

              const current =
                orderStats.get(
                  order.user_id,
                ) ?? {
                  orders: 0,
                  totalSpent: 0,
                };

              current.orders += 1;

              current.totalSpent +=
                Number(
                  order.total ?? 0,
                );

              orderStats.set(
                order.user_id,
                current,
              );
            },
          );

          const customerList: Customer[] =
            (profiles ?? []).map(
              (profile: Profile) => {
                const stats =
                  orderStats.get(
                    profile.id,
                  ) ?? {
                    orders: 0,
                    totalSpent: 0,
                  };

                return {
                  id: profile.id,

                  name:
                    profile.full_name?.trim() ||
                    'Cliente',

                  email:
                    profile.email?.trim() ||
                    'Sin correo',

                  registeredAt:
                    profile.created_at ??
                    '',

                  orders:
                    stats.orders,

                  totalSpent:
                    stats.totalSpent,
                };
              },
            );

          setCustomers(
            customerList,
          );
        } catch (loadError) {
          console.error(
            'Error cargando clientes:',
            loadError,
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Ocurrió un error al cargar los clientes.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [supabase],
    );

  /*
  |--------------------------------------------------------------------------
  | CARGA INICIAL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  /*
  |--------------------------------------------------------------------------
  | BUSCADOR
  |--------------------------------------------------------------------------
  */

  const filteredCustomers =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return customers;
      }

      return customers.filter(
        (customer) =>
          customer.name
            .toLowerCase()
            .includes(term) ||
          customer.email
            .toLowerCase()
            .includes(term),
      );
    }, [
      customers,
      search,
    ]);

  /*
  |--------------------------------------------------------------------------
  | ESTADÍSTICAS
  |--------------------------------------------------------------------------
  */

  const totalCustomers =
    customers.length;

  const customersWithOrders =
    customers.filter(
      (customer) =>
        customer.orders > 0,
    ).length;

  const totalOrders =
    customers.reduce(
      (sum, customer) =>
        sum + customer.orders,
      0,
    );

  const totalSales =
    customers.reduce(
      (sum, customer) =>
        sum + customer.totalSpent,
      0,
    );

  /*
  |--------------------------------------------------------------------------
  | VER DETALLE DEL CLIENTE
  |--------------------------------------------------------------------------
  */

  const handleViewCustomer =
    async (
      customer: Customer,
    ) => {
      setSelectedCustomer(
        customer,
      );

      setCustomerOrders([]);

      setOrdersError('');

      setLoadingOrders(true);

      try {
        const {
          data,
          error: ordersError,
        } = await supabase
          .from('orders')
          .select(
            'id, total, created_at',
          )
          .eq(
            'user_id',
            customer.id,
          )
          .order(
            'created_at',
            {
              ascending: false,
            },
          );

        if (ordersError) {
          console.error(
            'Error obteniendo pedidos del cliente:',
            ordersError,
          );

          throw new Error(
            ordersError.message ||
              'No se pudo obtener el historial de pedidos.',
          );
        }

        const formattedOrders: CustomerOrder[] =
          (data ?? []).map(
            (order) => ({
              id: String(
                order.id,
              ),

              total: Number(
                order.total ?? 0,
              ),

              created_at:
                String(
                  order.created_at,
                ),
            }),
          );

        setCustomerOrders(
          formattedOrders,
        );
      } catch (detailError) {
        console.error(
          'Error cargando detalle:',
          detailError,
        );

        setOrdersError(
          detailError instanceof Error
            ? detailError.message
            : 'No se pudo cargar el historial.',
        );
      } finally {
        setLoadingOrders(false);
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR DETALLE
  |--------------------------------------------------------------------------
  */

  const closeCustomerDetail =
    () => {
      setSelectedCustomer(
        null,
      );

      setCustomerOrders([]);

      setOrdersError('');
    };

  /*
  |--------------------------------------------------------------------------
  | CARGANDO
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex items-center gap-4 px-6 py-4">
            <Link
              href="/admin-v2"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft
                size={19}
              />
            </Link>

            <div>
              <h1 className="text-xl font-black text-slate-900">
                Clientes
              </h1>

              <p className="text-xs text-slate-500">
                Gestiona los clientes de Polaris.
              </p>
            </div>
          </div>
        </header>

        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />

            <p className="text-sm font-semibold text-slate-600">
              Cargando clientes...
            </p>
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
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin-v2"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft
                size={19}
              />
            </Link>

            <div>
              <h1 className="text-xl font-black text-slate-900">
                Clientes
              </h1>

              <p className="text-xs text-slate-500">
                Gestiona los clientes de Polaris.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadCustomers(true)
            }
            disabled={
              refreshing
            }
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Actualizar
          </button>
        </div>
      </header>

      <div className="p-6">
        {/* TARJETAS */}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Clientes
                </p>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {totalCustomers}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                <Users
                  size={22}
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-emerald-600">
              Clientes registrados
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Clientes con pedidos
                </p>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {
                    customersWithOrders
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShoppingBag
                  size={22}
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Han realizado al menos una compra
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Pedidos realizados
                </p>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {totalOrders}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <ShoppingBag
                  size={22}
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Pedidos asociados a clientes
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Ventas de clientes
                </p>

                <p className="mt-2 text-2xl font-black text-slate-900">
                  {formatCurrency(
                    totalSales,
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CircleDollarSign
                  size={22}
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Total registrado en pedidos
            </p>
          </div>
        </section>

        {/* LISTA */}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-black text-slate-900">
                Lista de clientes
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredCustomers.length}{' '}
                clientes encontrados
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Buscar cliente..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </div>

          {error && (
            <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle
                size={19}
              />

              <div>
                <p className="font-bold">
                  No se pudieron cargar los clientes
                </p>

                <p className="mt-1 text-xs">
                  {error}
                </p>
              </div>
            </div>
          )}

          {!error &&
            filteredCustomers.length ===
              0 && (
              <div className="flex min-h-[350px] items-center justify-center p-8">
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Users
                      size={30}
                    />
                  </div>

                  <h3 className="mt-4 font-black text-slate-800">
                    {search
                      ? 'No encontramos clientes'
                      : 'No hay clientes registrados'}
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    {search
                      ? 'Prueba con otro nombre o correo.'
                      : 'Los clientes registrados aparecerán aquí.'}
                  </p>
                </div>
              </div>
            )}

          {!error &&
            filteredCustomers.length >
              0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Cliente
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Correo
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Registro
                      </th>

                      <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Pedidos
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Total comprado
                      </th>

                      <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Estado
                      </th>

                      <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map(
                      (
                        customer,
                      ) => (
                        <tr
                          key={
                            customer.id
                          }
                          className="border-b border-slate-100 transition hover:bg-slate-50/60"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-black text-cyan-700">
                                {getInitials(
                                  customer.name,
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  {
                                    customer.name
                                  }
                                </p>

                                <p className="mt-0.5 text-[11px] text-slate-400">
                                  Cliente Polaris
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Mail
                                size={15}
                                className="text-slate-400"
                              />

                              {
                                customer.email
                              }
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <CalendarDays
                                size={15}
                                className="text-slate-400"
                              />

                              {formatDate(
                                customer.registeredAt,
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {
                                customer.orders
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-black text-slate-800">
                              {formatCurrency(
                                customer.totalSpent,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                              Registrado
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                title="Ver cliente"
                                onClick={() =>
                                  handleViewCustomer(
                                    customer,
                                  )
                                }
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>

                              <a
                                href={`mailto:${customer.email}`}
                                title="Enviar correo"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                              >
                                <Mail
                                  size={16}
                                />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>

      {/* MODAL DETALLE DEL CLIENTE */}

      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCustomerDetail();
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            {/* CABECERA MODAL */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 font-black text-cyan-700">
                  {getInitials(
                    selectedCustomer.name,
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {
                      selectedCustomer.name
                    }
                  </h2>

                  <p className="text-xs text-slate-500">
                    Detalle del cliente
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeCustomerDetail
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                title="Cerrar"
              >
                <X
                  size={18}
                />
              </button>
            </div>

            <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-6">
              {/* INFORMACIÓN */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail
                      size={16}
                    />

                    <span className="text-xs font-semibold">
                      Correo
                    </span>
                  </div>

                  <p className="mt-2 break-all text-sm font-bold text-slate-800">
                    {
                      selectedCustomer.email
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarDays
                      size={16}
                    />

                    <span className="text-xs font-semibold">
                      Registro
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-slate-800">
                    {formatDate(
                      selectedCustomer.registeredAt,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <ShoppingBag
                      size={16}
                    />

                    <span className="text-xs font-semibold">
                      Pedidos
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-slate-800">
                    {
                      selectedCustomer.orders
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CircleDollarSign
                      size={16}
                    />

                    <span className="text-xs font-semibold">
                      Total comprado
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-black text-slate-900">
                    {formatCurrency(
                      selectedCustomer.totalSpent,
                    )}
                  </p>
                </div>
              </div>

              {/* BOTÓN CORREO */}

              <div className="mt-5">
                <a
                  href={`mailto:${selectedCustomer.email}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition hover:bg-cyan-700"
                >
                  <Mail
                    size={16}
                  />

                  Enviar correo
                </a>
              </div>

              {/* HISTORIAL */}

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-200 bg-white px-5 py-4">
                  <div className="flex items-center gap-2">
                    <ReceiptText
                      size={18}
                      className="text-cyan-600"
                    />

                    <div>
                      <h3 className="font-black text-slate-900">
                        Historial de pedidos
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Pedidos registrados de este cliente.
                      </p>
                    </div>
                  </div>
                </div>

                {loadingOrders && (
                  <div className="flex min-h-[180px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />

                      <p className="text-xs font-semibold text-slate-500">
                        Cargando pedidos...
                      </p>
                    </div>
                  </div>
                )}

                {!loadingOrders &&
                  ordersError && (
                    <div className="m-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                      <AlertCircle
                        size={18}
                      />

                      <div>
                        <p className="font-bold">
                          No se pudo cargar el historial
                        </p>

                        <p className="mt-1 text-xs">
                          {
                            ordersError
                          }
                        </p>
                      </div>
                    </div>
                  )}

                {!loadingOrders &&
                  !ordersError &&
                  customerOrders.length ===
                    0 && (
                    <div className="flex min-h-[180px] flex-col items-center justify-center p-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <ShoppingBag
                          size={22}
                        />
                      </div>

                      <p className="mt-3 text-sm font-bold text-slate-700">
                        Este cliente aún no tiene pedidos
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Cuando realice una compra aparecerá aquí.
                      </p>
                    </div>
                  )}

                {!loadingOrders &&
                  !ordersError &&
                  customerOrders.length >
                    0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[650px]">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                              Pedido
                            </th>

                            <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                              Fecha
                            </th>

                            <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-400">
                              Importe
                            </th>

                            <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">
                              Estado
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {customerOrders.map(
                            (
                              order,
                            ) => (
                              <tr
                                key={
                                  order.id
                                }
                                className="border-b border-slate-100 last:border-0"
                              >
                                <td className="px-5 py-4">
                                  <span className="font-mono text-xs font-bold text-slate-700">
                                    #
                                    {order.id.slice(
                                      0,
                                      8,
                                    )}
                                  </span>
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <CalendarDays
                                      size={
                                        15
                                      }
                                      className="text-slate-400"
                                    />

                                    {formatDateTime(
                                      order.created_at,
                                    )}
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-right">
                                  <span className="text-sm font-black text-slate-800">
                                    {formatCurrency(
                                      order.total,
                                    )}
                                  </span>
                                </td>

                                <td className="px-5 py-4 text-center">
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

                                    Registrado
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type OrderStatus = 'confirmado' | 'preparando' | 'empaquetando' | 'preparando_envio' | 'camino' | 'entregado' | 'cancelado';

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  profiles?: { full_name: string; email: string };
  order_items?: { quantity: number; unit_price: number; products?: { name: string } }[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
  categories?: { name: string };
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'confirmado', label: 'Confirmado', color: 'bg-gray-500' },
  { value: 'preparando', label: 'Preparando', color: 'bg-blue-500' },
  { value: 'empaquetando', label: 'Empaquetando', color: 'bg-yellow-500' },
  { value: 'preparando_envio', label: 'Preparando envío', color: 'bg-orange-500' },
  { value: 'camino', label: 'En camino', color: 'bg-purple-500' },
  { value: 'entregado', label: 'Entregado', color: 'bg-green-500' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-500' },
];

type Tab = 'orders' | 'products' | 'users';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    const supabase = createClient();
    supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
      if (data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        router.replace('/');
      }
      setCheckingAdmin(false);
    });
  }, [user, authLoading, router]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select('*, profiles(full_name, email), order_items(quantity, unit_price, products(name))')
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders((data as Order[]) || []);
    setLoading(false);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as UserProfile[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'products') fetchProducts();
    else if (activeTab === 'users') fetchUsers();
  }, [isAdmin, activeTab, fetchOrders, fetchProducts, fetchUsers]);

  // Real-time orders
  useEffect(() => {
    if (!isAdmin) return;
    const supabase = createClient();
    const channel = supabase
      .channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (activeTab === 'orders') fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, activeTab, fetchOrders]);

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    const supabase = createClient();
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      setMsg('Estado actualizado');
      setTimeout(() => setMsg(''), 2000);
    }
    setUpdatingId(null);
  }

  async function toggleProductActive(productId: string, current: boolean) {
    const supabase = createClient();
    await supabase.from('products').update({ is_active: !current }).eq('id', productId);
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, is_active: !current } : p));
  }

  if (authLoading || checkingAdmin) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-20 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-foreground">🛡️ Panel Administrador</h1>
              <p className="text-muted-foreground text-sm mt-1">Gestiona pedidos, productos y usuarios</p>
            </div>
            {msg && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold">
                ✅ {msg}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-muted/50 rounded-2xl p-1.5 border border-border w-fit mb-8">
            {(['orders', 'products', 'users'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab ? 'bg-white text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'orders' ? '📦 Pedidos' : tab === 'products' ? '🛋️ Productos' : '👥 Usuarios'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">No hay pedidos aún.</div>
                  ) : (
                    orders.map((order) => {
                      const statusOpt = STATUS_OPTIONS.find((s) => s.value === order.status);
                      return (
                        <div key={order.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="font-extrabold text-foreground font-mono text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">{order.profiles?.full_name || 'Usuario'} · {order.profiles?.email}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleString('es-PE')}</p>
                              <p className="font-extrabold text-primary mt-1">S/ {Number(order.total).toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${statusOpt?.color || 'bg-gray-500'}`}>
                                {statusOpt?.label || order.status}
                              </span>
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                                disabled={updatingId === order.id}
                                className="text-sm border border-border rounded-xl px-3 py-1.5 bg-background text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex flex-wrap gap-2">
                                {order.order_items.map((item, idx) => (
                                  <span key={idx} className="text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                                    {item.products?.name || 'Producto'} x{item.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">Producto</th>
                          <th className="text-left px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">Categoría</th>
                          <th className="text-left px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">Precio</th>
                          <th className="text-left px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">Stock</th>
                          <th className="text-left px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {products.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">No hay productos en la base de datos.</td></tr>
                        ) : (
                          products.map((product) => (
                            <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-5 py-3 font-semibold text-foreground">{product.name}</td>
                              <td className="px-5 py-3 text-muted-foreground">{product.categories?.name || '—'}</td>
                              <td className="px-5 py-3 font-bold text-primary">S/ {Number(product.price).toFixed(2)}</td>
                              <td className="px-5 py-3 text-muted-foreground">{product.stock}</td>
                              <td className="px-5 py-3">
                                <button
                                  onClick={() => toggleProductActive(product.id, product.is_active)}
                                  className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors ${product.is_active ? 'bg-green-500 hover:bg-green-600' : 'bg-red-400 hover:bg-red-500'}`}
                                >
                                  {product.is_active ? 'Activo' : 'Inactivo'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">Usuario</th>
                          <th className="text-left px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">Email</th>
                          <th className="text-left px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">Rol</th>
                          <th className="text-left px-5 py-3 font-bold text-muted-foreground text-xs uppercase tracking-widest">Registro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">No hay usuarios registrados.</td></tr>
                        ) : (
                          users.map((u) => (
                            <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-5 py-3 font-semibold text-foreground">{u.full_name || '—'}</td>
                              <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString('es-PE')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

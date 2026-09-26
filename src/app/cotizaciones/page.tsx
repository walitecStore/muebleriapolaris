'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Quote = {
  id: string;
  status: string;
  total: number | null;
  notes: string | null;
  created_at: string;
  quote_items:
    | {
        id: string;
        product_name: string;
        quantity: number;
        requested_price: number | null;
        quoted_price: number | null;
      }[]
    | null;
};
const statusLabel: Record<string, string> = {
  solicitada: 'Solicitud recibida',
  en_revision: 'En revision',
  cotizada: 'Cotizada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  convertida: 'Convertida en pedido',
};

export default function QuotesPage() {
  const { user, loading: authLoading } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void createClient()
      .from('quotes')
      .select(
        'id,status,total,notes,created_at,quote_items(id,product_name,quantity,requested_price,quoted_price)'
      )
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) setError(queryError.message);
        else setQuotes((data ?? []) as Quote[]);
        setLoading(false);
      });
  }, [user]);
  if (authLoading || loading)
    return (
      <>
        <Header />
        <main className="min-h-screen pt-28 text-center">Cargando cotizaciones...</main>
        <Footer />
      </>
    );
  if (!user)
    return (
      <>
        <Header />
        <main className="min-h-screen px-4 pt-32 text-center">
          <h1 className="text-3xl font-extrabold">Mis cotizaciones</h1>
          <p className="mt-3 text-muted-foreground">Inicia sesion para revisar tus solicitudes.</p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"
          >
            Iniciar sesion
          </Link>
        </main>
        <Footer />
      </>
    );
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/30 px-4 pb-16 pt-28">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Cuenta Polaris</p>
          <h1 className="mt-2 text-3xl font-extrabold">Mis cotizaciones</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Consulta el avance y la respuesta de nuestro equipo.
          </p>
          {error && <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <div className="mt-7 space-y-4">
            {quotes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-white p-10 text-center">
                <p className="font-bold">Aun no tienes cotizaciones.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Agrega productos al carrito y selecciona “Solicitar cotizacion”.
                </p>
                <Link
                  href="/catalogo"
                  className="mt-5 inline-block font-bold text-primary hover:underline"
                >
                  Ver catalogo
                </Link>
              </div>
            ) : (
              quotes.map((quote) => (
                <article
                  key={quote.id}
                  className="rounded-3xl border border-border bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold">Cotizacion #{quote.id.slice(0, 8).toUpperCase()}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(quote.created_at).toLocaleDateString('es-PE')}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {statusLabel[quote.status] ?? quote.status}
                    </span>
                  </div>
                  <div className="mt-5 divide-y divide-border">
                    {quote.quote_items?.map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                        <span>
                          {item.quantity}x {item.product_name}
                        </span>
                        <span className="font-bold">
                          {(item.quoted_price ?? item.requested_price)
                            ? `S/ ${(item.quoted_price ?? item.requested_price)?.toLocaleString('es-PE')}`
                            : 'Por definir'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {quote.total !== null && (
                    <p className="mt-4 text-right text-lg font-extrabold text-primary">
                      Total estimado: S/ {quote.total.toLocaleString('es-PE')}
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

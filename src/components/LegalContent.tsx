'use client';
import { useStore } from '@/contexts/StoreContext';
const policies = {
  privacidad: ['Política de privacidad', 'privacy_text'],
  terminos: ['Términos de compra', 'terms_text'],
  envios: ['Envíos y cobertura', 'shipping_text'],
  devoluciones: ['Garantía, devoluciones y reembolsos', 'returns_text'],
} as const;
export default function LegalContent({ type }: { type: string }) {
  const store = useStore(),
    policy = policies[type as keyof typeof policies];
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black">{policy[0]}</h1>
      <p className="mt-3 text-sm text-slate-500">{store.name}</p>
      <div className="mt-8 whitespace-pre-wrap leading-8 text-slate-700">
        {store[policy[1]] ||
          'Esta información todavía no ha sido publicada por la tienda. Consulta sus condiciones antes de realizar una compra.'}
      </div>
    </article>
  );
}

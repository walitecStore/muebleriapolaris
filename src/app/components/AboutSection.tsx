'use client';
import { useStore } from '@/contexts/StoreContext';
export default function AboutSection() {
  const store = useStore();
  return (
    <section id="nosotros" className="bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Nuestra tienda</p>
        <h2 className="mt-4 text-4xl font-black">{store.name}</h2>
        <p className="mt-5 max-w-3xl whitespace-pre-line text-lg leading-8 text-slate-300">
          {store.description ||
            'Encuentra muebles para tu hogar y consulta con nuestro equipo los materiales, la disponibilidad y las opciones de entrega.'}
        </p>
      </div>
    </section>
  );
}

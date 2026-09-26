'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';

const spaces = [
  {
    key: 'sala',
    eyebrow: 'Para reunirse',
    title: 'Una sala que invita a quedarte',
    text: 'Combina comodidad, textura y piezas que se adaptan a tu ritmo de vida.',
    image:
      '/assets/images/Source_Salon_de_lujo_de_diseno_moderno_de_muebles___1_-1784897819781.jpg',
    tags: ['Sofas', 'Sillones', 'Mesas auxiliares'],
  },
  {
    key: 'comedor',
    eyebrow: 'Para compartir',
    title: 'Momentos que caben alrededor de una mesa',
    text: 'Crea un comedor funcional y acogedor para todos los dias y ocasiones especiales.',
    image:
      '/assets/images/The_Furniture_World_U_Shape_9_Seater_Fabric_Sofa_Set_with_Tea_Table___4_Puffy_2___2___2___1___1___1-1784903888189.jpg',
    tags: ['Mesas', 'Sillas', 'Aparadores'],
  },
  {
    key: 'descanso',
    eyebrow: 'Para descansar',
    title: 'Tu refugio empieza en el dormitorio',
    text: 'Elige piezas pensadas para descansar mejor y mantener tu espacio en orden.',
    image: '/assets/images/euro_crema_2-1784905017426.jpg',
    tags: ['Camas', 'Cabeceras', 'Almacenamiento'],
  },
];

export default function InspirationSection() {
  const [active, setActive] = useState(0);
  const space = spaces[active];
  return (
    <section className="bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-cyan-300">
              Inspira tu hogar
            </p>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              No compres solo muebles. Diseña momentos.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/70">
              Explora ideas por ambiente y encuentra piezas que hagan que tu casa se sienta
              realmente tuya.
            </p>
            <div className="mt-8 space-y-2">
              {spaces.map((item, index) => (
                <button
                  key={item.key}
                  onClick={() => setActive(index)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition ${active === index ? 'bg-white text-slate-950 shadow-lg' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
                >
                  <span className="font-bold">{item.eyebrow}</span>
                  <span className="text-sm">0{index + 1}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] bg-slate-800">
            <AppImage
              src={space.image}
              alt={space.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                {space.eyebrow}
              </p>
              <h3 className="mt-2 max-w-lg text-3xl font-extrabold sm:text-4xl">{space.title}</h3>
              <p className="mt-3 max-w-lg text-white/75">{space.text}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {space.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/catalogo"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-cyan-100"
                >
                  Explorar catalogo
                </Link>
                <Link
                  href="/cotizaciones"
                  className="rounded-xl border border-white/40 px-5 py-3 text-sm font-extrabold transition hover:bg-white/10"
                >
                  Necesito asesoria
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

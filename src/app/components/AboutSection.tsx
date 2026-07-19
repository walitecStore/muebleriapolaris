'use client';

import React, { useEffect, useRef, useState } from 'react';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { value: 500, suffix: '+', label: 'Clientes Felices' },
  { value: 50, suffix: '+', label: 'Modelos Disponibles' },
  { value: 10, suffix: '+', label: 'Años de Experiencia' },
];

function useCountUp(target: number, duration: number, started: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);
  return count;
}

function StatCounter({ stat, started }: { stat: StatItem; started: boolean }) {
  const count = useCountUp(stat.value, 1800, started);
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl font-extrabold text-white mb-2">
        {count}{stat.suffix}
      </div>
      <div className="text-white/70 text-sm font-semibold uppercase tracking-widest">{stat.label}</div>
    </div>
  );
}

export default function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsStarted, setStatsStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal-on-scroll').forEach((el, i) => {
              setTimeout(() => el.classList.add('revealed'), i * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);

    const statsObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStatsStarted(true);
          statsObserver.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    if (statsRef.current) statsObserver.observe(statsRef.current);

    return () => { observer.disconnect(); statsObserver.disconnect(); };
  }, []);

  return (
    <section id="nosotros" className="py-20 bg-white overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-16">
          {/* Text side */}
          <div className="reveal-on-scroll">
            <span className="inline-block text-primary font-bold text-sm uppercase tracking-widest mb-4">Nuestra Historia</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
              Más de una década{' '}
              <span className="text-gradient-teal">transformando hogares</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
              En Mueblería Polaris llevamos más de 10 años transformando hogares con sofás de la más alta calidad. Cada pieza es seleccionada cuidadosamente para ofrecer comodidad, durabilidad y estilo.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              Trabajamos con los mejores fabricantes para traerte diseños modernos, clásicos y vanguardistas. Nuestro equipo de asesores está disponible por WhatsApp para ayudarte a elegir el sofá perfecto para tu hogar.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Materiales premium
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Garantía real
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Asesoría personalizada
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                Envío a domicilio
              </div>
            </div>
          </div>

          {/* Visual side */}
          <div className="reveal-on-scroll stagger-2 relative">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 p-8 sm:p-12 flex items-center justify-center min-h-[300px]">
              {/* Decorative background circles */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-primary/10 -translate-y-8 translate-x-8" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-secondary/10 translate-y-8 -translate-x-8" />
              {/* Large sofa illustration */}
              <div className="relative z-10 text-center">
                <div className="text-8xl sm:text-9xl mb-4 float-animation select-none" role="img" aria-label="Sofá decorativo">🛋️</div>
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-border rounded-full px-5 py-2.5 shadow-sm">
                  <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-foreground">Colección 2026 disponible</span>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <div className="font-extrabold text-foreground text-sm">4.9/5 estrellas</div>
                <div className="text-muted-foreground text-xs">+500 reseñas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div
          ref={statsRef}
          className="bg-gradient-hero rounded-3xl p-8 sm:p-12 reveal-on-scroll"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/20">
            {stats.map((stat) => (
              <StatCounter key={stat.label} stat={stat} started={statsStarted} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
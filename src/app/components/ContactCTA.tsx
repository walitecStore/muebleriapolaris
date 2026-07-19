'use client';

import React, { useEffect, useRef } from 'react';
import { WhatsAppIcon } from '@/components/Header';

export default function ContactCTA() {
  const ref = useRef<HTMLDivElement>(null);

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
      { threshold: 0.2 }
    );
    if (ref?.current) observer?.observe(ref?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <section id="contacto" className="py-20 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* CTA side */}
          <div className="reveal-on-scroll">
            <span className="inline-block text-secondary font-bold text-sm uppercase tracking-widest mb-4">Contáctanos</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-6 leading-tight">
              ¿Listo para renovar{' '}
              <span className="text-gradient-teal">tu sala?</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8">
              Contáctanos por WhatsApp y recibe asesoría personalizada. Nuestro equipo te ayudará a elegir el sofá perfecto para tu hogar y presupuesto.
            </p>

            <a
              href="https://wa.me/15550000000?text=Hola%20Muebler%C3%ADa%20Polaris!%20Quisiera%20asesor%C3%ADa%20para%20elegir%20un%20sof%C3%A1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white font-extrabold text-lg rounded-full hover:bg-[#25D366]/90 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#25D366]/30 pulse-ring"
            >
              <WhatsAppIcon className="w-6 h-6" />
              Escribir por WhatsApp
            </a>

            <p className="mt-4 text-muted-foreground text-sm">
              Tiempo de respuesta: menos de 30 minutos
            </p>
          </div>

          {/* Info side */}
          <div className="reveal-on-scroll stagger-2 space-y-5">
            {/* Store info cards */}
            <div className="bg-muted/50 rounded-2xl p-6 border border-border">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Horario de Atención
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Lunes – Viernes</span>
                  <span className="font-semibold text-foreground">9:00am – 7:00pm</span>
                </div>
                <div className="flex justify-between">
                  <span>Sábado</span>
                  <span className="font-semibold text-foreground">9:00am – 5:00pm</span>
                </div>
                <div className="flex justify-between">
                  <span>Domingo</span>
                  <span className="font-semibold text-foreground">10:00am – 3:00pm</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span>WhatsApp</span>
                  <span className="font-semibold text-[#25D366]">24/7 disponible</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-2xl p-6 border border-border">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Nuestra Tienda
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">📍</span>
                  <span>Av. Principal 123, Local 45, Ciudad</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <a href="tel:+15550000000" className="hover:text-primary transition-colors">+1 (555) 000-0000</a>
                </div>
                <div className="flex items-center gap-2">
                  <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                  <a
                    href="https://wa.me/15550000000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#25D366] font-semibold hover:underline"
                  >
                    +1 (555) 000-0000
                  </a>
                </div>
              </div>
            </div>

            {/* Mini promo */}
            <div className="bg-gradient-hero rounded-2xl p-5 text-white">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎁</span>
                <div>
                  <div className="font-bold text-sm">Oferta especial</div>
                  <div className="text-white/80 text-xs mt-0.5">Menciona este sitio web y obtén <strong>10% de descuento</strong> en tu primera compra.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
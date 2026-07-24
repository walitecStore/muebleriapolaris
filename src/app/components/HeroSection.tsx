'use client';

import React, { useEffect, useRef, useState } from 'react';
import { WhatsAppIcon } from '@/components/Header';

const SOFA_SLIDES = [
{
  label: 'Modelo Europeo',
  bg: "https://img.rocket.new/generatedImages/rocket_gen_img_15825f41f-1773164990521.png",
  alt: 'Sofá modelo europeo elegante de tres plazas en sala de estar moderna'
},
{
  label: 'Sofá 3 Plazas',
  bg: "/assets/images/Set_Sofa_Tamu_Minimalis_Jakarta_Terbaru__1_-1784897220233.jpg",
  alt: 'Sofá de tres plazas tapizado en tela gris con cojines decorativos'
},
{
  label: 'Sofá 2 Plazas',
  bg: "https://img.rocket.new/generatedImages/rocket_gen_img_1d73b106e-1772534395100.png",
  alt: 'Sofá de dos plazas compacto en sala de estar con decoración minimalista'
},
{
  label: 'Sofá 1 Plaza',
  bg: "/assets/images/WhatsApp_Image_2026-07-24_at_7.58.35_AM-1784899076228.jpeg",
  alt: 'Sillón de una plaza estilo europeo con tapizado premium en color beige'
},
{
  label: 'Modelo Europeo Premium',
  bg: "https://img.rocket.new/generatedImages/rocket_gen_img_185349182-1772946444315.png",
  alt: 'Conjunto de sofás modelo europeo premium en sala de estar lujosa'
}];

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => {
          const next = (prev + 1) % SOFA_SLIDES.length;
          setNextSlide((next + 1) % SOFA_SLIDES.length);
          return next;
        });
        setTransitioning(false);
      }, 1000);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width - 0.5;
      const my = (e.clientY - rect.top) / rect.height - 0.5;
      const blobs = hero.querySelectorAll<HTMLElement>('.hero-blob');
      blobs.forEach((blob, i) => {
        const factor = (i + 1) * 12;
        blob.style.transform = `translate(${mx * factor}px, ${my * factor}px)`;
      });
    };
    hero.addEventListener('mousemove', onMouseMove);
    return () => hero.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <section
      id="inicio"
      ref={heroRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background slides — crossfade */}
      {SOFA_SLIDES.map((slide, idx) =>
      <div
        key={slide.label}
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{
          backgroundImage: `url('${slide.bg}')`,
          opacity: idx === currentSlide ? (transitioning ? 0 : 1) : (idx === nextSlide && transitioning ? 1 : 0),
          zIndex: idx === currentSlide ? 1 : idx === nextSlide ? 0 : -1
        }} />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.65) 100%)' }} />

      {/* Teal color tint overlay */}
      <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(5,150,105,0.12) 100%)' }} />

      {/* Animated blob decorations */}
      <div
        className="hero-blob absolute top-20 left-10 w-64 h-64 rounded-full float-animation z-10"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)', filter: 'blur(40px)', transition: 'transform 0.1s ease-out' }} />
      
      <div
        className="hero-blob absolute bottom-32 right-16 w-80 h-80 rounded-full float-animation-slow z-10"
        style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.2) 0%, transparent 70%)', filter: 'blur(50px)', transition: 'transform 0.1s ease-out' }} />

      {/* Slide label badge */}
      <div className="absolute top-24 right-6 z-20 hidden sm:flex items-center gap-2 bg-black/30 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-700">
        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
        {mounted ? SOFA_SLIDES[currentSlide].label : SOFA_SLIDES[0].label}
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SOFA_SLIDES.map((_, idx) =>
        <button
          key={idx}
          onClick={() => { setCurrentSlide(idx); setNextSlide((idx + 1) % SOFA_SLIDES.length); }}
          aria-label={`Ver ${SOFA_SLIDES[idx].label}`}
          className={`rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 h-2 bg-cyan-400' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`} />
        )}
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <div className="animate-in-up inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full mb-8">
          <span className="w-2 h-2 bg-[#25D366] rounded-full animate-pulse" />
          Colección 2026 disponible
        </div>

        {/* Headline */}
        <h1 className="animate-in-up-delay-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
          Transforma tu hogar con{' '}
          <span className="shimmer-text">los mejores sofás</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-in-up-delay-2 text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Modelos Europeos, conjuntos 3-2-1, 12 piezas y más. Calidad premium, diseños exclusivos y precios justos.
        </p>

        {/* CTAs */}
        <div className="animate-in-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#catalogo"
            className="w-full sm:w-auto px-8 py-4 bg-white text-primary font-bold text-base rounded-full hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/20">
            Ver Catálogo
          </a>
          <a
            href="https://wa.me/916832791?text=Hola%20Muebler%C3%ADa%20Polaris!%20Quisiera%20informaci%C3%B3n%20sobre%20sus%20sof%C3%A1s"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366] text-white font-bold text-base rounded-full hover:bg-[#25D366]/90 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#25D366]/30">
            <WhatsAppIcon className="w-5 h-5" />
            Comprar por WhatsApp
          </a>
        </div>

        {/* Stats row */}
        <div className="animate-in-up-delay-4 flex flex-wrap justify-center gap-8 sm:gap-12">
          {[
            { value: '500+', label: 'Clientes felices' },
            { value: '50+', label: 'Modelos' },
            { value: '10+', label: 'Años de experiencia' }
          ].map((stat) =>
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</div>
              <div className="text-white/60 text-xs sm:text-sm font-medium mt-1">{stat.label}</div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <span className="text-white/50 text-xs font-medium tracking-widest uppercase">Descubrir</span>
        <div className="bounce-arrow text-white/60">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
}
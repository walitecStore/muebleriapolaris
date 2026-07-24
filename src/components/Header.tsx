'use client';

import React, { useState, useEffect } from 'react';
import AppLogo from '@/components/ui/AppLogo';


const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Catálogo', href: '#catalogo' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Testimonios', href: '#testimonios' },
  { label: 'Contacto', href: '#contacto' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 nav-enter transition-all duration-500 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-primary/10 border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('#inicio')}
            className="flex items-center gap-2 group"
            aria-label="Ir al inicio"
          >
            <AppLogo size={36} />
            <span
              className={`font-extrabold text-lg sm:text-xl tracking-tight transition-colors duration-300 ${
                scrolled ? 'text-foreground' : 'text-white'
              }`}
            >
              Mueblería Polaris
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className={`nav-link-underline text-sm font-semibold transition-colors duration-300 ${
                  scrolled ? 'text-muted-foreground hover:text-foreground' : 'text-white/90 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
            {/* Oferta Especial flashing button */}
            <button
              onClick={() => handleNavClick('#ruleta')}
              className="relative flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-extrabold hover:scale-105 transition-all duration-300 overflow-hidden"
              style={{ boxShadow: '0 0 15px rgba(251,191,36,0.6)' }}
            >
              <span className="absolute inset-0 bg-white/30 animate-ping rounded-full opacity-0" style={{ animationDuration: '1.5s' }} />
              ✨ Oferta Especial
            </button>
            <a
              href="https://wa.me/51916832791?text=Hola%20Muebler%C3%ADa%20Polaris!%20Quisiera%20informaci%C3%B3n%20sobre%20sus%20sof%C3%A1s"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-2.5 rounded-full text-sm font-bold hover:bg-secondary/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-secondary/30"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Consultar
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 transition-colors ${
              scrolled ? 'text-foreground' : 'text-white'
            }`}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span
              className={`block w-6 h-0.5 transition-all duration-300 origin-center ${
                scrolled ? 'bg-foreground' : 'bg-white'
              } ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
            />
            <span
              className={`block w-6 h-0.5 transition-all duration-300 ${
                scrolled ? 'bg-foreground' : 'bg-white'
              } ${menuOpen ? 'opacity-0 scale-x-0' : ''}`}
            />
            <span
              className={`block w-6 h-0.5 transition-all duration-300 origin-center ${
                scrolled ? 'bg-foreground' : 'bg-white'
              } ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
            />
          </button>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden mobile-menu-enter bg-white/95 backdrop-blur-xl border-t border-border shadow-xl">
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left px-4 py-3 text-base font-semibold text-foreground hover:text-primary hover:bg-muted rounded-xl transition-all duration-200"
                >
                  {link.label}
                </button>
              ))}
              {/* Mobile Oferta Especial */}
              <button
                onClick={() => handleNavClick('#ruleta')}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full text-base font-extrabold mt-1 hover:opacity-90 transition-all animate-pulse"
              >
                ✨ Oferta Especial
              </button>
              <a
                href="https://wa.me/51916832791?text=Hola%20Muebler%C3%ADa%20Polaris!%20Quisiera%20informaci%C3%B3n%20sobre%20sus%20sof%C3%A1s"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-full text-base font-bold mt-2 hover:bg-secondary/90 transition-all"
              >
                <WhatsAppIcon className="w-5 h-5" />
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/916832791?text=Hola!%20Quisiera%20informaci%C3%B3n%20sobre%20sus%20sof%C3%A1s"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/40 pulse-ring hover:scale-110 transition-transform duration-300"
        aria-label="Contactar por WhatsApp"
      >
        <WhatsAppIcon className="w-7 h-7" />
      </a>
    </>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
import React from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { WhatsAppIcon } from './Header';

const WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_URL || '#';

export default function Footer() {
  return (
    <footer className="bg-gradient-footer text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* =====================================================
              MARCA
          ===================================================== */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AppLogo size={40} />

              <span className="font-extrabold text-xl text-white">Mueblería Polaris</span>
            </div>

            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Sofás de calidad para tu hogar. Más de 10 años transformando espacios con estilo y
              comodidad.
            </p>

            {/* Redes sociales */}
            <div className="flex items-center gap-3 pt-2">
              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* TikTok
                  Se reemplaza el SVG defectuoso por un elemento
                  de texto para evitar errores de path.
              */}
              <a
                href="#"
                aria-label="TikTok"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="text-white font-black text-base leading-none" aria-hidden="true">
                  ♪
                </span>
              </a>

              {/* WhatsApp */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-[#25D366]/20 hover:bg-[#25D366]/40 flex items-center justify-center transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              </a>
            </div>
          </div>

          {/* =====================================================
              NAVEGACIÓN
          ===================================================== */}
          <div>
            <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-widest">
              Navegación
            </h3>

            <ul className="space-y-3">
              {[
                {
                  label: 'Inicio',
                  href: '#inicio',
                },
                {
                  label: 'Sofás Destacados',
                  href: '#destacados',
                },
                {
                  label: 'Catálogo Completo',
                  href: '#catalogo',
                },
                {
                  label: 'Sobre Nosotros',
                  href: '#nosotros',
                },
                {
                  label: 'Testimonios',
                  href: '#testimonios',
                },
                {
                  label: 'Contacto',
                  href: '#contacto',
                },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* =====================================================
              CONTACTO
          ===================================================== */}
          <div>
            <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-widest">
              Contacto
            </h3>

            <div className="space-y-4 text-sm text-white/60">
              {/* Dirección */}
              <div className="flex items-start gap-3">
                <svg
                  className="w-4 h-4 text-accent mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>

                <span>
                  Av. Principal 123, Local 45
                  <br />
                  Ciudad, País
                </span>
              </div>

              {/* Horario */}
              <div className="flex items-center gap-3">
                <svg
                  className="w-4 h-4 text-accent shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

                <span>Lun–Vie: 6am – 9am · Sáb: 6am – 7:30pm · Dom: 7am – 6pm</span>
              </div>

              {/* WhatsApp */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[#25D366] hover:text-[#25D366]/80 font-semibold transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />

                <span>WhatsApp</span>
              </a>
            </div>

            {/* Publicación */}
            <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-white/40 leading-relaxed">
              💡 <strong className="text-white/60">Para publicar este sitio:</strong> Dominio en
              Namecheap (~$10/año) + Hosting en Vercel (gratis).
            </div>
          </div>
        </div>

        {/* =====================================================
            BARRA INFERIOR
        ===================================================== */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>© 2024 Mueblería Polaris. Todos los derechos reservados.</p>

          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white/70 transition-colors">
              Política de Privacidad
            </a>

            <span>·</span>

            <a href="#" className="hover:text-white/70 transition-colors">
              Términos de Uso
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

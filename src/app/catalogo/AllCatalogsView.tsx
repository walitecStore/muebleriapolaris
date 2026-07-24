'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import { catalogCategories } from './catalogoData';

export default function AllCatalogsView() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-8 py-4 rounded-full text-base font-extrabold hover:bg-primary/90 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H2zM2 9a1 1 0 000 2h16a1 1 0 000-2H2zM2 15a1 1 0 000 2h16a1 1 0 000-2H2z" />
        </svg>
        {expanded ? 'Ocultar Catálogo Completo' : 'Ver Catálogo Completo'}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-8 text-left space-y-10">
          {catalogCategories?.map((cat) => (
            <div key={cat?.slug} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted">
                    <AppImage
                      src={cat?.image}
                      alt={cat?.alt}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-foreground">{cat?.label}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat?.description}</p>
                  </div>
                </div>
                <Link
                  href={`/catalogo/${cat?.slug}`}
                  className="shrink-0 flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
                >
                  Ver todo
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>

              {/* Main products preview */}
              <div className="p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Productos principales ({cat?.products?.filter(p => p?.name !== 'Próximamente')?.length} disponibles)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {cat?.products?.filter(p => p?.name !== 'Próximamente')?.slice(0, 6)?.map((product) => (
                    <div key={product?.id} className="group">
                      <div className="relative h-24 rounded-xl overflow-hidden bg-muted mb-1.5">
                        <AppImage
                          src={product?.image}
                          alt={product?.alt}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        />
                      </div>
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{product?.name}</p>
                      <p className="text-xs font-bold text-primary">{product?.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subcatalogs */}
              {cat?.subcatalogs?.length > 0 && (
                <div className="px-5 pb-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Subcatálogos ({cat?.subcatalogs?.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cat?.subcatalogs?.map((sub) => (
                      <Link
                        key={sub?.slug}
                        href={`/catalogo/${cat?.slug}`}
                        className="flex items-center gap-1.5 bg-muted hover:bg-primary/10 border border-border hover:border-primary text-foreground hover:text-primary text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
                        </svg>
                        {sub?.label}
                        <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-bold">{sub?.capacity}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

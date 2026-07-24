'use client';

import React from 'react';
import AppImage from '@/components/ui/AppImage';
import { useCart } from './CartContext';

const WA_NUMBER = '51916832791';

function buildWhatsAppCartUrl(items: { name: string; price: string; quantity: number }[]): string {
  const lines = items.map((item) => `• ${item.quantity}x ${item.name} — ${item.price}`).join('\n');
  const message = `Hola Mueblería Polaris! 😊\n\nMe gustaría solicitar los siguientes productos:\n\n${lines}\n\nPor favor, ¿me pueden dar más información y confirmar disponibilidad?\n\n¡Muchas gracias!`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, clearCart, isOpen, closeCart } = useCart();

  const waUrl = buildWhatsAppCartUrl(items);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Carrito de compras"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-white">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <h2 className="text-lg font-extrabold text-foreground">Mi Carrito</h2>
            {items.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Cerrar carrito"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <span className="text-6xl">🛋️</span>
              <p className="text-lg font-bold text-foreground">Tu carrito está vacío</p>
              <p className="text-sm text-muted-foreground">Agrega productos del catálogo para cotizar por WhatsApp</p>
              <button
                onClick={closeCart}
                className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:bg-primary/90 transition-all"
              >
                Ver Catálogo
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-muted/40 rounded-2xl p-3 border border-border">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                  <AppImage
                    src={item.image}
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{item.name}</p>
                  {item.measures && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.measures}</p>
                  )}
                  <p className="text-sm font-extrabold text-primary mt-1">{item.price}</p>
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all text-lg font-bold"
                      aria-label="Reducir cantidad"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold text-foreground w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all text-lg font-bold"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-auto w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      aria-label="Eliminar producto"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-4 py-4 border-t border-border bg-white space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{items.reduce((s, i) => s + i.quantity, 0)} producto(s) seleccionado(s)</span>
              <button
                onClick={clearCart}
                className="text-red-400 hover:text-red-600 text-xs font-semibold transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeCart}
              className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#20b858] text-white text-base font-extrabold py-4 rounded-2xl transition-all duration-200 hover:shadow-xl hover:shadow-[#25D366]/30 hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Cotizar por WhatsApp
            </a>
          </div>
        )}
      </div>
    </>
  );
}

'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'polaris_guest_cart';

export interface CartItem {
  id: number | string;
  variantId?: string | null;
  name: string;
  price: string;
  image: string;
  alt: string;
  measures?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number | string, variantId?: string | null) => void;
  updateQuantity: (id: number | string, quantity: number, variantId?: string | null) => void;
  clearCart: () => void;
  totalItems: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function sameItem(item: CartItem, id: CartItem['id'], variantId?: string | null) {
  return String(item.id) === String(id) && (item.variantId ?? null) === (variantId ?? null);
}

function readGuestCart(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item): item is CartItem =>
          Boolean(item && typeof item === 'object' && 'id' in item && 'quantity' in item)
        )
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const syncedCartId = useRef<string | null>(null);

  useEffect(() => {
    setItems(readGuestCart());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loading]);

  useEffect(() => {
    if (!user || loading) return;
    const userId = user.id;

    let cancelled = false;
    async function syncGuestCart() {
      const supabase = createClient();
      try {
        const { data: existingCart, error: cartError } = await supabase
          .from('shopping_carts')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (cartError) return; // La migracion aun no se ha aplicado: se conserva el carrito local.

        const cartId =
          existingCart?.id ??
          (await supabase.from('shopping_carts').insert({ user_id: userId }).select('id').single())
            .data?.id;

        if (!cartId || cancelled) return;
        syncedCartId.current = cartId;

        for (const item of items) {
          const productId = String(item.id);
          if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(productId)) continue;
          await supabase.rpc('sync_cart_item', {
            p_product_id: productId,
            p_variant_id: item.variantId ?? null,
            p_quantity: item.quantity,
          });
        }
      } catch {
        // El carrito local nunca se pierde si no hay red o tablas nuevas todavia.
      }
    }

    void syncGuestCart();
    return () => {
      cancelled = true;
    };
  }, [user, loading, items]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems((previous) => {
      const existing = previous.find((current) => sameItem(current, item.id, item.variantId));
      return existing
        ? previous.map((current) =>
            sameItem(current, item.id, item.variantId)
              ? { ...current, quantity: current.quantity + 1 }
              : current
          )
        : [...previous, { ...item, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: CartItem['id'], variantId?: string | null) => {
    setItems((previous) => previous.filter((item) => !sameItem(item, id, variantId)));
  }, []);

  const updateQuantity = useCallback(
    (id: CartItem['id'], quantity: number, variantId?: string | null) => {
      setItems((previous) =>
        quantity <= 0
          ? previous.filter((item) => !sameItem(item, id, variantId))
          : previous.map((item) => (sameItem(item, id, variantId) ? { ...item, quantity } : item))
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    const cartId = syncedCartId.current;
    if (cartId) void createClient().from('cart_items').delete().eq('cart_id', cartId);
  }, []);
  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

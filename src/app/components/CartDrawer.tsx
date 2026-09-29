'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AppImage from '@/components/ui/AppImage';
import { useCart } from './CartContext';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PAYMENT_METHODS, type PaymentMethodId, isPaymentApproved } from '@/lib/payments';
import Link from 'next/link';

/* =========================================================
   CONFIGURACIÓN GENERAL
========================================================= */

const WA_NUMBER = '51916832791';

/*
 * Punto de partida de Mueblería Polaris
 *
 * Av. 12 de Octubre 1805
 * San Martín de Porres - Lima
 */
const STORE_LOCATION = {
  lat: -11.993057,
  lng: -77.071283,
  address: 'Av. 12 de Octubre 1805, San Martín de Porres, Lima',
};

/*
 * Servidor público OSRM.
 *
 * No necesita API KEY.
 *
 * IMPORTANTE:
 * Es un servidor público/demostración.
 * Más adelante podemos cambiarlo por nuestro propio servicio.
 */
const ROUTING_URL = 'https://router.project-osrm.org';

/* =========================================================
   TIPOS
========================================================= */

interface ProductShippingData {
  id: string;
  name: string;
  price: number;

  shipping_category: string;

  shipping_weight_kg: number | null;
  shipping_volume_m3: number | null;
  shipping_pieces: number;
  shipping_factor: number;
}

interface ShippingQuote {
  distanceKm: number;
  cost: number;
  categories: {
    category: string;
    cost: number;
  }[];
}

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  country: string;
  is_default: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface LeafletMapInstance {
  setView: (center: [number, number], zoom: number) => void;

  remove: () => void;

  invalidateSize: () => void;

  on: (event: string, callback: (event: any) => void) => void;

  removeLayer?: (layer: any) => void;

  fitBounds?: (bounds: any) => void;
}

interface LeafletMarker {
  setLatLng: (coordinates: [number, number]) => LeafletMarker;

  addTo: (map: LeafletMapInstance) => LeafletMarker;

  bindPopup: (text: string) => LeafletMarker;

  openPopup?: () => LeafletMarker;
}

declare global {
  interface Window {
    L?: any;
  }
}

/* =========================================================
   UTILIDADES
========================================================= */

function normalizeText(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function isUuid(value: unknown): boolean {
  const text = String(value ?? '');

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text);
}

/*
 * Convierte:
 *
 * S/1,599
 * S/ 1,599
 * S/1,299.00
 * 1599
 *
 * correctamente a número.
 */
function parsePrice(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const text = String(value ?? '')
    .replace(/S\/?/gi, '')
    .replace(/\s/g, '')
    .trim();

  if (!text) return 0;

  /*
   * En tu catálogo los precios utilizan coma como separador
   * de miles.
   *
   * Ejemplo:
   * 1,599 -> 1599
   */
  const normalized = text.replace(/,/g, '');

  const result = Number(normalized);

  return Number.isFinite(result) ? result : 0;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, value));
}

function formatDistance(value: number): string {
  if (!Number.isFinite(value)) return '—';

  return `${value.toFixed(2)} km`;
}

/*
 * Convierte nombres de categorías de tu BD a los códigos
 * utilizados por shipping_categories.
 */
function canonicalShippingCategory(category: string | null | undefined): string {
  const value = normalizeText(category || '');

  if (value.includes('europeo') || value === 'europeo') {
    return 'EUROPEO';
  }

  if (value.includes('modular') || value === 'modular') {
    return 'MODULAR';
  }

  if (
    value.includes('seccional con parlantes') ||
    value.includes('parlantes') ||
    value === 'seccional_parlantes'
  ) {
    return 'SECCIONAL_PARLANTES';
  }

  if (value.includes('seccional') || value === 'seccional') {
    return 'SECCIONAL';
  }

  if (value.includes('3 2 1') || value.includes('3-2-1') || value === '3_2_1') {
    return '3_2_1';
  }

  if (value.includes('cama') || value === 'sofa_cama') {
    return 'SOFA_CAMA';
  }

  if (value.includes('puf')) {
    return 'PUF';
  }

  if (value.includes('decorativo')) {
    return 'DECORATIVO';
  }

  return String(category || 'EUROPEO')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

/* =========================================================
   WHATSAPP
========================================================= */

function buildWhatsAppCartUrl(
  items: {
    name: string;
    price: string;
    quantity: number;
  }[],
  shippingCost = 0,
  distanceKm: number | null = null
): string {
  const lines = items.map((item) => `• ${item.quantity}x ${item.name} — ${item.price}`).join('\n');

  const shippingText =
    shippingCost > 0
      ? `\n🚚 Envío estimado: ${formatMoney(shippingCost)}`
      : distanceKm !== null
        ? '\n🚚 Envío: pendiente de cotización'
        : '';

  const distanceText =
    distanceKm !== null ? `\n📍 Distancia aproximada: ${formatDistance(distanceKm)}` : '';

  const message = `Hola Mueblería Polaris! 👋

Me gustaría cotizar los siguientes productos:

${lines}

${shippingText}${distanceText}

Por favor, ¿me pueden brindar información y confirmar disponibilidad?

Muchas gracias.`;

  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

/* =========================================================
   LEAFLET
========================================================= */

async function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.L) {
    return window.L;
  }

  /*
   * CSS
   */
  if (!document.querySelector('link[data-polaris-leaflet="true"]')) {
    const link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

    link.dataset.polarisLeaflet = 'true';

    document.head.appendChild(link);
  }

  /*
   * JS
   */
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-polaris-leaflet="true"]');

    if (existing) {
      if (window.L) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve());

      existing.addEventListener('error', () => reject(new Error('No se pudo cargar el mapa.')));

      return;
    }

    const script = document.createElement('script');

    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

    script.async = true;

    script.dataset.polarisLeaflet = 'true';

    script.onload = () => resolve();

    script.onerror = () => reject(new Error('No se pudo cargar Leaflet.'));

    document.body.appendChild(script);
  });

  return window.L;
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, clearCart, isOpen, closeCart } = useCart();

  const { user } = useAuth();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    void createClient()
      .from('addresses')
      .select('id,label,street,city,state,country,is_default')
      .order('is_default', { ascending: false })
      .then(({ data }) => setSavedAddresses((data ?? []) as SavedAddress[]));
  }, [user]);
  /* =======================================================
     ESTADOS
  ======================================================= */

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);

  const [referenceAddress, setReferenceAddress] = useState('');

  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(null);

  const [loadingShipping, setLoadingShipping] = useState(false);

  const [loadingLocation, setLoadingLocation] = useState(false);

  const [savingOrder, setSavingOrder] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('yape');

  const [errorMessage, setErrorMessage] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    shortId: string;
    orderNumber: string;
    paymentStatus: string;
    paymentMessage: string;
  } | null>(null);

  /* =======================================================
     MAPA
  ======================================================= */

  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<LeafletMapInstance | null>(null);

  const markerRef = useRef<LeafletMarker | null>(null);

  /* =======================================================
     TOTALES
  ======================================================= */

  const productsTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parsePrice(item.price);

      return sum + price * Number(item.quantity || 0);
    }, 0);
  }, [items]);

  const shippingCost = shippingQuote?.cost ?? 0;

  const grandTotal = productsTotal + shippingCost;

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [items]);

  /* =======================================================
     INICIALIZAR MAPA
  ======================================================= */

  useEffect(() => {
    if (!checkoutOpen) return;

    let cancelled = false;

    async function initializeMap() {
      try {
        const L = await loadLeaflet();

        if (cancelled || !L || !mapContainerRef.current) {
          return;
        }

        /*
         * Evitamos crear el mapa dos veces.
         */
        if (mapRef.current) {
          setTimeout(() => {
            mapRef.current?.invalidateSize();
          }, 300);

          return;
        }

        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
        });

        mapRef.current = map;

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        map.setView(
          [
            selectedLocation?.lat ?? STORE_LOCATION.lat,

            selectedLocation?.lng ?? STORE_LOCATION.lng,
          ],
          14
        );

        const initialLocation = selectedLocation ?? {
          lat: STORE_LOCATION.lat,
          lng: STORE_LOCATION.lng,
        };

        const marker = L.marker([initialLocation.lat, initialLocation.lng])
          .addTo(map)
          .bindPopup('📍 Ubicación de entrega');

        markerRef.current = marker;

        /*
         * Si todavía no existe una ubicación
         * seleccionada, NO la consideramos
         * automáticamente como destino.
         */
        if (selectedLocation) {
          marker.openPopup?.();
        }

        /*
         * Click sobre el mapa.
         */
        map.on('click', (event: any) => {
          const lat = Number(event.latlng.lat);

          const lng = Number(event.latlng.lng);

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return;
          }

          const location = {
            lat,
            lng,
          };

          setSelectedLocation(location);

          setShippingQuote(null);

          marker.setLatLng([lat, lng]).bindPopup('📍 Ubicación seleccionada').openPopup?.();
        });

        /*
         * El mapa necesita recalcular su tamaño
         * porque está dentro de un drawer/modal.
         */
        setTimeout(() => {
          map.invalidateSize();
        }, 400);
      } catch (error) {
        console.error('Error inicializando mapa:', error);

        setErrorMessage('No se pudo cargar el mapa. Puedes usar tu ubicación del dispositivo.');
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
    };
  }, [checkoutOpen]);

  /* =======================================================
     ACTUALIZAR MARKER CUANDO CAMBIA UBICACIÓN
  ======================================================= */

  useEffect(() => {
    if (!selectedLocation || !markerRef.current || !mapRef.current) {
      return;
    }

    markerRef.current
      .setLatLng([selectedLocation.lat, selectedLocation.lng])
      .bindPopup('📍 Ubicación seleccionada');

    mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 15);
  }, [selectedLocation]);

  /* =======================================================
     LIMPIAR MAPA AL CERRAR CHECKOUT
  ======================================================= */

  useEffect(() => {
    if (checkoutOpen) return;

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch {
        // No hacemos nada si ya fue eliminado.
      }

      mapRef.current = null;
      markerRef.current = null;
    }
  }, [checkoutOpen]);

  /* =======================================================
     OBTENER UBICACIÓN DEL CLIENTE
  ======================================================= */

  const useCurrentLocation = useCallback(() => {
    setErrorMessage('');

    if (!navigator.geolocation) {
      setErrorMessage('Tu navegador no permite obtener la ubicación.');

      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setSelectedLocation(location);

        setShippingQuote(null);

        setLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);

        setLoadingLocation(false);

        setErrorMessage(
          'No se pudo obtener tu ubicación. Selecciona el punto manualmente en el mapa.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  }, []);

  /* =======================================================
     CONSULTAR PRODUCTOS DE FORMA SEGURA
  ======================================================= */

  const getProductsShippingData = useCallback(async (): Promise<ProductShippingData[]> => {
    if (items.length === 0) {
      throw new Error('El carrito está vacío.');
    }

    const supabase = createClient();

    const resolvedProducts: ProductShippingData[] = [];

    for (const item of items) {
      const itemId = String(item.id);

      let product: any = null;

      /*
       * ===================================================
       * CASO 1:
       * El ID sí es UUID.
       *
       * Solo en este caso hacemos .eq('id', ...)
       *
       * Esto evita el error:
       *
       * invalid input syntax for type uuid: "8"
       * ===================================================
       */

      if (isUuid(itemId)) {
        const { data, error } = await supabase
          .from('products')
          .select(
            `
              id,
              name,
              price,
              shipping_category,
              shipping_weight_kg,
              shipping_volume_m3,
              shipping_pieces,
              shipping_factor,
              category_id,
              categories (
                name
              )
            `
          )
          .eq('id', itemId)
          .maybeSingle();

        if (error) {
          throw new Error(`No se pudo consultar "${item.name}": ${error.message}`);
        }

        product = data;
      }

      /*
       * ===================================================
       * CASO 2:
       * ID numérico/antiguo.
       *
       * Ejemplo:
       *
       * id = "8"
       *
       * NO se consulta por UUID.
       *
       * Buscamos por nombre.
       * ===================================================
       */

      if (!product) {
        const cleanName = String(item.name || '').trim();

        if (!cleanName) {
          throw new Error(`No se pudo identificar el producto con ID "${itemId}".`);
        }

        const { data, error } = await supabase
          .from('products')
          .select(
            `
              id,
              name,
              price,
              shipping_category,
              shipping_weight_kg,
              shipping_volume_m3,
              shipping_pieces,
              shipping_factor,
              category_id,
              categories (
                name
              )
            `
          )
          .ilike('name', cleanName)
          .limit(1)
          .maybeSingle();

        if (error) {
          throw new Error(`No se pudo consultar "${cleanName}": ${error.message}`);
        }

        product = data;
      }

      if (!product) {
        throw new Error(`No se encontró el producto "${item.name}" en Supabase.`);
      }

      /*
       * Categoría directa de envío.
       */
      let shippingCategory = product.shipping_category;

      /*
       * Si está vacía, intentamos obtener
       * la categoría normal del producto.
       */
      if (!shippingCategory) {
        const categoryName = product.categories?.name;

        if (categoryName) {
          shippingCategory = canonicalShippingCategory(categoryName);
        }
      }

      /*
       * Último respaldo.
       */
      if (!shippingCategory) {
        shippingCategory = 'EUROPEO';
      }

      resolvedProducts.push({
        id: String(product.id),

        name: product.name || item.name,

        price: Number(product.price) || parsePrice(item.price),

        shipping_category: canonicalShippingCategory(shippingCategory),

        shipping_weight_kg:
          product.shipping_weight_kg != null ? Number(product.shipping_weight_kg) : null,

        shipping_volume_m3:
          product.shipping_volume_m3 != null ? Number(product.shipping_volume_m3) : null,

        shipping_pieces: product.shipping_pieces != null ? Number(product.shipping_pieces) : 1,

        shipping_factor: product.shipping_factor != null ? Number(product.shipping_factor) : 1,
      });
    }

    return resolvedProducts;
  }, [items]);

  /* =======================================================
     CALCULAR DISTANCIA REAL POR CARRETERA
  ======================================================= */

  const calculateRoadDistance = useCallback(async (destination: Coordinates): Promise<number> => {
    const url =
      `${ROUTING_URL}/route/v1/driving/` +
      `${STORE_LOCATION.lng},${STORE_LOCATION.lat};` +
      `${destination.lng},${destination.lat}` +
      `?overview=false&alternatives=false&steps=false`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`El servicio de rutas respondió ${response.status}.`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No se encontró una ruta por carretera para esa ubicación.');
    }

    const meters = Number(data.routes[0].distance);

    const km = meters / 1000;

    if (!Number.isFinite(km) || km <= 0) {
      throw new Error('La distancia calculada no es válida.');
    }

    return km;
  }, []);

  /* =======================================================
     CONSULTAR TARIFA EN API/SUPABASE
  ======================================================= */

  const requestShippingPrice = useCallback(
    async (category: string, distanceKm: number): Promise<number> => {
      const response = await fetch('/api/shipping', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          category,
          distanceKm,
        }),
      });

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.error || `No se pudo calcular el envío para ${category}.`);
      }

      /*
       * Soportamos distintos nombres por robustez.
       */
      const possibleValues = [
        data?.cost,
        data?.shippingCost,
        data?.shipping_cost,
        data?.data?.cost,
        data?.data?.shippingCost,
        data?.data?.shipping_cost,
      ];

      const cost = possibleValues
        .map((value) => Number(value))
        .find((value) => Number.isFinite(value));

      if (cost === undefined || cost < 0) {
        throw new Error(`La API de envío no devolvió un costo válido para ${category}.`);
      }

      return cost;
    },
    []
  );

  /* =======================================================
     CALCULAR ENVÍO COMPLETO
  ======================================================= */

  const calculateShipping = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (items.length === 0) {
      setErrorMessage('Agrega al menos un producto al carrito.');

      return;
    }

    if (!selectedLocation) {
      setErrorMessage('Selecciona primero la ubicación de entrega en el mapa.');

      return;
    }

    if (loadingShipping) {
      return;
    }

    setLoadingShipping(true);

    try {
      /*
       * 1. Obtener productos.
       */
      const products = await getProductsShippingData();

      /*
       * 2. Distancia por carretera.
       */
      const distanceKm = await calculateRoadDistance(selectedLocation);

      /*
       * 3. Categorías únicas.
       *
       * Si hay varios productos de la misma categoría,
       * no repetimos automáticamente la tarifa.
       */
      const uniqueCategories = Array.from(
        new Set(products.map((product) => product.shipping_category))
      );

      /*
       * 4. Calcular tarifa por categoría.
       */
      const categoryQuotes: {
        category: string;
        cost: number;
      }[] = [];

      for (const category of uniqueCategories) {
        const cost = await requestShippingPrice(category, distanceKm);

        categoryQuotes.push({
          category,
          cost,
        });
      }

      const totalShipping = categoryQuotes.reduce((sum, quote) => sum + quote.cost, 0);

      setShippingQuote({
        distanceKm,
        cost: totalShipping,
        categories: categoryQuotes,
      });

      setSuccessMessage(`Envío calculado para ${formatDistance(distanceKm)}.`);
    } catch (error: any) {
      console.error('Error calculando envío:', error);

      setShippingQuote(null);

      setErrorMessage(error?.message || 'No se pudo calcular el costo de envío.');
    } finally {
      setLoadingShipping(false);
    }
  }, [
    items,
    selectedLocation,
    loadingShipping,
    getProductsShippingData,
    calculateRoadDistance,
    requestShippingPrice,
  ]);

  /* =======================================================
     ABRIR CHECKOUT
  ======================================================= */

  const openCheckout = useCallback(() => {
    setErrorMessage('');
    setSuccessMessage('');
    setCheckoutOpen(true);
  }, []);

  /* =======================================================
     CERRAR CHECKOUT
  ======================================================= */

  const closeCheckout = useCallback(() => {
    if (savingOrder) return;

    setCheckoutOpen(false);
    setErrorMessage('');
    setSuccessMessage('');
  }, [savingOrder]);

  const saveQuote = useCallback(async () => {
    if (items.length === 0) return;
    if (!user) {
      setErrorMessage('Inicia sesion para guardar una cotizacion.');
      return;
    }
    setSavingQuote(true);
    setErrorMessage('');
    try {
      const supabase = createClient();
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          status: 'solicitada',
          total: productsTotal,
          notes: referenceAddress.trim() || null,
        })
        .select('id')
        .single();
      if (quoteError || !quote)
        throw new Error(quoteError?.message || 'No se pudo guardar la cotizacion.');
      const { error: itemsError } = await supabase.from('quote_items').insert(
        items.map((item) => ({
          quote_id: quote.id,
          product_name: item.name,
          quantity: Math.max(1, Number(item.quantity) || 1),
          requested_price: parsePrice(item.price),
        }))
      );
      if (itemsError) throw new Error(itemsError.message);
      setSuccessMessage('Cotizacion guardada. Te contactaremos pronto.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la cotizacion.');
    } finally {
      setSavingQuote(false);
    }
  }, [items, user, productsTotal, referenceAddress]);
  /* =======================================================
     COTIZAR POR WHATSAPP
     NO CREA PEDIDO
  ======================================================= */

  /* =======================================================
     CREAR PEDIDO
  ======================================================= */

  const createOrder = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (savingOrder) return;
    if (!user) return setErrorMessage('Debes iniciar sesión para realizar un pedido.');
    if (!items.length) return setErrorMessage('El carrito está vacío.');
    if (!selectedLocation) return setErrorMessage('Selecciona la ubicación de entrega.');
    if (!shippingQuote) return setErrorMessage('Primero calcula el costo de envío.');

    setSavingOrder(true);
    try {
      const products = await getProductsShippingData();
      const checkoutItems = items.map((item) => {
        const product = products.find(
          (entry) => normalizeText(entry.name) === normalizeText(item.name)
        );
        if (!product) throw new Error(`No se encontró el producto "${item.name}".`);
        return {
          productId: product.id,
          variantId: item.variantId ?? null,
          quantity: Math.max(1, Number(item.quantity) || 1),
        };
      });
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          paymentMethod,
          shipping: {
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lng,
            distanceKm: shippingQuote.distanceKm,
            address: referenceAddress.trim() || 'Ubicación seleccionada en mapa',
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || 'No se pudo iniciar el pago.');
      const order = result.order;
      const orderId = String(order.order_id);
      setCompletedOrder({
        id: orderId,
        shortId: orderId.replace(/-/g, '').slice(0, 8).toUpperCase(),
        orderNumber:
          order.order_number || `POL-${orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
        paymentStatus: result.payment?.status || order.payment_status || 'pending',
        paymentMessage: result.payment?.message || 'El pago está pendiente de validación.',
      });
      if (isPaymentApproved(result.payment?.status || order.payment_status)) {
        clearCart();
        setSuccessMessage('Pago aprobado. Pedido confirmado.');
      } else {
        setSuccessMessage('Solicitud registrada. Conservamos tu carrito hasta aprobar el pago.');
      }
    } catch (error) {
      console.error('Error iniciando checkout:', error);
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar el pago.');
    } finally {
      setSavingOrder(false);
    }
  }, [
    savingOrder,
    user,
    items,
    selectedLocation,
    shippingQuote,
    paymentMethod,
    referenceAddress,
    getProductsShippingData,
    clearCart,
  ]);

  /* =======================================================
     RESET AL VACIAR CARRITO
  ======================================================= */

  useEffect(() => {
    if (items.length === 0 && !completedOrder) {
      setShippingQuote(null);
      setSelectedLocation(null);
      setReferenceAddress('');
      setCheckoutOpen(false);
    }
  }, [items.length, completedOrder]);

  /* =======================================================
     URL WHATSAPP DEL CARRITO
  ======================================================= */

  const cartWhatsAppUrl = useMemo(() => {
    return buildWhatsAppCartUrl(items);
  }, [items]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* ===================================================
          BACKDROP
      =================================================== */}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
          onClick={checkoutOpen ? undefined : closeCart}
          aria-hidden="true"
        />
      )}

      {/* ===================================================
          DRAWER
      =================================================== */}

      <div
        className={`
          fixed top-0 right-0 h-full
          w-full max-w-md
          bg-white
          z-[70]
          shadow-2xl
          flex flex-col
          transition-transform
          duration-300
          ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        role="dialog"
        aria-label="Carrito de compras"
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>

            <h2 className="text-lg font-extrabold text-foreground">Mi Carrito</h2>

            {totalItems > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>

          <button
            onClick={closeCart}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Cerrar carrito"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* =================================================
            CONTENIDO DEL CARRITO
        ================================================= */}

        {!checkoutOpen && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
                  <span className="text-6xl">🛋️</span>

                  <p className="text-lg font-bold text-foreground">Tu carrito está vacío</p>

                  <p className="text-sm text-muted-foreground">Agrega productos del catálogo.</p>

                  <button
                    onClick={closeCart}
                    className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:bg-primary/90 transition-all"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={String(item.id)}
                    className="flex gap-3 bg-muted/40 rounded-2xl p-3 border border-border"
                  >
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                      <AppImage
                        src={item.image}
                        alt={item.alt || item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">
                        {item.name}
                      </p>

                      {item.measures && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.measures}</p>
                      )}

                      <p className="text-sm font-extrabold text-primary mt-1">{item.price}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-all text-lg font-bold"
                          aria-label="Reducir cantidad"
                        >
                          −
                        </button>

                        <span className="text-sm font-bold text-foreground w-5 text-center">
                          {item.quantity}
                        </span>

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
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* =================================================
                FOOTER DEL CARRITO
            ================================================= */}

            {items.length > 0 && (
              <div className="px-4 py-4 border-t border-border bg-white space-y-3 shrink-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{totalItems} producto(s)</span>

                  <button
                    onClick={() => {
                      clearCart();
                    }}
                    className="text-red-400 hover:text-red-600 text-xs font-semibold"
                  >
                    Vaciar carrito
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal</span>

                  <strong className="text-lg text-primary">{formatMoney(productsTotal)}</strong>
                </div>

                {/* COTIZAR */}
                <button
                  onClick={() => window.open(cartWhatsAppUrl, '_blank', 'noopener,noreferrer')}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20b858] text-white font-extrabold py-3.5 rounded-2xl transition-all"
                >
                  💬 Solicitar cotizacion
                </button>

                {/* REALIZAR PEDIDO */}
                <button
                  onClick={openCheckout}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-extrabold py-3.5 rounded-2xl transition-all"
                >
                  📦 Realizar pedido
                </button>
              </div>
            )}
          </>
        )}

        {/* ===================================================
            CHECKOUT
        =================================================== */}

        {checkoutOpen && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* CABECERA CHECKOUT */}

            <div className="flex items-center gap-3">
              <button
                onClick={savingOrder ? undefined : closeCheckout}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted"
              >
                ←
              </button>

              <div>
                <h3 className="text-xl font-extrabold text-foreground">Realizar pedido</h3>

                <p className="text-xs text-muted-foreground">
                  Confirma ubicación, envío y método de pago.
                </p>
              </div>
            </div>

            {completedOrder ? (
              <section
                className={`rounded-3xl border p-6 space-y-5 ${isPaymentApproved(completedOrder.paymentStatus) ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
              >
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
                    {isPaymentApproved(completedOrder.paymentStatus) ? '✓' : '⏳'}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {isPaymentApproved(completedOrder.paymentStatus)
                      ? 'Pago aprobado'
                      : 'Pago pendiente'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {isPaymentApproved(completedOrder.paymentStatus)
                      ? '✓ Pedido confirmado'
                      : completedOrder.paymentMessage}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white p-4 text-center shadow-sm">
                  <p className="text-xs text-muted-foreground">Número de pedido</p>
                  <p className="text-2xl font-black tracking-wider text-primary">
                    #{completedOrder.orderNumber}
                  </p>
                </div>
                {!isPaymentApproved(completedOrder.paymentStatus) && (
                  <div className="rounded-xl border border-amber-200 bg-white/70 p-3 text-xs text-amber-900">
                    No confirmaremos el pedido ni vaciaremos tu carrito hasta recibir una validación
                    verificable del proveedor. Podrás reintentar desde tu historial.
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/pedidos"
                    onClick={closeCart}
                    className="rounded-xl bg-primary px-4 py-3 text-center font-extrabold text-white"
                  >
                    Ver mi pedido
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCompletedOrder(null);
                      setCheckoutOpen(false);
                      closeCart();
                    }}
                    className="rounded-xl border border-border bg-white px-4 py-3 font-bold"
                  >
                    Continuar comprando
                  </button>
                </div>
              </section>
            ) : (
              <>
                {/* =================================================
                UBICACIÓN
            ================================================= */}

                <section className="border border-primary/20 rounded-2xl p-3 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-extrabold text-sm">📍 Ubicación de entrega</h4>

                      <p className="text-xs text-muted-foreground">
                        Selecciona exactamente dónde entregar el pedido.
                      </p>
                    </div>
                  </div>

                  {savedAddresses.length > 0 && (
                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-bold text-foreground">
                        Direccion guardada
                      </label>
                      <select
                        onChange={(event) => {
                          const address = savedAddresses.find(
                            (item) => item.id === event.target.value
                          );
                          if (address)
                            setReferenceAddress(
                              [address.street, address.city, address.state, address.country]
                                .filter(Boolean)
                                .join(', ')
                            );
                        }}
                        defaultValue=""
                        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Elegir una direccion (opcional)</option>
                        {savedAddresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.label}
                            {address.is_default ? ' - Principal' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* MAPA */}

                  <div
                    ref={mapContainerRef}
                    className="w-full h-[270px] rounded-xl overflow-hidden border border-border bg-muted"
                  />

                  {/* UBICACIÓN ACTUAL */}

                  <button
                    onClick={useCurrentLocation}
                    disabled={loadingLocation}
                    className="w-full mt-3 border border-primary text-primary hover:bg-primary/5 font-bold py-2.5 rounded-xl text-sm transition-all"
                  >
                    {loadingLocation ? '📍 Obteniendo ubicación...' : '📍 Usar mi ubicación actual'}
                  </button>

                  {/* DIRECCIÓN/REFERENCIA */}

                  <div className="mt-3">
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Referencia de entrega
                    </label>

                    <input
                      type="text"
                      value={referenceAddress}
                      onChange={(event) => {
                        setReferenceAddress(event.target.value);
                      }}
                      placeholder="Ej. Jr. García Naranjo 1107, La Victoria"
                      className="w-full border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* COORDENADAS */}

                  {selectedLocation && (
                    <div className="mt-3 rounded-xl bg-green-50 border border-green-200 p-3">
                      <p className="text-xs font-bold text-green-700">✅ Ubicación seleccionada</p>

                      <p className="text-[11px] text-green-700 mt-1">
                        Latitud: {selectedLocation.lat.toFixed(6)}
                      </p>

                      <p className="text-[11px] text-green-700">
                        Longitud: {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {/* CALCULAR ENVÍO */}

                  <button
                    onClick={calculateShipping}
                    disabled={loadingShipping || !selectedLocation}
                    className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold py-3 rounded-xl transition-all"
                  >
                    {loadingShipping ? '🚚 Calculando envío...' : '🚚 Calcular costo de envío'}
                  </button>
                </section>

                {/* =================================================
                RESUMEN ENVÍO
            ================================================= */}

                {shippingQuote && (
                  <section className="border border-green-200 bg-green-50 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-green-700">🚚 Envío calculado</p>

                        <p className="text-sm text-green-800 mt-1">Distancia por carretera</p>
                      </div>

                      <strong className="text-green-700">
                        {formatDistance(shippingQuote.distanceKm)}
                      </strong>
                    </div>

                    <div className="border-t border-green-200 mt-3 pt-3 space-y-2">
                      {shippingQuote.categories.map((category) => (
                        <div key={category.category} className="flex justify-between text-sm">
                          <span>{category.category}</span>

                          <strong>{formatMoney(category.cost)}</strong>
                        </div>
                      ))}

                      <div className="border-t border-green-200 pt-2 flex justify-between">
                        <span className="font-bold">Envío total</span>

                        <strong className="text-green-700">
                          {formatMoney(shippingQuote.cost)}
                        </strong>
                      </div>
                    </div>
                  </section>
                )}

                {/* =================================================
                MÉTODO DE PAGO
            ================================================= */}

                <section className="rounded-2xl border border-border bg-white p-4">
                  <div className="mb-3">
                    <h4 className="font-extrabold text-sm">Método de pago</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Elige cómo deseas pagar. La confirmación depende de la validación del
                      proveedor.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`rounded-xl border p-3 text-left transition ${paymentMethod === method.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                      >
                        <span className="mr-2">{method.icon}</span>
                        <span className="text-xs font-bold">{method.label}</span>
                      </button>
                    ))}
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-sm">Tus tarjetas</p>
                          <p className="text-xs text-muted-foreground">
                            No hay tarjetas tokenizadas.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled
                          className="rounded-lg border bg-white px-3 py-2 text-xs font-bold opacity-60"
                        >
                          + Agregar tarjeta
                        </button>
                      </div>
                      <div className="mt-3 rounded-xl bg-slate-900 p-4 text-white opacity-60">
                        <p className="text-xs text-slate-300">Tarjeta segura</p>
                        <p className="mt-4 font-mono tracking-widest">•••• •••• •••• ••••</p>
                      </div>
                      <p className="mt-3 text-[11px] text-slate-600">
                        Falta conectar una pasarela de tokenización. Polaris nunca almacenará el
                        número completo ni el CVV.
                      </p>
                    </div>
                  )}
                  {paymentMethod === 'mercado_pago' && (
                    <p className="mt-3 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
                      Mercado Pago requiere credenciales y validación segura del lado servidor. No
                      se simulará una aprobación.
                    </p>
                  )}
                  {['yape', 'plin', 'bank_transfer'].includes(paymentMethod) && (
                    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                      Este método quedará pendiente hasta que el pago sea validado.
                    </p>
                  )}
                </section>

                {/* =================================================
                RESUMEN FINAL
            ================================================= */}

                <section className="border border-border rounded-2xl p-4 bg-white">
                  <h4 className="font-extrabold text-sm mb-3">📋 Resumen del pedido</h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Productos</span>

                      <span>{formatMoney(productsTotal)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Envío</span>

                      <span>{shippingQuote ? formatMoney(shippingCost) : 'Pendiente'}</span>
                    </div>

                    <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                      <strong>TOTAL</strong>

                      <strong className="text-xl text-primary">{formatMoney(grandTotal)}</strong>
                    </div>
                  </div>
                </section>

                {/* =================================================
                MENSAJES
            ================================================= */}

                {errorMessage && (
                  <div className="border border-red-200 bg-red-50 text-red-700 rounded-xl p-3 text-xs font-medium">
                    ❌ {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="border border-green-200 bg-green-50 text-green-700 rounded-xl p-3 text-xs font-medium">
                    ✅ {successMessage}
                  </div>
                )}

                {/* =================================================
                COTIZAR SIN PEDIDO
            ================================================= */}

                <button
                  type="button"
                  onClick={saveQuote}
                  disabled={savingQuote}
                  className="w-full border border-[#25D366] text-[#168c43] hover:bg-green-50 font-extrabold py-3 rounded-xl transition-all"
                >
                  💬 Solicitar cotizacion
                </button>

                {/* =================================================
                CONFIRMAR PEDIDO
            ================================================= */}

                <button
                  type="button"
                  onClick={createOrder}
                  disabled={savingOrder || !selectedLocation || !shippingQuote}
                  className="w-full bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-extrabold py-3.5 rounded-xl transition-all"
                >
                  {savingOrder ? '⏳ Iniciando pago...' : 'Continuar al pago'}
                </button>

                <button
                  type="button"
                  onClick={savingOrder ? undefined : closeCheckout}
                  className="w-full border border-border hover:bg-muted text-foreground font-bold py-3 rounded-xl transition-all"
                >
                  Volver al carrito
                </button>

                <div className="h-4" />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

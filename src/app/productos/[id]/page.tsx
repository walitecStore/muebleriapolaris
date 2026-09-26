'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AppImage from '@/components/ui/AppImage';
import { WhatsAppIcon } from '@/components/Header';
import {
  sofaProducts,
  colorMap,
  type SofaReview,
  type SofaProduct,
} from '@/app/components/catalogData';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`${sizeClass} ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function InteractiveStarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(0)}
          className="focus:outline-none"
          aria-label={`${i + 1} estrellas`}
        >
          <svg
            className={`w-7 h-7 transition-colors ${i < (hover || value) ? 'text-yellow-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Compra verificada
    </span>
  );
}

function ReviewCard({ review }: { review: SofaReview }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${review.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}
          >
            {review.initials}
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{review.name}</p>
            <p className="text-xs text-muted-foreground">{review.location}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StarRating rating={review.rating} />
          <span className="text-xs text-muted-foreground">{review.date}</span>
        </div>
      </div>
      {review.verified && <VerifiedBadge />}
      <div>
        <p className="font-bold text-foreground text-sm mb-1">{review.title}</p>
        <p className="text-muted-foreground text-sm leading-relaxed">{review.text}</p>
      </div>
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border">
        <span className="text-xs text-muted-foreground">¿Fue útil?</span>
        <button className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors px-2 py-0.5 rounded-full hover:bg-primary/10">
          👍 {review.helpful}
        </button>
      </div>
    </div>
  );
}

const avatarColors = [
  'bg-primary',
  'bg-secondary',
  'bg-accent',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-orange-500',
];

const PRODUCT_VIDEO_BASE = '/videos/productos';
function getProductVideoUrl(productId: number) {
  return `${PRODUCT_VIDEO_BASE}/${productId}.mp4`;
}

type ProductMedia = {
  type: 'image' | 'video';
  src: string;
  label: string;
  color?: string;
};

type ProductWithMedia = SofaProduct & {
  video?: string;
  videoUrl?: string;
  colorVariants?: Array<{
    name: string;
    image: string;
    hex?: string;
  }>;
};

function VideoMedia({
  src,
  className = '',
  controls = false,
  autoPlay = false,
  muted = true,
  onError,
}: {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  onError?: React.ReactEventHandler<HTMLVideoElement>;
}) {
  return (
    <video
      src={src}
      className={`w-full h-full object-cover ${className}`}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      loop
      playsInline
      preload="metadata"
      onError={onError}
    />
  );
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = Number(params?.id);
  const sofa = sofaProducts.find((p) => p.id === productId) as ProductWithMedia | undefined;

  const [activeMedia, setActiveMedia] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');
  const [detectedColor, setDetectedColor] = useState<string | null>(null);
  const [detectedColorName, setDetectedColorName] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(sofa?.color ?? '');
  const [localReviews, setLocalReviews] = useState<SofaReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: '',
    location: '',
    rating: 5,
    title: '',
    text: '',
  });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setVideoError(false);
  }, [activeMedia]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!sofa) return;

    try {
      const stored = localStorage.getItem(`reviews_${sofa.id}`);
      if (stored) setLocalReviews(JSON.parse(stored));
    } catch {
      setLocalReviews([]);
    }

    const loadRemoteReviews = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('product_reviews')
          .select(
            'id, name, location, rating, title, text, created_at, verified, helpful, tags, avatar_color'
          )
          .eq('catalog_product_id', sofa.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('No se pudieron cargar reseñas de Supabase:', error.message);
          return;
        }

        const remoteReviews: SofaReview[] = (data ?? []).map((r: any) => ({
          id: r.id,
          name: r.name,
          initials: String(r.name ?? 'CL')
            .split(/\s+/)
            .map((w: string) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          location: r.location || 'Perú',
          rating: Number(r.rating) || 5,
          title: r.title || 'Mi reseña',
          text: r.text || '',
          date: new Date(r.created_at).toLocaleDateString('es-PE'),
          verified: Boolean(r.verified),
          helpful: Number(r.helpful) || 0,
          tags: Array.isArray(r.tags) ? r.tags : [],
          avatarColor: r.avatar_color || 'bg-primary',
        }));

        setLocalReviews(remoteReviews);
      } catch (err) {
        console.warn('Error cargando reseñas remotas:', err);
      }
    };

    loadRemoteReviews();
  }, [sofa]);

  const detectImageColor = useCallback((imgSrc: string) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const size = 64;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const data = ctx.getImageData(0, 0, size, size).data;
      const samples: Array<[number, number, number]> = [];

      // Ignore the extreme border where product photos commonly contain
      // white/gray studio backgrounds.
      for (let y = 8; y < size - 8; y += 2) {
        for (let x = 8; x < size - 8; x += 2) {
          const i = (y * size + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;

          // Skip near-white/very-dark background pixels and weak shadows.
          if (max > 245 && saturation < 0.08) continue;
          if (max < 28) continue;

          samples.push([r, g, b]);
        }
      }

      if (!samples.length) {
        setDetectedColor(null);
        setDetectedColorName(null);
        return;
      }

      // Trim extremes so one bright background region does not dominate.
      samples.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
      const usable = samples.slice(
        Math.floor(samples.length * 0.15),
        Math.ceil(samples.length * 0.85)
      );

      let r = 0,
        g = 0,
        b = 0;
      for (const sample of usable) {
        r += sample[0];
        g += sample[1];
        b += sample[2];
      }

      r = Math.round(r / usable.length);
      g = Math.round(g / usable.length);
      b = Math.round(b / usable.length);

      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

      // Approximate a human-friendly color name for filtering/search UI.
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      const brightness = (r + g + b) / 3;

      let hue = 0;
      if (delta !== 0) {
        if (max === r) hue = 60 * (((g - b) / delta) % 6);
        else if (max === g) hue = 60 * ((b - r) / delta + 2);
        else hue = 60 * ((r - g) / delta + 4);
        if (hue < 0) hue += 360;
      }

      let name = 'Neutro';
      if (brightness > 220 && delta < 35) name = 'Blanco';
      else if (brightness < 55) name = 'Negro';
      else if (delta < 25 && brightness < 105) name = 'Gris oscuro';
      else if (delta < 30 && brightness < 185) name = 'Gris';
      else if (delta < 35 && brightness >= 185) name = 'Beige';
      else if (hue >= 0 && hue < 18) name = 'Rojo';
      else if (hue >= 18 && hue < 45) name = brightness > 150 ? 'Beige' : 'Marrón';
      else if (hue >= 45 && hue < 75) name = 'Amarillo';
      else if (hue >= 75 && hue < 165) name = 'Verde';
      else if (hue >= 165 && hue < 255) name = 'Azul';
      else if (hue >= 255 && hue < 315) name = 'Morado';
      else name = 'Rosa';

      setDetectedColor(hex);
      setDetectedColorName(name);
    };

    img.onerror = () => {
      setDetectedColor(null);
      setDetectedColorName(null);
    };

    img.src = imgSrc;
  }, []);

  useEffect(() => {
    if (!sofa) return;
    setSelectedColor(sofa.color ?? '');
    const galleryForDetection = sofa.gallery?.[activeMedia] ?? sofa.image;
    if (galleryForDetection) {
      detectImageColor(galleryForDetection);
    }
  }, [sofa, activeMedia, detectImageColor]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sofa || !reviewForm.name.trim() || !reviewForm.text.trim() || !reviewForm.rating) return;

    const initials = reviewForm.name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          catalog_product_id: sofa.id,
          user_id: user?.id ?? null,
          name: reviewForm.name.trim(),
          location: reviewForm.location.trim() || 'Perú',
          rating: reviewForm.rating,
          title: reviewForm.title.trim() || 'Mi reseña',
          text: reviewForm.text.trim(),
          verified: false,
          helpful: 0,
          tags: [],
          avatar_color: avatarColors[Math.floor(Math.random() * avatarColors.length)],
          status: 'published',
        })
        .select(
          'id, name, location, rating, title, text, created_at, verified, helpful, tags, avatar_color'
        )
        .single();

      if (error) throw error;

      const newReview: SofaReview = {
        id: data.id,
        name: data.name,
        initials,
        location: data.location,
        rating: Number(data.rating),
        title: data.title,
        text: data.text,
        date: 'Hace un momento',
        verified: Boolean(data.verified),
        helpful: Number(data.helpful) || 0,
        tags: data.tags ?? [],
        avatarColor: data.avatar_color || 'bg-primary',
      };

      setLocalReviews((prev) => [newReview, ...prev]);

      const current = JSON.parse(localStorage.getItem(`reviews_${sofa.id}`) || '[]');
      localStorage.setItem(
        `reviews_${sofa.id}`,
        JSON.stringify([newReview, ...current].slice(0, 50))
      );

      setReviewForm({ name: '', location: '', rating: 5, title: '', text: '' });
      setShowReviewForm(false);
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 4000);
    } catch (err) {
      console.error('ERROR GUARDANDO RESEÑA:', err);

      // Respaldo local mientras la tabla de Supabase no esté disponible.
      const fallbackReview: SofaReview = {
        id: Date.now(),
        name: reviewForm.name.trim(),
        initials,
        location: reviewForm.location.trim() || 'Perú',
        rating: reviewForm.rating,
        title: reviewForm.title.trim() || 'Mi reseña',
        text: reviewForm.text.trim(),
        date: 'Hace un momento',
        verified: false,
        helpful: 0,
        tags: [],
        avatarColor: avatarColors[Math.floor(Math.random() * avatarColors.length)],
      };

      const current = JSON.parse(localStorage.getItem(`reviews_${sofa.id}`) || '[]');
      localStorage.setItem(
        `reviews_${sofa.id}`,
        JSON.stringify([fallbackReview, ...current].slice(0, 50))
      );
      setLocalReviews((prev) => [fallbackReview, ...prev]);
      setReviewForm({ name: '', location: '', rating: 5, title: '', text: '' });
      setShowReviewForm(false);
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 4000);
    }
  };

  if (!sofa) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🛋️</div>
            <h1 className="text-2xl font-extrabold text-foreground mb-2">Producto no encontrado</h1>
            <p className="text-muted-foreground mb-6">
              El sofá que buscas no existe o fue removido.
            </p>
            <Link
              href="/#catalogo"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors"
            >
              ← Ver catálogo completo
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const gallery = sofa.gallery ?? [sofa.image];
  const colorVariants = sofa.colorVariants ?? [];
  const videoUrl = sofa.video ?? sofa.videoUrl ?? getProductVideoUrl(sofa.id);

  const media: ProductMedia[] = [
    ...gallery.map((src, index) => ({
      type: 'image' as const,
      src,
      label: `Vista ${index + 1}`,
    })),
    ...(videoUrl
      ? [
          {
            type: 'video' as const,
            src: videoUrl,
            label: 'Video del producto',
          },
        ]
      : []),
  ];

  const activeItem = media[activeMedia] ?? media[0];
  const isVideoActive = activeItem?.type === 'video';
  const whatsappMsg = encodeURIComponent(
    `Hola Mueblería Polaris! Me interesa el ${sofa.name} (SKU: ${sofa.sku ?? sofa.id}), precio ${sofa.price}. ¿Pueden darme más información y disponibilidad?`
  );
  const whatsappUrl = `https://wa.me/51932036473?text=${whatsappMsg}`;
  const allReviews = [...(sofa.reviews ?? []), ...localReviews];

  const relatedSofas = sofaProducts
    .filter((p) => p.id !== sofa.id && (p.style === sofa.style || p.color === sofa.color))
    .slice(0, 3);

  return (
    <>
      <Header />
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <main className="pt-20 sm:pt-24 pb-20 min-h-screen bg-background">
        {/* Breadcrumb + Back button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <nav
            className="flex items-center gap-2 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-primary transition-colors font-medium">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/#catalogo" className="hover:text-primary transition-colors font-medium">
              Catálogo
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-[200px]">
              {sofa.name}
            </span>
          </nav>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-semibold text-muted-foreground hover:text-primary hover:border-primary bg-white transition-all duration-200 hover:shadow-sm shrink-0"
            aria-label="Volver atrás"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Atrás
          </button>
        </div>

        {/* Product Hero */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={heroRef}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">
            {/* Gallery */}
            <div className="flex flex-col gap-4 animate-in-up">
              {/* Main image */}
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border shadow-lg">
                {isVideoActive ? (
                  videoError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-center p-8">
                      <div className="text-6xl mb-4">🎥</div>
                      <h3 className="text-lg font-extrabold text-foreground">Video del producto</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                        Este producto aún no tiene un video cargado. El espacio ya está preparado
                        para mostrarlo.
                      </p>
                    </div>
                  ) : (
                    <VideoMedia
                      src={activeItem.src}
                      className="w-full h-full"
                      controls
                      autoPlay
                      muted
                      onError={() => setVideoError(true)}
                    />
                  )
                ) : (
                  <AppImage
                    src={activeItem?.src ?? gallery[0]}
                    alt={`${sofa.name} — vista ${activeMedia + 1} de ${media.length}`}
                    fill
                    className="object-cover w-full h-full transition-opacity duration-300"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                )}
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow">
                    {sofa.style}
                  </span>
                  <span className="bg-white/90 text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow">
                    {sofa.seats}
                  </span>
                </div>
                {detectedColor && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow text-xs font-semibold text-foreground">
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: detectedColor }}
                    />
                    Color detectado
                  </div>
                )}
                {/* Image counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {activeMedia + 1} / {media.length}
                </div>
              </div>

              {/* Thumbnails */}
              {media.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {media.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMedia(idx)}
                      className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        activeMedia === idx
                          ? 'border-primary shadow-md shadow-primary/20 scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                      aria-label={
                        item.type === 'video' ? 'Ver video del producto' : `Ver imagen ${idx + 1}`
                      }
                    >
                      {item.type === 'video' ? (
                        videoError ? (
                          <div className="w-full h-full bg-muted flex flex-col items-center justify-center text-[10px] font-bold text-muted-foreground">
                            <span className="text-xl">🎥</span>VIDEO
                          </div>
                        ) : (
                          <>
                            <VideoMedia src={item.src} muted />
                            <span className="absolute inset-0 bg-black/25 flex items-center justify-center">
                              <span className="w-8 h-8 rounded-full bg-white/95 text-primary flex items-center justify-center shadow-lg">
                                ▶
                              </span>
                            </span>
                          </>
                        )
                      ) : (
                        <AppImage
                          src={item.src}
                          alt={`${sofa.name} miniatura ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-6 animate-in-up-delay-1">
              {/* Name & rating */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">
                    Mueblería Polaris
                  </span>
                  {sofa.availability && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ {sofa.availability}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground leading-tight mb-3">
                  {sofa.name}
                </h1>
                {sofa.rating && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <StarRating rating={sofa.rating} size="md" />
                    <span className="font-bold text-foreground">{sofa.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">
                      ({sofa.reviewCount} reseñas)
                    </span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="text-4xl font-extrabold text-primary">{sofa.price}</span>
                <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  🚚 Cotiza tu entrega
                </span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-base leading-relaxed border-l-4 border-primary/30 pl-4">
                {sofa.description}
              </p>

              {/* Color, variantes y plazas */}
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-muted-foreground">Color:</span>
                    <span className="text-sm font-extrabold text-foreground">
                      {selectedColor || sofa.color}
                    </span>
                    {detectedColorName && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                        Detectado: {detectedColorName}
                      </span>
                    )}
                  </div>

                  {colorVariants.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {colorVariants.map((variant) => (
                        <button
                          key={variant.name}
                          type="button"
                          onClick={() => {
                            setSelectedColor(variant.name);
                            const variantIndex = gallery.findIndex((src) => src === variant.image);
                            if (variantIndex >= 0) setActiveMedia(variantIndex);
                            detectImageColor(variant.image);
                          }}
                          className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                            selectedColor === variant.name
                              ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                              : 'border-border bg-white text-foreground hover:border-primary/50'
                          }`}
                          title={`Ver ${variant.name}`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                            style={{
                              backgroundColor: variant.hex ?? colorMap[variant.name] ?? '#d1d5db',
                            }}
                          />
                          {variant.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5">
                      <span
                        className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                        style={{
                          backgroundColor: detectedColor ?? colorMap[sofa.color] ?? '#d1d5db',
                        }}
                        title={sofa.color}
                      />
                      <span className="text-xs font-bold text-foreground">{sofa.color}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">Plazas:</span>
                    <span className="text-sm font-bold text-foreground">{sofa.seats}</span>
                  </div>
                  {sofa.sku && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">SKU:</span>
                      <span className="text-sm font-mono text-muted-foreground">{sofa.sku}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              {sofa.features && sofa.features.length > 0 && (
                <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    Características principales
                  </p>
                  <ul className="space-y-2">
                    {sofa.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <svg
                          className="w-4 h-4 text-secondary shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* WhatsApp CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 flex-1 px-6 py-4 bg-[#25D366] text-white font-bold text-base rounded-2xl hover:bg-[#25D366]/90 transition-all duration-200 hover:shadow-xl hover:shadow-[#25D366]/30 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Consultar por WhatsApp
                </a>
                <a
                  href={`https://wa.me/51932036473?text=${encodeURIComponent(`Hola! Quiero comprar el ${sofa.name} (${sofa.price}). ¿Cómo procedo?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-secondary text-secondary-foreground font-bold text-base rounded-2xl hover:bg-secondary/90 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  Comprar ahora
                </a>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '🛡️', label: 'Garantía 2 años' },
                  { icon: '🚚', label: 'Entrega según ubicación' },
                  { icon: '↩️', label: '30 días devolución' },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="flex flex-col items-center gap-1 bg-muted/50 rounded-xl p-3 border border-border text-center"
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <span className="text-xs font-semibold text-muted-foreground leading-tight">
                      {badge.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mini video de producto — estilo marketplace */}
        {videoUrl && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-10">
            <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="px-5 sm:px-7 py-4 flex items-center justify-between gap-4 border-b border-border">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-widest text-primary">
                    Video del producto
                  </p>
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground mt-1">
                    Mira el sofá en movimiento
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Detalles de diseño, textura y proporciones antes de comprar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMedia(media.findIndex((item) => item.type === 'video'))}
                  className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 transition-all"
                >
                  ▶ Ver en galería
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-0">
                <div className="relative aspect-video lg:aspect-[16/7] bg-black">
                  {videoError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-center p-8">
                      <div className="text-5xl mb-3">🎥</div>
                      <p className="font-extrabold text-foreground">Video aún no disponible</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        El espacio está preparado para el video corto de este producto.
                      </p>
                    </div>
                  ) : (
                    <VideoMedia
                      src={videoUrl}
                      controls
                      muted
                      className="w-full h-full"
                      onError={() => setVideoError(true)}
                    />
                  )}
                  <div className="pointer-events-none absolute left-4 bottom-4 rounded-full bg-black/60 text-white px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
                    🎥 Vista rápida
                  </div>
                </div>

                <div className="p-5 sm:p-6 flex flex-col justify-center gap-4 bg-muted/20">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">👀</span>
                    <div>
                      <p className="font-bold text-sm text-foreground">Observa los detalles</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        El video ayuda a apreciar volumen, acabado y presencia real del modelo.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🎨</span>
                    <div>
                      <p className="font-bold text-sm text-foreground">Compara colores</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Después revisa las variantes disponibles para elegir tu acabado.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-xl">📲</span>
                    <div>
                      <p className="font-bold text-sm text-foreground">¿Te gustó?</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Consulta disponibilidad y entrega directamente por WhatsApp.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tabs: Specs & Reviews */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-14">
          {/* Tab buttons */}
          <div className="flex gap-1 bg-muted/50 rounded-2xl p-1.5 border border-border w-fit mb-8">
            {(['specs', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'specs' ? '📐 Especificaciones' : `⭐ Reseñas (${allReviews.length})`}
              </button>
            ))}
          </div>

          {/* Specs Tab */}
          {activeTab === 'specs' && sofa.specs && (
            <div className="animate-in-up">
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                  <h2 className="font-extrabold text-foreground text-lg">
                    Especificaciones técnicas
                  </h2>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    Medidas y materiales del {sofa.name}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {Object.entries(sofa.specs).map(([key, value], idx) => (
                    <div
                      key={key}
                      className={`flex items-center justify-between px-6 py-4 gap-4 ${idx % 2 === 0 ? 'bg-white' : 'bg-muted/20'}`}
                    >
                      <span className="text-sm font-semibold text-muted-foreground min-w-[140px]">
                        {key}
                      </span>
                      <span className="text-sm font-bold text-foreground text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="animate-in-up flex flex-col gap-6">
              {/* Rating summary */}
              <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span className="text-6xl font-extrabold text-foreground leading-none">
                    {sofa.rating?.toFixed(1) ?? '—'}
                  </span>
                  <StarRating rating={sofa.rating ?? 0} size="md" />
                  <span className="text-sm text-muted-foreground">{sofa.reviewCount} reseñas</span>
                </div>
                <div className="flex-1 w-full flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                      ✅ Compras verificadas
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                      🛋️ Clientes reales
                    </span>
                  </div>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="flex items-center gap-2 w-fit px-5 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all"
                  >
                    ✏️ {showReviewForm ? 'Cancelar' : 'Agregar reseña'}
                  </button>
                </div>
              </div>

              {/* Success message */}
              {reviewSubmitted && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="font-bold text-emerald-700">¡Reseña publicada!</p>
                    <p className="text-emerald-600 text-sm">
                      Gracias por compartir tu experiencia.
                    </p>
                  </div>
                </div>
              )}

              {/* Add Review Form */}
              {showReviewForm && (
                <div className="bg-card border border-primary/20 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-foreground text-lg mb-5">
                    ✏️ Escribir reseña
                  </h3>
                  <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">
                          Tu nombre *
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewForm.name}
                          onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Ej: María García"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">
                          Ciudad
                        </label>
                        <input
                          type="text"
                          value={reviewForm.location}
                          onChange={(e) =>
                            setReviewForm((f) => ({ ...f, location: e.target.value }))
                          }
                          placeholder="Ej: Lima, Perú"
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Calificación *
                      </label>
                      <InteractiveStarRating
                        value={reviewForm.rating}
                        onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Título de tu reseña
                      </label>
                      <input
                        type="text"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Ej: Excelente calidad"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">
                        Tu reseña *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={reviewForm.text}
                        onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
                        placeholder="Cuéntanos tu experiencia con este producto..."
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl hover:bg-primary/90 transition-all"
                      >
                        Publicar reseña
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-6 py-3 border border-border text-muted-foreground font-semibold text-sm rounded-xl hover:border-primary hover:text-primary transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Review cards */}
              {allReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {allReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card border border-border rounded-2xl">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="font-bold text-foreground mb-1">Sé el primero en opinar</p>
                  <p className="text-muted-foreground text-sm mb-5">
                    Comparte tu experiencia con este sofá
                  </p>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold text-sm px-5 py-3 rounded-xl hover:bg-primary/90 transition-all"
                  >
                    ✏️ Escribir reseña
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedSofas.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16">
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-foreground">
                También te puede interesar
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Sofás similares en estilo o color
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedSofas.map((related) => (
                <Link
                  key={related.id}
                  href={`/productos/${related.id}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-muted">
                    <AppImage
                      src={related.image}
                      alt={`${related.name} — sofá ${related.style.toLowerCase()} color ${related.color.toLowerCase()}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                        {related.style}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
                      {related.name}
                    </h3>
                    <p className="text-muted-foreground text-xs mb-3 flex-1">
                      {related.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-extrabold text-primary">{related.price}</span>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full group-hover:bg-primary group-hover:text-white transition-all">
                        Ver más →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Acceso rápido al video en móvil */}
        {videoUrl && (
          <button
            type="button"
            onClick={() => {
              const videoIndex = media.findIndex((item) => item.type === 'video');
              if (videoIndex >= 0) {
                setActiveMedia(videoIndex);
                window.scrollTo({ top: heroRef.current?.offsetTop ?? 0, behavior: 'smooth' });
              }
            }}
            className="fixed bottom-[78px] right-4 z-40 md:hidden w-12 h-12 rounded-full bg-black text-white shadow-xl border border-white/20 flex items-center justify-center"
            aria-label="Ver video del producto"
          >
            ▶
          </button>
        )}

        {/* Bottom WhatsApp sticky bar (mobile) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-border px-4 py-3 shadow-2xl">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-[#25D366] text-white font-bold text-base rounded-2xl hover:bg-[#25D366]/90 transition-all"
          >
            <WhatsAppIcon className="w-5 h-5" />
            Consultar por WhatsApp — {sofa.price}
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}

'use client';

import React, {
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
} from 'react';
import Image from 'next/image';

interface AppImageProps {
  src?: string | null;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  onClick?: () => void;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  unoptimized?: boolean;
  [key: string]: any;
}

/**
 * Determina si una fuente de imagen puede utilizarse.
 *
 * Aceptamos:
 * - /assets/images/foto.jpg
 * - /imagen.jpg
 * - https://...
 *
 * Rechazamos:
 * - null
 * - undefined
 * - ""
 * - rutas locales de Windows como C:\Users\...
 */
function isValidImageSource(src?: string | null): boolean {
  if (typeof src !== 'string') return false;

  const value = src.trim();

  if (!value) return false;

  // Rutas locales de Windows / archivos del equipo
  if (/^[a-zA-Z]:[\\/]/.test(value)) return false;

  // Rutas UNC
  if (value.startsWith('\\\\')) return false;

  // Rutas web externas
  if (/^https?:\/\//i.test(value)) return true;

  // Rutas internas de Next/public
  if (value.startsWith('/')) return true;

  return false;
}

const AppImage = memo(function AppImage({
  src,
  alt = '',
  width,
  height,
  className = '',
  priority = false,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  fill = false,
  sizes,
  onClick,
  fallbackSrc = '/assets/images/no_image.png',
  loading = 'lazy',
  unoptimized = false,
  ...props
}: AppImageProps) {
  /**
   * Si la imagen recibida no es válida, utilizamos inmediatamente
   * la imagen de respaldo.
   *
   * IMPORTANTE:
   * No esperamos a que Next/Image genere un error.
   */
  const initialSrc = useMemo(() => {
    return isValidImageSource(src) ? src!.trim() : fallbackSrc;
  }, [src, fallbackSrc]);

  const [imageSrc, setImageSrc] = useState<string>(initialSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  /**
   * Cuando cambia el producto o cambia su imagen desde la API,
   * sincronizamos nuevamente el estado interno.
   */
  useEffect(() => {
    const nextSrc = isValidImageSource(src) ? src!.trim() : fallbackSrc;

    setImageSrc(nextSrc);
    setIsLoading(true);
    setHasError(false);
  }, [src, fallbackSrc]);

  /**
   * Las imágenes externas se cargan sin optimización de Next.
   * Esto evita problemas con dominios externos que no estén
   * configurados en next.config.js.
   */
  const isExternalUrl = useMemo(
    () =>
      typeof imageSrc === 'string' &&
      /^https?:\/\//i.test(imageSrc),
    [imageSrc],
  );

  const resolvedUnoptimized =
    unoptimized || isExternalUrl;

  const handleError = useCallback(() => {
    /**
     * Si falla la imagen principal, cambiamos inmediatamente
     * al fallback.
     */
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(true);
    }

    setIsLoading(false);
  }, [imageSrc, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const imageClassName = useMemo(() => {
    const classes = [className];

    if (isLoading) {
      classes.push('bg-gray-200');
    }

    if (onClick) {
      classes.push(
        'cursor-pointer',
        'hover:opacity-90',
        'transition-opacity',
        'duration-200',
      );
    }

    return classes.filter(Boolean).join(' ');
  }, [className, isLoading, onClick]);

  const imageProps = useMemo(() => {
    const baseProps: any = {
      src: imageSrc,
      alt,
      className: imageClassName,
      quality,
      placeholder:
        placeholder === 'blur' && blurDataURL
          ? 'blur'
          : 'empty',
      unoptimized: resolvedUnoptimized,
      onError: handleError,
      onLoad: handleLoad,
      onClick,
    };

    if (
      placeholder === 'blur' &&
      blurDataURL
    ) {
      baseProps.blurDataURL = blurDataURL;
    }

    if (priority) {
      baseProps.priority = true;
    } else {
      baseProps.loading = loading;
    }

    return baseProps;
  }, [
    imageSrc,
    alt,
    imageClassName,
    quality,
    placeholder,
    blurDataURL,
    resolvedUnoptimized,
    priority,
    loading,
    handleError,
    handleLoad,
    onClick,
  ]);

  if (fill) {
    return (
      <div
        className="relative w-full h-full"
      >
        <Image
          {...imageProps}
          fill
          sizes={
            sizes ||
            '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          }
          style={{
            objectFit: 'cover',
          }}
          {...props}
        />
      </div>
    );
  }

  return (
    <Image
      {...imageProps}
      width={width || 400}
      height={height || 300}
      sizes={sizes}
      {...props}
    />
  );
});

AppImage.displayName = 'AppImage';

export default AppImage; 
'use client';

import { useState, useEffect } from 'react';

// ─── Named color palette ──────────────────────────────────────────────────────
export interface NamedColor {
  name: string;
  emoji: string;
  r: number;
  g: number;
  b: number;
}

export const NAMED_COLORS: NamedColor[] = [
  { name: 'Blanco',       emoji: '⚪', r: 255, g: 255, b: 255 },
  { name: 'Negro',        emoji: '⚫', r: 20,  g: 20,  b: 20  },
  { name: 'Gris Claro',   emoji: '🔘', r: 190, g: 190, b: 190 },
  { name: 'Gris Oscuro',  emoji: '🔘', r: 90,  g: 90,  b: 90  },
  { name: 'Plata',        emoji: '🔘', r: 192, g: 192, b: 192 },
  { name: 'Humo',         emoji: '🔘', r: 112, g: 112, b: 112 },
  { name: 'Beige',        emoji: '🟤', r: 220, g: 200, b: 170 },
  { name: 'Arena',        emoji: '🟤', r: 210, g: 190, b: 150 },
  { name: 'Crema',        emoji: '⚪', r: 240, g: 230, b: 200 },
  { name: 'Marfil',       emoji: '⚪', r: 245, g: 240, b: 220 },
  { name: 'Café',         emoji: '🟤', r: 120, g: 70,  b: 40  },
  { name: 'Chocolate',    emoji: '🟤', r: 90,  g: 45,  b: 20  },
  { name: 'Marrón',       emoji: '🟤', r: 140, g: 80,  b: 50  },
  { name: 'Camel',        emoji: '🟤', r: 190, g: 140, b: 80  },
  { name: 'Caramelo',     emoji: '🟤', r: 200, g: 130, b: 60  },
  { name: 'Mostaza',      emoji: '🟡', r: 210, g: 170, b: 30  },
  { name: 'Amarillo',     emoji: '🟡', r: 255, g: 230, b: 30  },
  { name: 'Dorado',       emoji: '🟡', r: 215, g: 175, b: 55  },
  { name: 'Naranja',      emoji: '🟠', r: 230, g: 120, b: 30  },
  { name: 'Rojo',         emoji: '🔴', r: 200, g: 40,  b: 40  },
  { name: 'Vino',         emoji: '🔴', r: 130, g: 20,  b: 40  },
  { name: 'Bordó',        emoji: '🔴', r: 110, g: 15,  b: 30  },
  { name: 'Rosado',       emoji: '🩷', r: 240, g: 150, b: 170 },
  { name: 'Fucsia',       emoji: '🩷', r: 220, g: 50,  b: 130 },
  { name: 'Morado',       emoji: '🟣', r: 130, g: 50,  b: 160 },
  { name: 'Lila',         emoji: '🟣', r: 180, g: 130, b: 210 },
  { name: 'Azul Marino',  emoji: '🔵', r: 20,  g: 40,  b: 100 },
  { name: 'Azul Rey',     emoji: '🔵', r: 40,  g: 80,  b: 200 },
  { name: 'Azul Claro',   emoji: '🔵', r: 100, g: 160, b: 220 },
  { name: 'Celeste',      emoji: '🔵', r: 130, g: 200, b: 240 },
  { name: 'Turquesa',     emoji: '🩵', r: 50,  g: 190, b: 190 },
  { name: 'Verde Claro',  emoji: '🟢', r: 130, g: 200, b: 100 },
  { name: 'Verde Oscuro', emoji: '🟢', r: 30,  g: 100, b: 50  },
  { name: 'Verde Olivo',  emoji: '🟢', r: 100, g: 120, b: 50  },
  { name: 'Esmeralda',    emoji: '🟢', r: 30,  g: 150, b: 100 },
  { name: 'Pistacho',     emoji: '🟢', r: 160, g: 210, b: 120 },
];

// ─── Color distance (Euclidean in RGB) ───────────────────────────────────────
function colorDistance(r1: number, g1: number, b1: number, nc: NamedColor): number {
  return Math.sqrt(
    Math.pow(r1 - nc.r, 2) +
    Math.pow(g1 - nc.g, 2) +
    Math.pow(b1 - nc.b, 2)
  );
}

// ─── Check if a pixel is "background-like" ───────────────────────────────────
// Ignores: white/near-white backgrounds, very light grays, near-black shadows
function isBackground(r: number, g: number, b: number): boolean {
  const brightness = (r + g + b) / 3;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);

  // Skip near-white (walls, backgrounds)
  if (brightness > 220 && saturation < 30) return true;
  // Skip near-black shadows
  if (brightness < 25) return true;
  // Skip very low saturation mid-grays (floors, walls)
  if (brightness > 160 && brightness < 220 && saturation < 20) return true;

  return false;
}

// ─── In-memory cache ─────────────────────────────────────────────────────────
const memCache = new Map<string, NamedColor>();
const CACHE_KEY_PREFIX = 'polaris_color_';

function getCached(imageUrl: string): NamedColor | null {
  if (memCache.has(imageUrl)) return memCache.get(imageUrl)!;
  try {
    const stored = localStorage.getItem(CACHE_KEY_PREFIX + btoa(imageUrl).slice(0, 40));
    if (stored) {
      const parsed = JSON.parse(stored) as NamedColor;
      memCache.set(imageUrl, parsed);
      return parsed;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

function setCache(imageUrl: string, color: NamedColor): void {
  memCache.set(imageUrl, color);
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + btoa(imageUrl).slice(0, 40), JSON.stringify(color));
  } catch {
    // localStorage not available
  }
}

// ─── Core extraction via Canvas ──────────────────────────────────────────────
function extractDominantColor(imageUrl: string): Promise<NamedColor> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        // Sample at reduced size for performance
        const size = 80;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(NAMED_COLORS[0]);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        // Bucket colors into 8-bit buckets (divide by 32) to find dominant
        const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue; // skip transparent
          if (isBackground(r, g, b)) continue;

          // Quantize to 32-step buckets
          const br = Math.round(r / 32) * 32;
          const bg = Math.round(g / 32) * 32;
          const bb = Math.round(b / 32) * 32;
          const key = `${br},${bg},${bb}`;

          const existing = buckets.get(key);
          if (existing) {
            existing.r += r;
            existing.g += g;
            existing.b += b;
            existing.count++;
          } else {
            buckets.set(key, { r, g, b, count: 1 });
          }
        }

        if (buckets.size === 0) {
          resolve(NAMED_COLORS[0]);
          return;
        }

        // Find the most frequent bucket
        let maxCount = 0;
        let dominantR = 128, dominantG = 128, dominantB = 128;

        buckets.forEach((val) => {
          if (val.count > maxCount) {
            maxCount = val.count;
            dominantR = Math.round(val.r / val.count);
            dominantG = Math.round(val.g / val.count);
            dominantB = Math.round(val.b / val.count);
          }
        });

        // Map to nearest named color
        let nearest = NAMED_COLORS[0];
        let minDist = Infinity;
        for (const nc of NAMED_COLORS) {
          const dist = colorDistance(dominantR, dominantG, dominantB, nc);
          if (dist < minDist) {
            minDist = dist;
            nearest = nc;
          }
        }

        resolve(nearest);
      } catch {
        resolve(NAMED_COLORS[0]);
      }
    };

    img.onerror = () => resolve(NAMED_COLORS[0]);

    // For local images, use the full URL
    if (imageUrl.startsWith('/')) {
      img.src = imageUrl;
    } else {
      img.src = imageUrl;
    }
  });
}

// ─── React hook ──────────────────────────────────────────────────────────────
export function useAutoColor(imageUrl: string): { color: NamedColor | null; loading: boolean } {
  const [color, setColor] = useState<NamedColor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imageUrl || imageUrl.includes('no_image')) {
      setLoading(false);
      return;
    }

    // Check cache first
    const cached = getCached(imageUrl);
    if (cached) {
      setColor(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Run in background — doesn't block render
    extractDominantColor(imageUrl).then((detected) => {
      setCache(imageUrl, detected);
      setColor(detected);
      setLoading(false);
    });
  }, [imageUrl]);

  return { color, loading };
}

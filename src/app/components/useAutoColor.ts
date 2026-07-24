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

// ─── Convert RGB to HSL ───────────────────────────────────────────────────────
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break;
      case gn: h = ((bn - rn) / d + 2) / 6; break;
      case bn: h = ((rn - gn) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// ─── Color distance using perceptual weighting ────────────────────────────────
function colorDistance(r1: number, g1: number, b1: number, nc: NamedColor): number {
  const dr = r1 - nc.r;
  const dg = g1 - nc.g;
  const db = b1 - nc.b;
  // Perceptual weighting (human eye is more sensitive to green)
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

// ─── Check if a pixel should be excluded (background, floor, wall, etc.) ─────
function isExcluded(r: number, g: number, b: number): boolean {
  const { s, l } = rgbToHsl(r, g, b);

  // Skip near-white (walls, backgrounds, white cushions) — tighter threshold
  if (l > 85 && s < 18) return true;
  // Skip near-black (shadows, very dark areas)
  if (l < 7) return true;
  // Skip very light grays (light walls, light floors)
  if (l > 72 && s < 12) return true;
  // Skip medium-light grays (typical floor/wall colors)
  if (l > 52 && l < 78 && s < 9) return true;

  return false;
}

// ─── Check if a pixel is chromatic (has real color, not gray/neutral) ─────────
function isChromatic(r: number, g: number, b: number): boolean {
  const { s, l } = rgbToHsl(r, g, b);
  // Tighter chromatic check: meaningful saturation and not too dark/light
  return s > 18 && l > 12 && l < 90;
}

// ─── In-memory cache ─────────────────────────────────────────────────────────
const memCache = new Map<string, NamedColor>();
const CACHE_KEY_PREFIX = 'polaris_color_v3_'; // v3 to bust old wrong cache

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
        // Larger canvas = more pixel data = more accurate detection
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(NAMED_COLORS[0]);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        // Separate chromatic and achromatic pixel buckets
        const chromaticBuckets = new Map<string, { r: number; g: number; b: number; count: number; weight: number }>();
        const achromaticBuckets = new Map<string, { r: number; g: number; b: number; count: number; weight: number }>();

        for (let py = 0; py < size; py++) {
          for (let px = 0; px < size; px++) {
            const i = (py * size + px) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a < 128) continue;
            if (isExcluded(r, g, b)) continue;

            // Center-weighted: pixels near center get higher weight
            // Furniture is typically in the center of product photos
            const cx = px / size - 0.5;
            const cy = py / size - 0.5;
            // Elliptical center zone — wider horizontally (sofas are wide)
            const distFromCenter = Math.sqrt((cx * cx) / 0.18 + (cy * cy) / 0.14);
            const weight = Math.max(0.15, 1 - distFromCenter);

            // Quantize to 20-step buckets for better grouping
            const br = Math.round(r / 20) * 20;
            const bg = Math.round(g / 20) * 20;
            const bb = Math.round(b / 20) * 20;
            const key = `${br},${bg},${bb}`;

            const chromatic = isChromatic(r, g, b);
            const targetMap = chromatic ? chromaticBuckets : achromaticBuckets;

            const existing = targetMap.get(key);
            if (existing) {
              existing.r += r * weight;
              existing.g += g * weight;
              existing.b += b * weight;
              existing.count++;
              existing.weight += weight;
            } else {
              targetMap.set(key, { r: r * weight, g: g * weight, b: b * weight, count: 1, weight });
            }
          }
        }

        // Calculate total weighted counts
        let totalChromaticWeight = 0;
        chromaticBuckets.forEach(v => { totalChromaticWeight += v.weight; });

        let totalAchromaticWeight = 0;
        achromaticBuckets.forEach(v => { totalAchromaticWeight += v.weight; });

        // Strategy: if there are significant chromatic pixels (>6% of non-excluded pixels),
        // use the dominant chromatic color. Otherwise fall back to achromatic.
        const totalWeight = totalChromaticWeight + totalAchromaticWeight;
        const chromaticRatio = totalWeight > 0 ? totalChromaticWeight / totalWeight : 0;

        let dominantR = 128, dominantG = 128, dominantB = 128;
        let usedChromatic = false;

        if (chromaticRatio > 0.06 && chromaticBuckets.size > 0) {
          // Find dominant chromatic bucket by weighted count
          let maxWeight = 0;
          chromaticBuckets.forEach((val) => {
            if (val.weight > maxWeight) {
              maxWeight = val.weight;
              dominantR = Math.round(val.r / val.weight);
              dominantG = Math.round(val.g / val.weight);
              dominantB = Math.round(val.b / val.weight);
            }
          });
          usedChromatic = true;
        } else if (achromaticBuckets.size > 0) {
          // Fall back to dominant achromatic bucket
          let maxWeight = 0;
          achromaticBuckets.forEach((val) => {
            if (val.weight > maxWeight) {
              maxWeight = val.weight;
              dominantR = Math.round(val.r / val.weight);
              dominantG = Math.round(val.g / val.weight);
              dominantB = Math.round(val.b / val.weight);
            }
          });
        }

        // If chromatic was used, only match against chromatic named colors
        // to avoid misidentifying a blue sofa as gray
        const candidateColors = usedChromatic
          ? NAMED_COLORS.filter(nc => {
              const { s } = rgbToHsl(nc.r, nc.g, nc.b);
              return s > 10; // only chromatic named colors
            })
          : NAMED_COLORS;

        const colorPool = candidateColors.length > 0 ? candidateColors : NAMED_COLORS;

        // Map to nearest named color
        let nearest = colorPool[0];
        let minDist = Infinity;
        for (const nc of colorPool) {
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
    img.src = imageUrl;
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
    extractDominantColor(imageUrl).then((detected) => {
      setCache(imageUrl, detected);
      setColor(detected);
      setLoading(false);
    });
  }, [imageUrl]);

  return { color, loading };
}

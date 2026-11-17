import type { CubeColor } from '../types/cube';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HsvColor {
  h: number; // 0..360
  s: number; // 0..1
  v: number; // 0..1
}

export interface LabColor {
  l: number; // 0..100
  a: number; // -128..127
  b: number; // -128..127
}

export interface ColorDetectionResult {
  color: CubeColor;
  confidence: number; // 0..100
  sampledRgb: RgbColor;
  sampledHex: string;
}

// Convert sRGB to HSV
export function rgbToHsv(r: number, g: number, b: number): HsvColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / diff) % 6;
        break;
      case gn:
        h = (bn - rn) / diff + 2;
        break;
      case bn:
        h = (rn - gn) / diff + 4;
        break;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return { h, s, v };
}

// Convert sRGB to CIELAB (D65 standard illuminant)
export function rgbToLab(r: number, g: number, b: number): LabColor {
  // 1. Convert to linear sRGB
  const toLinear = (c: number) => {
    const v = c / 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  };

  const rLinear = toLinear(r) * 100;
  const gLinear = toLinear(g) * 100;
  const bLinear = toLinear(b) * 100;

  // 2. Convert to CIEXYZ
  const x = rLinear * 0.4124 + gLinear * 0.3576 + bLinear * 0.1805;
  const y = rLinear * 0.2126 + gLinear * 0.7152 + bLinear * 0.0722;
  const z = rLinear * 0.0193 + gLinear * 0.1192 + bLinear * 0.9505;

  // D65 reference white points
  const xn = 95.047;
  const yn = 100.0;
  const zn = 108.883;

  const f = (t: number) => {
    return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  };

  const fx = f(x / xn);
  const fy = f(y / yn);
  const fz = f(z / zn);

  const l = Math.max(0, 116 * fy - 16);
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return { l, a, b: bVal };
}

// Perceptual color distance Delta E (CIE76)
export function deltaE76(lab1: LabColor, lab2: LabColor): number {
  const dl = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
}

// Reference standard color values in CIELAB
export const STANDARD_PALETTES: Record<CubeColor, { rgb: RgbColor; hsv: HsvColor; lab: LabColor }> = {
  white: {
    rgb: { r: 245, g: 245, b: 245 },
    hsv: rgbToHsv(245, 245, 245),
    lab: rgbToLab(245, 245, 245),
  },
  yellow: {
    rgb: { r: 250, g: 215, b: 0 },
    hsv: rgbToHsv(250, 215, 0),
    lab: rgbToLab(250, 215, 0),
  },
  green: {
    rgb: { r: 0, g: 155, b: 72 },
    hsv: rgbToHsv(0, 155, 72),
    lab: rgbToLab(0, 155, 72),
  },
  blue: {
    rgb: { r: 0, g: 70, b: 173 },
    hsv: rgbToHsv(0, 70, 173),
    lab: rgbToLab(0, 70, 173),
  },
  red: {
    rgb: { r: 183, g: 18, b: 52 },
    hsv: rgbToHsv(183, 18, 52),
    lab: rgbToLab(183, 18, 52),
  },
  orange: {
    rgb: { r: 255, g: 88, b: 0 },
    hsv: rgbToHsv(255, 88, 0),
    lab: rgbToLab(255, 88, 0),
  },
  purple: {
    rgb: { r: 147, g: 51, b: 234 },
    hsv: rgbToHsv(147, 51, 234),
    lab: rgbToLab(147, 51, 234),
  },
  pink: {
    rgb: { r: 236, g: 72, b: 153 },
    hsv: rgbToHsv(236, 72, 153),
    lab: rgbToLab(236, 72, 153),
  },
  lightgreen: {
    rgb: { r: 74, g: 222, b: 128 },
    hsv: rgbToHsv(74, 222, 128),
    lab: rgbToLab(74, 222, 128),
  },
  lightblue: {
    rgb: { r: 56, g: 189, b: 248 },
    hsv: rgbToHsv(56, 189, 248),
    lab: rgbToLab(56, 189, 248),
  },
  grey: {
    rgb: { r: 100, g: 116, b: 139 },
    hsv: rgbToHsv(100, 116, 139),
    lab: rgbToLab(100, 116, 139),
  },
  cream: {
    rgb: { r: 254, g: 240, b: 138 },
    hsv: rgbToHsv(254, 240, 138),
    lab: rgbToLab(254, 240, 138),
  },
};

// Convert RGB to hex string
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Sample a circular/rectangular Region of Interest (ROI) with glare/shadow filtering
export function sampleRoiPixels(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): RgbColor {
  const startX = Math.max(0, Math.floor(centerX - radius));
  const startY = Math.max(0, Math.floor(centerY - radius));
  const size = Math.floor(radius * 2);

  const imgData = ctx.getImageData(startX, startY, size, size).data;
  const validPixels: RgbColor[] = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - radius;
      const dy = y - radius;
      // Circular mask to ignore corner artifacts
      if (dx * dx + dy * dy <= radius * radius) {
        const idx = (y * size + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];

        const hsv = rgbToHsv(r, g, b);

        // Filter out extreme glare (pure blown-out specular highlights)
        if (hsv.v > 0.98 && hsv.s < 0.12) {
          continue;
        }

        // Filter out deep shadows / black borders
        if (hsv.v < 0.12) {
          continue;
        }

        validPixels.push({ r, g, b });
      }
    }
  }

  // Fallback if all were filtered
  if (validPixels.length === 0) {
    const centerIdx = (Math.floor(size / 2) * size + Math.floor(size / 2)) * 4;
    return {
      r: imgData[centerIdx] || 128,
      g: imgData[centerIdx + 1] || 128,
      b: imgData[centerIdx + 2] || 128,
    };
  }

  // Use Median filter for robust estimation against glares
  validPixels.sort((a, b) => (a.r + a.g + a.b) - (b.r + b.g + b.b));
  const median = validPixels[Math.floor(validPixels.length / 2)];
  return median;
}

// Classify sampled pixel color with perceptual Lab distance & HSV chromatic rules
export function classifySampledColor(
  rgb: RgbColor,
  allowedColors: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange']
): ColorDetectionResult {
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const lab = rgbToLab(rgb.r, rgb.g, rgb.b);

  let bestColor: CubeColor = allowedColors[0] || 'white';
  let minDistance = Infinity;

  // 1. Direct White Check: Low saturation and high brightness
  if (allowedColors.includes('white')) {
    if (hsv.s < 0.22 && hsv.v > 0.40) {
      return {
        color: 'white',
        confidence: Math.round(Math.min(99, 100 * (1 - hsv.s) * hsv.v)),
        sampledRgb: rgb,
        sampledHex: rgbToHex(rgb.r, rgb.g, rgb.b),
      };
    }
  }

  // 2. Perceptual Lab Matching with HSV Hue verification
  for (const candidate of allowedColors) {
    const ref = STANDARD_PALETTES[candidate];
    if (!ref) continue;

    let distance = deltaE76(lab, ref.lab);

    // Hue penalty: if hue angle diverges by more than 40 degrees, apply penalty
    let hueDiff = Math.abs(hsv.h - ref.hsv.h);
    if (hueDiff > 180) hueDiff = 360 - hueDiff;

    if (candidate !== 'white' && candidate !== 'grey') {
      distance += (hueDiff / 180) * 20;

      // Special red/orange disambiguation
      if (candidate === 'red' && hsv.h >= 18 && hsv.h <= 42) {
        distance += 25; // penalize red if in orange hue territory
      }
      if (candidate === 'orange' && (hsv.h < 14 || hsv.h > 45)) {
        distance += 25; // penalize orange if in red or yellow territory
      }
    }

    if (distance < minDistance) {
      minDistance = distance;
      bestColor = candidate;
    }
  }

  const confidence = Math.max(20, Math.min(98, Math.round(100 - minDistance * 1.4)));

  return {
    color: bestColor,
    confidence,
    sampledRgb: rgb,
    sampledHex: rgbToHex(rgb.r, rgb.g, rgb.b),
  };
}

export interface RoiPoint {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  radius: number; // 0..1 normalized
  label: string;
}

export function getPuzzleRoiPoints(puzzleId: string, stickersCount: number): RoiPoint[] {
  if (puzzleId === 'pyraminx') {
    return [
      // Top tip (1)
      { x: 0.50, y: 0.22, radius: 0.06, label: '1' },
      // Mid tier (3)
      { x: 0.36, y: 0.48, radius: 0.06, label: '2' },
      { x: 0.50, y: 0.54, radius: 0.06, label: '3' },
      { x: 0.64, y: 0.48, radius: 0.06, label: '4' },
      // Bottom tier (5)
      { x: 0.22, y: 0.76, radius: 0.06, label: '5' },
      { x: 0.36, y: 0.80, radius: 0.06, label: '6' },
      { x: 0.50, y: 0.76, radius: 0.06, label: '7' },
      { x: 0.64, y: 0.80, radius: 0.06, label: '8' },
      { x: 0.78, y: 0.76, radius: 0.06, label: '9' },
    ];
  }

  if (puzzleId === 'skewb') {
    return [
      { x: 0.50, y: 0.50, radius: 0.10, label: 'Center' },
      { x: 0.26, y: 0.26, radius: 0.08, label: 'TL' },
      { x: 0.74, y: 0.26, radius: 0.08, label: 'TR' },
      { x: 0.74, y: 0.74, radius: 0.08, label: 'BR' },
      { x: 0.26, y: 0.74, radius: 0.08, label: 'BL' },
    ];
  }

  if (puzzleId === 'megaminx') {
    const points: RoiPoint[] = [
      { x: 0.50, y: 0.50, radius: 0.07, label: 'Center' },
    ];
    for (let i = 0; i < 10; i++) {
      const angle = (i * (2 * Math.PI / 10)) - Math.PI / 2;
      const x = 0.50 + 0.33 * Math.cos(angle);
      const y = 0.50 + 0.33 * Math.sin(angle);
      points.push({
        x: Math.round(x * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
        radius: 0.05,
        label: `${i + 1}`,
      });
    }
    return points;
  }

  // Cubic grid: 2x2, 3x3, 4x4
  const gridSize = Math.round(Math.sqrt(stickersCount)) || 3;
  const points: RoiPoint[] = [];
  const step = 1 / gridSize;
  const radius = (step * 0.45) / 2;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      points.push({
        x: (c + 0.5) * step,
        y: (r + 0.5) * step,
        radius,
        label: `${r * gridSize + c + 1}`,
      });
    }
  }

  return points;
}

export interface ImageQualityMetrics {
  isBlurry: boolean;
  sharpnessScore: number;
  brightnessScore: number;
  isTooDark: boolean;
  isTooBright: boolean;
  warningMessage?: string;
}

/**
 * Fast client-side image sharpness and lighting assessment for camera frames and photo uploads.
 * Detects blurry, out-of-focus, underexposed, or overexposed captures to guide the user.
 */
export function evaluateImageQuality(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): ImageQualityMetrics {
  const imgData = ctx.getImageData(0, 0, width, height).data;
  let totalLuma = 0;
  let sampleCount = 0;
  let totalGradient = 0;
  let gradientCount = 0;

  // Step every 4 pixels for high performance and low CPU overhead
  const step = 4;
  const stride = width * 4;

  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = y * stride + x * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuma += luma;
      sampleCount++;

      // Compute horizontal and vertical gradients
      const idxRight = idx + step * 4;
      const idxDown = idx + step * stride;

      if (idxRight < imgData.length && idxDown < imgData.length) {
        const lumaRight = 0.299 * imgData[idxRight] + 0.587 * imgData[idxRight + 1] + 0.114 * imgData[idxRight + 2];
        const lumaDown = 0.299 * imgData[idxDown] + 0.587 * imgData[idxDown + 1] + 0.114 * imgData[idxDown + 2];
        const gradX = Math.abs(luma - lumaRight);
        const gradY = Math.abs(luma - lumaDown);
        totalGradient += Math.sqrt(gradX * gradX + gradY * gradY);
        gradientCount++;
      }
    }
  }

  const brightnessScore = sampleCount > 0 ? Math.round(totalLuma / sampleCount) : 128;
  const sharpnessScore = gradientCount > 0 ? Math.round((totalGradient / gradientCount) * 10) / 10 : 0;

  const isTooDark = brightnessScore < 35;
  const isTooBright = brightnessScore > 235;
  const isBlurry = sharpnessScore < 6.5;

  let warningMessage: string | undefined;
  if (isBlurry) {
    warningMessage = 'Blurry or unfocused image detected. Please hold the camera steady, ensure good lighting, or tap any sticker to manually adjust colors.';
  } else if (isTooDark) {
    warningMessage = 'Image is very dark. Please move to a brighter environment or turn on a light for accurate color recognition.';
  } else if (isTooBright) {
    warningMessage = 'Image has severe glare or overexposure. Avoid direct flashlight reflections on the stickers.';
  }

  return {
    isBlurry,
    sharpnessScore,
    brightnessScore,
    isTooDark,
    isTooBright,
    warningMessage,
  };
}


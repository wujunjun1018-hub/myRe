import type { ColorHistogram, TextureFeatures, ImageFeatures } from '../types';

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return [h * 360, s, l];
}

function extractColorHistogram(imageData: ImageData): ColorHistogram {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const hue = new Array(12).fill(0);
  const saturation = new Array(5).fill(0);
  const lightness = new Array(5).fill(0);
  const colorCounts = new Map<string, { count: number; h: number; s: number; l: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const [h, s, l] = rgbToHsl(r, g, b);

    // Hue histogram (12 bins of 30°)
    if (s > 0.1 && l > 0.1 && l < 0.9) {
      const hueBin = Math.min(11, Math.floor(h / 30));
      hue[hueBin]++;
    }

    // Saturation histogram (5 bins)
    const satBin = Math.min(4, Math.floor(s * 5));
    saturation[satBin]++;

    // Lightness histogram (5 bins)
    const lightBin = Math.min(4, Math.floor(l * 5));
    lightness[lightBin]++;

    // Track dominant colors (quantize to reduce unique colors)
    const qh = Math.round(h / 15) * 15;
    const qs = Math.round(s * 10) / 10;
    const ql = Math.round(l * 10) / 10;
    const key = `${qh}-${qs}-${ql}`;
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { count: 1, h: qh, s: qs, l: ql });
    }
  }

  // Normalize histograms
  for (let i = 0; i < 12; i++) hue[i] /= totalPixels;
  for (let i = 0; i < 5; i++) saturation[i] /= totalPixels;
  for (let i = 0; i < 5; i++) lightness[i] /= totalPixels;

  // Get top 5 dominant colors
  const sorted = [...colorCounts.values()].sort((a, b) => b.count - a.count);
  const dominantColors: [number, number, number][] = sorted
    .slice(0, 5)
    .map((c) => [c.h, c.s, c.l]);

  return { hue, saturation, lightness, dominantColors };
}

function extractTextureFeatures(imageData: ImageData): TextureFeatures {
  const { data, width, height } = imageData;

  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;
  }

  // Sobel edge detection
  let edgeSum = 0;
  const directionality = new Array(8).fill(0);
  let totalGradient = 0;

  const gxKernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gyKernel = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      let ki = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const val = gray[(y + ky) * width + (x + kx)];
          gx += val * gxKernel[ki];
          gy += val * gyKernel[ki];
          ki++;
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edgeSum += magnitude;

      if (magnitude > 0.05) {
        let angle = Math.atan2(gy, gx);
        if (angle < 0) angle += Math.PI * 2;
        const bin = Math.min(7, Math.floor((angle / (Math.PI * 2)) * 8));
        directionality[bin] += magnitude;
        totalGradient += magnitude;
      }
    }
  }

  const edgePixels = (width - 2) * (height - 2);
  const edgeDensity = Math.min(1, edgeSum / edgePixels);

  // Normalize directionality
  if (totalGradient > 0) {
    for (let i = 0; i < 8; i++) directionality[i] /= totalGradient;
  }

  // Coarseness: using local variance at different scales
  let coarseness = 0;
  const scales = [2, 4, 8];
  for (const scale of scales) {
    let variance = 0;
    let count = 0;
    for (let y = 0; y < height - scale; y += scale) {
      for (let x = 0; x < width - scale; x += scale) {
        let mean = 0;
        let n = 0;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            mean += gray[(y + dy) * width + (x + dx)];
            n++;
          }
        }
        mean /= n;
        let v = 0;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const diff = gray[(y + dy) * width + (x + dx)] - mean;
            v += diff * diff;
          }
        }
        variance += v / n;
        count++;
      }
    }
    coarseness += count > 0 ? variance / count : 0;
  }
  coarseness = Math.min(1, coarseness / scales.length);

  // Contrast: global standard deviation
  let mean = 0;
  for (let i = 0; i < gray.length; i++) mean += gray[i];
  mean /= gray.length;
  let stdDev = 0;
  for (let i = 0; i < gray.length; i++) {
    const diff = gray[i] - mean;
    stdDev += diff * diff;
  }
  const contrast = Math.min(1, Math.sqrt(stdDev / gray.length) * 2);

  // Regularity: autocorrelation-based pattern repetition estimate
  let regularity = 0;
  const step = Math.max(1, Math.floor(width / 32));
  const offsets = [4, 8, 16];
  for (const offset of offsets) {
    let corr = 0;
    let n = 0;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width - offset; x += step) {
        corr += gray[y * width + x] * gray[y * width + x + offset];
        n++;
      }
    }
    if (n > 0) regularity += corr / n;
  }
  regularity = Math.min(1, regularity / offsets.length);

  return { edgeDensity, directionality, coarseness, contrast, regularity };
}

export function extractFeatures(imageData: ImageData): ImageFeatures {
  const colorHistogram = extractColorHistogram(imageData);
  const textureFeatures = extractTextureFeatures(imageData);

  // Calculate average color
  const { data } = imageData;
  let rSum = 0,
    gSum = 0,
    bSum = 0;
  const total = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i];
    gSum += data[i + 1];
    bSum += data[i + 2];
  }

  return {
    colorHistogram,
    textureFeatures,
    avgColor: [Math.round(rSum / total), Math.round(gSum / total), Math.round(bSum / total)],
  };
}

export function loadImageAsImageData(
  src: string,
  maxSize = 256
): Promise<{ imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      // Scale down for performance
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve({ imageData: ctx.getImageData(0, 0, width, height), width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = src;
  });
}

export function createThumbnail(src: string, maxSize = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxSize / width, maxSize / height);
      if (ratio < 1) {
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = src;
  });
}

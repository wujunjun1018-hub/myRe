import type { ColorHistogram, ColorMoments, TextureFeatures, ImageFeatures } from '../types';

// --- Color space conversions ---

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // sRGB -> linear RGB
  let rl = r / 255, gl = g / 255, bl = b / 255;
  rl = rl > 0.04045 ? Math.pow((rl + 0.055) / 1.055, 2.4) : rl / 12.92;
  gl = gl > 0.04045 ? Math.pow((gl + 0.055) / 1.055, 2.4) : gl / 12.92;
  bl = bl > 0.04045 ? Math.pow((bl + 0.055) / 1.055, 2.4) : bl / 12.92;
  // linear RGB -> XYZ (D65)
  let x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  let y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750);
  let z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  x = f(x); y = f(y); z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

// --- Color histogram ---

function extractColorHistogram(data: Uint8ClampedArray, totalPixels: number): ColorHistogram {
  const hue = new Float64Array(24);
  const saturation = new Float64Array(8);
  const lightness = new Float64Array(8);
  // Finer quantization for dominant colors
  const colorCounts = new Map<string, { count: number; h: number; s: number; l: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);

    // Hue: only count chromatic pixels
    if (s > 0.08 && l > 0.05 && l < 0.95) {
      hue[Math.min(23, Math.floor(h / 15))]++;
    }
    saturation[Math.min(7, Math.floor(s * 8))]++;
    lightness[Math.min(7, Math.floor(l * 8))]++;

    // Dominant colors - finer quantization
    const qh = Math.round(h / 10) * 10;
    const qs = Math.round(s * 20) / 20;
    const ql = Math.round(l * 20) / 20;
    const key = `${qh}-${qs}-${ql}`;
    const existing = colorCounts.get(key);
    if (existing) existing.count++;
    else colorCounts.set(key, { count: 1, h: qh, s: qs, l: ql });
  }

  // Normalize
  for (let i = 0; i < 24; i++) hue[i] /= totalPixels;
  for (let i = 0; i < 8; i++) saturation[i] /= totalPixels;
  for (let i = 0; i < 8; i++) lightness[i] /= totalPixels;

  // Top 8 dominant colors with weights
  const sorted = [...colorCounts.values()].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, 8);
  const dominantColors: [number, number, number][] = top.map(c => [c.h, c.s, c.l]);
  const dominantWeights = top.map(c => c.count / totalPixels);

  return {
    hue: Array.from(hue),
    saturation: Array.from(saturation),
    lightness: Array.from(lightness),
    dominantColors,
    dominantWeights,
  };
}

// --- Color moments in Lab space ---

function extractColorMoments(data: Uint8ClampedArray, totalPixels: number): ColorMoments {
  const labL = new Float64Array(totalPixels);
  const labA = new Float64Array(totalPixels);
  const labB = new Float64Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const [l, a, b] = rgbToLab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    labL[i] = l; labA[i] = a; labB[i] = b;
  }

  const computeMoments = (arr: Float64Array): [number, number, number] => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    const mean = sum / arr.length;

    let variance = 0, cube = 0;
    for (let i = 0; i < arr.length; i++) {
      const diff = arr[i] - mean;
      variance += diff * diff;
      cube += diff * diff * diff;
    }
    const stddev = Math.sqrt(variance / arr.length);
    const skewness = stddev > 0 ? Math.cbrt(cube / arr.length) / stddev : 0;
    return [mean, stddev, skewness];
  };

  const [mL, sL, kL] = computeMoments(labL);
  const [mA, sA, kA] = computeMoments(labA);
  const [mB, sB, kB] = computeMoments(labB);

  return {
    mean: [mL, mA, mB],
    stddev: [sL, sA, sB],
    skewness: [kL, kA, kB],
  };
}

// --- Texture features ---

function extractTextureFeatures(data: Uint8ClampedArray, width: number, height: number): TextureFeatures {
  const totalPixels = width * height;
  const gray = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    gray[i] = (data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114) / 255;
  }

  // --- Sobel with 16-direction histogram ---
  let edgeSum = 0;
  const directionality = new Float64Array(16);
  let totalGradient = 0;
  const gradMag = new Float32Array(totalPixels);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -gray[idx - width - 1] + gray[idx - width + 1]
        - 2 * gray[idx - 1] + 2 * gray[idx + 1]
        - gray[idx + width - 1] + gray[idx + width + 1];
      const gy =
        -gray[idx - width - 1] - 2 * gray[idx - width] - gray[idx - width + 1]
        + gray[idx + width - 1] + 2 * gray[idx + width] + gray[idx + width + 1];

      const mag = Math.sqrt(gx * gx + gy * gy);
      gradMag[idx] = mag;
      edgeSum += mag;

      if (mag > 0.03) {
        let angle = Math.atan2(gy, gx);
        if (angle < 0) angle += Math.PI * 2;
        const bin = Math.min(15, Math.floor(angle / (Math.PI * 2) * 16));
        directionality[bin] += mag;
        totalGradient += mag;
      }
    }
  }

  const edgePixels = (width - 2) * (height - 2);
  const edgeDensity = Math.min(1, edgeSum / edgePixels / 0.7);

  if (totalGradient > 0) {
    for (let i = 0; i < 16; i++) directionality[i] /= totalGradient;
  }

  // --- Multi-scale coarseness ---
  let coarseness = 0;
  const scales = [2, 4, 8, 16];
  for (const scale of scales) {
    let variance = 0, count = 0;
    for (let y = 0; y < height - scale; y += scale) {
      for (let x = 0; x < width - scale; x += scale) {
        let mean = 0, n = 0;
        for (let dy = 0; dy < scale && y + dy < height; dy++) {
          for (let dx = 0; dx < scale && x + dx < width; dx++) {
            mean += gray[(y + dy) * width + (x + dx)];
            n++;
          }
        }
        mean /= n;
        let v = 0;
        for (let dy = 0; dy < scale && y + dy < height; dy++) {
          for (let dx = 0; dx < scale && x + dx < width; dx++) {
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
  coarseness = Math.min(1, coarseness / scales.length * 4);

  // --- Contrast ---
  let mean = 0;
  for (let i = 0; i < totalPixels; i++) mean += gray[i];
  mean /= totalPixels;
  let variance = 0;
  for (let i = 0; i < totalPixels; i++) {
    const d = gray[i] - mean;
    variance += d * d;
  }
  const contrast = Math.min(1, Math.sqrt(variance / totalPixels) * 3);

  // --- Regularity via autocorrelation ---
  let regularity = 0;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 48));
  const offsets = [4, 8, 12, 16, 24];
  for (const offset of offsets) {
    let corrH = 0, corrV = 0, nH = 0, nV = 0;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width - offset; x += step) {
        corrH += gray[y * width + x] * gray[y * width + x + offset];
        nH++;
      }
    }
    for (let y = 0; y < height - offset; y += step) {
      for (let x = 0; x < width; x += step) {
        corrV += gray[y * width + x] * gray[(y + offset) * width + x];
        nV++;
      }
    }
    const avgCorr = ((nH > 0 ? corrH / nH : 0) + (nV > 0 ? corrV / nV : 0)) / 2;
    regularity += avgCorr;
  }
  regularity = Math.min(1, regularity / offsets.length);

  // --- LBP (Local Binary Pattern) histogram ---
  const lbpHistogram = new Float64Array(10); // 10 uniform bins
  let lbpCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = gray[y * width + x];
      let pattern = 0;
      // 8 neighbors clockwise
      const neighbors = [
        gray[(y - 1) * width + x - 1], gray[(y - 1) * width + x], gray[(y - 1) * width + x + 1],
        gray[y * width + x + 1], gray[(y + 1) * width + x + 1], gray[(y + 1) * width + x],
        gray[(y + 1) * width + x - 1], gray[y * width + x - 1],
      ];
      for (let k = 0; k < 8; k++) {
        if (neighbors[k] >= center) pattern |= (1 << k);
      }
      // Count transitions for uniform pattern
      let transitions = 0;
      for (let k = 0; k < 8; k++) {
        const bit1 = (pattern >> k) & 1;
        const bit2 = (pattern >> ((k + 1) % 8)) & 1;
        if (bit1 !== bit2) transitions++;
      }
      // Map to bin: uniform patterns (transitions <= 2) get own bins
      const bin = transitions <= 2 ? Math.min(9, Math.floor(pattern / 28)) : 9;
      lbpHistogram[bin]++;
      lbpCount++;
    }
  }
  if (lbpCount > 0) {
    for (let i = 0; i < 10; i++) lbpHistogram[i] /= lbpCount;
  }

  // --- GLCM (Gray-Level Co-occurrence Matrix) features ---
  const levels = 16; // Quantize to 16 gray levels
  const glcm = new Float64Array(levels * levels);
  let glcmTotal = 0;
  const dist = 1; // Distance
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - dist; x++) {
      const i = Math.min(levels - 1, Math.floor(gray[y * width + x] * levels));
      const j = Math.min(levels - 1, Math.floor(gray[y * width + x + dist] * levels));
      glcm[i * levels + j]++;
      glcm[j * levels + i]++; // Symmetric
      glcmTotal += 2;
    }
  }
  // Normalize
  if (glcmTotal > 0) {
    for (let i = 0; i < levels * levels; i++) glcm[i] /= glcmTotal;
  }

  // GLCM features
  let glcmEnergy = 0, glcmHomogeneity = 0, glcmEntropy = 0;
  let muI = 0, muJ = 0, sigI = 0, sigJ = 0, glcmCorrelation = 0;
  // Means
  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      const p = glcm[i * levels + j];
      muI += i * p;
      muJ += j * p;
    }
  }
  // Stddevs
  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      const p = glcm[i * levels + j];
      sigI += (i - muI) * (i - muI) * p;
      sigJ += (j - muJ) * (j - muJ) * p;
    }
  }
  sigI = Math.sqrt(sigI);
  sigJ = Math.sqrt(sigJ);
  // Features
  for (let i = 0; i < levels; i++) {
    for (let j = 0; j < levels; j++) {
      const p = glcm[i * levels + j];
      if (p > 0) {
        glcmEnergy += p * p;
        glcmHomogeneity += p / (1 + Math.abs(i - j));
        glcmEntropy -= p * Math.log2(p);
        if (sigI > 0 && sigJ > 0) {
          glcmCorrelation += (i - muI) * (j - muJ) * p / (sigI * sigJ);
        }
      }
    }
  }

  return {
    edgeDensity,
    directionality: Array.from(directionality),
    coarseness,
    contrast,
    regularity,
    lbpHistogram: Array.from(lbpHistogram),
    glcmEnergy: Math.min(1, glcmEnergy),
    glcmCorrelation: Math.min(1, Math.max(0, (glcmCorrelation + 1) / 2)),
    glcmHomogeneity: Math.min(1, glcmHomogeneity),
    glcmEntropy: Math.min(1, glcmEntropy / 4),
  };
}

// --- Main extraction ---

export function extractFeatures(imageData: ImageData): ImageFeatures {
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  const colorHistogram = extractColorHistogram(data, totalPixels);
  const colorMoments = extractColorMoments(data, totalPixels);
  const textureFeatures = extractTextureFeatures(data, width, height);

  let rSum = 0, gSum = 0, bSum = 0;
  for (let i = 0; i < data.length; i += 4) {
    rSum += data[i]; gSum += data[i + 1]; bSum += data[i + 2];
  }

  return {
    colorHistogram,
    colorMoments,
    textureFeatures,
    avgColor: [Math.round(rSum / totalPixels), Math.round(gSum / totalPixels), Math.round(bSum / totalPixels)],
  };
}

export function loadImageAsImageData(
  src: string,
  maxSize = 384
): Promise<{ imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
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

export function createThumbnail(src: string, maxSize = 300): Promise<string> {
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
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = src;
  });
}

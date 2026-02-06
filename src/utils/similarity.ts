import type { ImageFeatures, SearchResult, MaterialImage, SearchWeights } from '../types';

// Bhattacharyya coefficient for histogram comparison (0-1, higher = more similar)
function bhattacharyya(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.sqrt(a[i] * b[i]);
  }
  return sum;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const mag = Math.sqrt(magA) * Math.sqrt(magB);
  return mag === 0 ? 0 : dot / mag;
}

// Earth Mover's approximation for dominant color matching
function dominantColorDistance(
  colorsA: [number, number, number][],
  weightsA: number[],
  colorsB: [number, number, number][],
  weightsB: number[],
): number {
  if (colorsA.length === 0 || colorsB.length === 0) return 1;

  let totalDist = 0;
  let totalWeight = 0;

  for (let i = 0; i < colorsA.length; i++) {
    let minDist = Infinity;
    for (let j = 0; j < colorsB.length; j++) {
      // Perceptual distance in HSL
      let hueDiff = Math.abs(colorsA[i][0] - colorsB[j][0]);
      if (hueDiff > 180) hueDiff = 360 - hueDiff;
      const hueNorm = hueDiff / 180;
      const satDiff = Math.abs(colorsA[i][1] - colorsB[j][1]);
      const lightDiff = Math.abs(colorsA[i][2] - colorsB[j][2]);
      const dist = Math.sqrt(hueNorm * hueNorm * 0.5 + satDiff * satDiff * 0.3 + lightDiff * lightDiff * 0.2);
      if (dist < minDist) minDist = dist;
    }
    const w = weightsA[i] || 0.01;
    totalDist += minDist * w;
    totalWeight += w;
  }

  // Also match B -> A for symmetry
  for (let j = 0; j < colorsB.length; j++) {
    let minDist = Infinity;
    for (let i = 0; i < colorsA.length; i++) {
      let hueDiff = Math.abs(colorsA[i][0] - colorsB[j][0]);
      if (hueDiff > 180) hueDiff = 360 - hueDiff;
      const hueNorm = hueDiff / 180;
      const satDiff = Math.abs(colorsA[i][1] - colorsB[j][1]);
      const lightDiff = Math.abs(colorsA[i][2] - colorsB[j][2]);
      const dist = Math.sqrt(hueNorm * hueNorm * 0.5 + satDiff * satDiff * 0.3 + lightDiff * lightDiff * 0.2);
      if (dist < minDist) minDist = dist;
    }
    const w = weightsB[j] || 0.01;
    totalDist += minDist * w;
    totalWeight += w;
  }

  return totalWeight > 0 ? totalDist / totalWeight : 1;
}

function colorSimilarity(a: ImageFeatures, b: ImageFeatures): number {
  // 1. Hue histogram (Bhattacharyya) - most important for wood color
  const hueScore = bhattacharyya(a.colorHistogram.hue, b.colorHistogram.hue);

  // 2. Saturation histogram
  const satScore = bhattacharyya(a.colorHistogram.saturation, b.colorHistogram.saturation);

  // 3. Lightness histogram
  const lightScore = bhattacharyya(a.colorHistogram.lightness, b.colorHistogram.lightness);

  // 4. Dominant color EMD matching
  const domDist = dominantColorDistance(
    a.colorHistogram.dominantColors, a.colorHistogram.dominantWeights,
    b.colorHistogram.dominantColors, b.colorHistogram.dominantWeights,
  );
  const domScore = Math.max(0, 1 - domDist * 2);

  // 5. Lab color moments distance (perceptually uniform)
  const labDist = Math.sqrt(
    Math.pow((a.colorMoments.mean[0] - b.colorMoments.mean[0]) / 100, 2) +
    Math.pow((a.colorMoments.mean[1] - b.colorMoments.mean[1]) / 128, 2) +
    Math.pow((a.colorMoments.mean[2] - b.colorMoments.mean[2]) / 128, 2)
  );
  const labMeanScore = Math.max(0, 1 - labDist * 2);

  // 6. Lab stddev similarity (color variance distribution)
  const stdDist = Math.sqrt(
    Math.pow((a.colorMoments.stddev[0] - b.colorMoments.stddev[0]) / 50, 2) +
    Math.pow((a.colorMoments.stddev[1] - b.colorMoments.stddev[1]) / 50, 2) +
    Math.pow((a.colorMoments.stddev[2] - b.colorMoments.stddev[2]) / 50, 2)
  );
  const labStdScore = Math.max(0, 1 - stdDist * 2);

  return (
    hueScore * 0.20 +
    satScore * 0.10 +
    lightScore * 0.10 +
    domScore * 0.25 +
    labMeanScore * 0.20 +
    labStdScore * 0.15
  );
}

function textureSimilarity(a: ImageFeatures, b: ImageFeatures): number {
  const ta = a.textureFeatures;
  const tb = b.textureFeatures;

  // 1. LBP histogram (Bhattacharyya) - best for texture micro-patterns
  const lbpScore = bhattacharyya(ta.lbpHistogram, tb.lbpHistogram);

  // 2. Direction similarity (cosine) - grain direction matters for wood
  const dirScore = cosineSimilarity(ta.directionality, tb.directionality);

  // 3. GLCM features similarity
  const glcmEnergyDiff = 1 - Math.abs(ta.glcmEnergy - tb.glcmEnergy);
  const glcmCorrDiff = 1 - Math.abs(ta.glcmCorrelation - tb.glcmCorrelation);
  const glcmHomoDiff = 1 - Math.abs(ta.glcmHomogeneity - tb.glcmHomogeneity);
  const glcmEntropyDiff = 1 - Math.abs(ta.glcmEntropy - tb.glcmEntropy);
  const glcmScore = (glcmEnergyDiff + glcmCorrDiff + glcmHomoDiff + glcmEntropyDiff) / 4;

  // 4. Edge density similarity
  const edgeScore = 1 - Math.abs(ta.edgeDensity - tb.edgeDensity);

  // 5. Coarseness similarity - fine vs coarse grain
  const coarseScore = 1 - Math.abs(ta.coarseness - tb.coarseness);

  // 6. Contrast similarity
  const contrastScore = 1 - Math.abs(ta.contrast - tb.contrast);

  // 7. Regularity similarity
  const regScore = 1 - Math.abs(ta.regularity - tb.regularity);

  return (
    lbpScore * 0.25 +
    dirScore * 0.20 +
    glcmScore * 0.20 +
    edgeScore * 0.10 +
    coarseScore * 0.10 +
    contrastScore * 0.08 +
    regScore * 0.07
  );
}

export function computeSimilarity(
  query: ImageFeatures,
  target: ImageFeatures,
  weights: SearchWeights = { color: 0.5, texture: 0.5 }
): { score: number; colorScore: number; textureScore: number } {
  const colorScore = colorSimilarity(query, target);
  const textureScore = textureSimilarity(query, target);
  const totalWeight = weights.color + weights.texture;
  const score = totalWeight > 0
    ? (colorScore * weights.color + textureScore * weights.texture) / totalWeight
    : 0;
  return { score, colorScore, textureScore };
}

export function searchImages(
  queryFeatures: ImageFeatures,
  library: MaterialImage[],
  weights: SearchWeights = { color: 0.5, texture: 0.5 },
  limit = 12
): SearchResult[] {
  const results: SearchResult[] = library.map((image) => {
    const { score, colorScore, textureScore } = computeSimilarity(
      queryFeatures,
      image.features,
      weights
    );
    return { image, score, colorScore, textureScore };
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

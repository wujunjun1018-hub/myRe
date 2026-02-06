import type { ImageFeatures, SearchResult, MaterialImage, SearchWeights } from '../types';

function histogramIntersection(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.min(a[i], b[i]);
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

function colorDistance(
  c1: [number, number, number],
  c2: [number, number, number]
): number {
  // Weighted distance in HSL space
  let hueDiff = Math.abs(c1[0] - c2[0]);
  if (hueDiff > 180) hueDiff = 360 - hueDiff;
  const hueNorm = hueDiff / 180;
  const satDiff = Math.abs(c1[1] - c2[1]);
  const lightDiff = Math.abs(c1[2] - c2[2]);
  return Math.sqrt(hueNorm * hueNorm * 0.5 + satDiff * satDiff * 0.3 + lightDiff * lightDiff * 0.2);
}

function colorSimilarity(a: ImageFeatures, b: ImageFeatures): number {
  // 1. Hue histogram intersection
  const hueScore = histogramIntersection(a.colorHistogram.hue, b.colorHistogram.hue);

  // 2. Saturation histogram intersection
  const satScore = histogramIntersection(a.colorHistogram.saturation, b.colorHistogram.saturation);

  // 3. Lightness histogram intersection
  const lightScore = histogramIntersection(a.colorHistogram.lightness, b.colorHistogram.lightness);

  // 4. Dominant color matching
  let dominantScore = 0;
  const aDom = a.colorHistogram.dominantColors;
  const bDom = b.colorHistogram.dominantColors;
  if (aDom.length > 0 && bDom.length > 0) {
    let totalDist = 0;
    const n = Math.min(aDom.length, bDom.length);
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      for (let j = 0; j < bDom.length; j++) {
        const dist = colorDistance(aDom[i], bDom[j]);
        if (dist < minDist) minDist = dist;
      }
      totalDist += minDist;
    }
    dominantScore = Math.max(0, 1 - totalDist / n);
  }

  // 5. Average color distance
  const avgDist = Math.sqrt(
    Math.pow(a.avgColor[0] - b.avgColor[0], 2) +
    Math.pow(a.avgColor[1] - b.avgColor[1], 2) +
    Math.pow(a.avgColor[2] - b.avgColor[2], 2)
  ) / 441.67; // max possible distance
  const avgScore = 1 - avgDist;

  return hueScore * 0.25 + satScore * 0.15 + lightScore * 0.15 + dominantScore * 0.3 + avgScore * 0.15;
}

function textureSimilarity(a: ImageFeatures, b: ImageFeatures): number {
  const ta = a.textureFeatures;
  const tb = b.textureFeatures;

  // 1. Edge density similarity
  const edgeScore = 1 - Math.abs(ta.edgeDensity - tb.edgeDensity);

  // 2. Direction similarity (cosine)
  const dirScore = cosineSimilarity(ta.directionality, tb.directionality);

  // 3. Coarseness similarity
  const coarseScore = 1 - Math.abs(ta.coarseness - tb.coarseness);

  // 4. Contrast similarity
  const contrastScore = 1 - Math.abs(ta.contrast - tb.contrast);

  // 5. Regularity similarity
  const regScore = 1 - Math.abs(ta.regularity - tb.regularity);

  return edgeScore * 0.2 + dirScore * 0.3 + coarseScore * 0.2 + contrastScore * 0.15 + regScore * 0.15;
}

export function computeSimilarity(
  query: ImageFeatures,
  target: ImageFeatures,
  weights: SearchWeights = { color: 0.5, texture: 0.5 }
): { score: number; colorScore: number; textureScore: number } {
  const colorScore = colorSimilarity(query, target);
  const textureScore = textureSimilarity(query, target);
  const totalWeight = weights.color + weights.texture;
  const score = (colorScore * weights.color + textureScore * weights.texture) / totalWeight;
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

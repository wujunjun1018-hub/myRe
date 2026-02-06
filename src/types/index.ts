export interface ColorHistogram {
  /** Hue bins (24 bins, 15deg each) */
  hue: number[];
  /** Saturation bins (8 bins) */
  saturation: number[];
  /** Lightness bins (8 bins) */
  lightness: number[];
  /** Dominant colors as [h, s, l] arrays (top 8) */
  dominantColors: [number, number, number][];
  /** Dominant color weights (proportion of image) */
  dominantWeights: number[];
}

export interface ColorMoments {
  /** Per-channel mean [L, a, b] in Lab space */
  mean: [number, number, number];
  /** Per-channel stddev */
  stddev: [number, number, number];
  /** Per-channel skewness */
  skewness: [number, number, number];
}

export interface TextureFeatures {
  /** Edge density (0-1) */
  edgeDensity: number;
  /** Directional histogram (16 directions) */
  directionality: number[];
  /** Coarseness at multiple scales */
  coarseness: number;
  /** Contrast score (0-1) */
  contrast: number;
  /** Regularity/pattern repetition score (0-1) */
  regularity: number;
  /** LBP (Local Binary Pattern) histogram (uniform patterns, 10 bins) */
  lbpHistogram: number[];
  /** GLCM features: energy, correlation, homogeneity, entropy */
  glcmEnergy: number;
  glcmCorrelation: number;
  glcmHomogeneity: number;
  glcmEntropy: number;
}

export interface ImageFeatures {
  colorHistogram: ColorHistogram;
  colorMoments: ColorMoments;
  textureFeatures: TextureFeatures;
  /** Average color as [r, g, b] */
  avgColor: [number, number, number];
}

export interface MaterialImage {
  id: string;
  name: string;
  tags: string[];
  /** Base64 thumbnail (small preview) */
  thumbnail: string;
  /** Full image blob key in IndexedDB */
  blobKey: string;
  /** Extracted image features for matching */
  features: ImageFeatures;
  /** Upload timestamp */
  createdAt: number;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** File size in bytes */
  fileSize: number;
}

export interface SearchResult {
  image: MaterialImage;
  /** Overall similarity score 0-1 */
  score: number;
  /** Color similarity score 0-1 */
  colorScore: number;
  /** Texture similarity score 0-1 */
  textureScore: number;
}

export type ViewMode = 'library' | 'search';

export interface SearchWeights {
  color: number;
  texture: number;
}

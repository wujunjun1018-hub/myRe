export interface ColorHistogram {
  /** HSL hue bins (12 bins, 30° each) */
  hue: number[];
  /** Saturation bins (5 bins) */
  saturation: number[];
  /** Lightness bins (5 bins) */
  lightness: number[];
  /** Dominant colors as [h, s, l] arrays */
  dominantColors: [number, number, number][];
}

export interface TextureFeatures {
  /** Edge density (0-1) */
  edgeDensity: number;
  /** Directional histogram (8 directions) */
  directionality: number[];
  /** Coarseness/fineness score (0-1) */
  coarseness: number;
  /** Contrast score (0-1) */
  contrast: number;
  /** Regularity/pattern repetition score (0-1) */
  regularity: number;
}

export interface ImageFeatures {
  colorHistogram: ColorHistogram;
  textureFeatures: TextureFeatures;
  /** Average color as [r, g, b] */
  avgColor: [number, number, number];
}

export interface MaterialImage {
  id: string;
  name: string;
  /** Category: wood type, pattern type, etc. */
  category: string;
  /** Tags for filtering */
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

export const CATEGORIES = [
  '全部',
  '橡木',
  '胡桃木',
  '松木',
  '樱桃木',
  '枫木',
  '柚木',
  '榉木',
  '其他',
] as const;

export type Category = (typeof CATEGORIES)[number];

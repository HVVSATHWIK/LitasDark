export interface PDFDocument {
  getPageCount(): number;
  getTitle(): string | null;
  getAuthor(): string | null;
  getSubject(): string | null;
  getKeywords(): string[];
  getCreator(): string | null;
  getProducer(): string | null;
  getCreationDate(): Date | null;
  getModificationDate(): Date | null;
  save(options?: SaveOptions): Promise<Uint8Array>;
  getPage(index: number): PDFPage;
}

export interface PDFPage {
  getSize(): { width: number; height: number };
  setRotation(angle: number): void;
  drawText(text: string, options: TextOptions): void;
  drawImage(image: any, options: ImageOptions): void;
}

export interface SaveOptions {
  useObjectStreams?: boolean;
  compress?: boolean;
  optimizeForSize?: boolean;
  addDefaultPage?: boolean;
}

export interface TextOptions {
  x: number;
  y: number;
  size: number;
  color: any;
  opacity?: number;
  rotate?: any;
}

export interface ImageOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ThemeSettings {
  theme: 'dark' | 'darker' | 'darkest' | 'sepia' | 'blue-light' | 'custom';
  brightness: number;
  contrast: number;
  scale: number;
  customColors?: {
    background: string;
    text: string;
    accent: string;
  };
}

export interface ConversionProgress {
  current: number;
  total: number;
  message: string;
  percentage: number;
  estimatedTimeRemaining?: number;
}

export interface OCRResult {
  pageNumber: number;
  success: boolean;
  text?: string;
  confidence?: number;
  words?: OCRWord[];
  lines?: OCRLine[];
  error?: string;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface BatchProcessingItem {
  id: string;
  file: File;
  settings: BatchSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: Uint8Array;
  error?: string;
}

export interface BatchSettings {
  convertToDarkMode: boolean;
  themeSettings: ThemeSettings;
  addWatermark: boolean;
  watermarkText: string;
  watermarkOptions: WatermarkOptions;
  removeMetadata: boolean;
  compress: boolean;
  compressionOptions: CompressionOptions;
}

export interface WatermarkOptions {
  opacity: number;
  rotation: number;
  fontSize: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color: [number, number, number];
}

export interface CompressionOptions {
  useObjectStreams: boolean;
  compress: boolean;
  optimizeForSize: boolean;
}

export interface AppState {
  currentDocument: PDFDocument | null;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark' | 'auto';
  userPreferences: UserPreferences;
  recentFiles: RecentFile[];
}

export interface UserPreferences {
  defaultTheme: ThemeSettings;
  autoSave: boolean;
  showTutorial: boolean;
  language: string;
  accessibility: AccessibilitySettings;
}

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
}

export interface RecentFile {
  id: string;
  name: string;
  size: number;
  lastModified: Date;
  thumbnail?: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userAction?: string;
}

export type EventCallback<T = any> = (data: T) => void;
export type ProgressCallback = (progress: ConversionProgress) => void;
export type ErrorCallback = (error: ErrorInfo) => void;
import { PDFDocument, ThemeSettings, ConversionProgress } from '../types/index.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { PerformanceMonitor } from '../utils/performanceMonitor.js';

export class EnhancedPDFRenderer {
  private renderCache: Map<string, HTMLCanvasElement> = new Map();
  private maxCacheSize: number = 20;
  private workerPool: Worker[] = [];
  private maxWorkers: number = navigator.hardwareConcurrency || 4;

  constructor() {
    this.initializeWorkerPool();
  }

  private initializeWorkerPool(): void {
    // Initialize web workers for parallel processing
    for (let i = 0; i < Math.min(this.maxWorkers, 2); i++) {
      try {
        const worker = new Worker(new URL('../workers/renderWorker.js', import.meta.url));
        this.workerPool.push(worker);
      } catch (error) {
        console.warn('Web Workers not available, falling back to main thread');
        break;
      }
    }
  }

  public async renderPage(
    pdfDoc: PDFDocument,
    pageNumber: number,
    settings: ThemeSettings = { theme: 'dark', brightness: 100, contrast: 100, scale: 1.5 }
  ): Promise<HTMLCanvasElement> {
    const cacheKey = this.getCacheKey(pdfDoc, pageNumber, settings);
    
    if (this.renderCache.has(cacheKey)) {
      return this.renderCache.get(cacheKey)!;
    }

    return ErrorHandler.withErrorHandling(async () => {
      const endTiming = PerformanceMonitor.startTiming('pdf_render');
      
      try {
        const canvas = await this.renderPageInternal(pdfDoc, pageNumber, settings);
        this.cacheCanvas(cacheKey, canvas);
        
        const duration = endTiming();
        console.log(`Page ${pageNumber} rendered in ${duration.toFixed(2)}ms`);
        
        return canvas;
      } catch (error) {
        endTiming();
        throw error;
      }
    }, `rendering page ${pageNumber}`);
  }

  private async renderPageInternal(
    pdfDoc: PDFDocument,
    pageNumber: number,
    settings: ThemeSettings
  ): Promise<HTMLCanvasElement> {
    const pdfBytes = await pdfDoc.save();
    const pdfDocument = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const page = await pdfDocument.getPage(pageNumber);
    
    const scale = this.calculateOptimalScale(settings.scale);
    const viewport = page.getViewport({ scale });
    
    // Use OffscreenCanvas if available for better performance
    const canvas = this.createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d')!;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    this.applyAdvancedThemeFilters(context, canvas.width, canvas.height, settings);
    
    return canvas;
  }

  private createCanvas(width: number, height: number): HTMLCanvasElement {
    if ('OffscreenCanvas' in window && this.workerPool.length > 0) {
      // Use OffscreenCanvas for better performance when workers are available
      const offscreen = new OffscreenCanvas(width, height);
      // Convert to regular canvas for DOM usage
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  private calculateOptimalScale(requestedScale: number): number {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const memoryUsage = PerformanceMonitor.getMemoryUsage();
    
    let scale = requestedScale * devicePixelRatio;
    
    // Reduce scale if memory usage is high
    if (memoryUsage && memoryUsage.percentage > 70) {
      scale *= 0.8;
    }
    
    // Ensure minimum quality
    return Math.max(scale, 1.0);
  }

  private applyAdvancedThemeFilters(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    settings: ThemeSettings
  ): void {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    switch (settings.theme) {
      case 'dark':
        this.applyDarkModeFilter(data);
        break;
      case 'darker':
        this.applyDarkerModeFilter(data);
        break;
      case 'darkest':
        this.applyDarkestModeFilter(data);
        break;
      case 'sepia':
        this.applySepiaFilter(data);
        break;
      case 'blue-light':
        this.applyBlueLightFilter(data);
        break;
      case 'custom':
        this.applyCustomFilter(data, settings.customColors);
        break;
    }

    this.applyBrightnessContrast(data, settings.brightness, settings.contrast);
    context.putImageData(imageData, 0, 0);
  }

  private applyDarkModeFilter(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
      // Invert colors but preserve some color information
      data[i] = 255 - data[i];     // Red
      data[i + 1] = 255 - data[i + 1]; // Green
      data[i + 2] = 255 - data[i + 2]; // Blue
      // Alpha remains unchanged
    }
  }

  private applyDarkerModeFilter(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
      // More aggressive inversion with reduced brightness
      data[i] = Math.max(0, 255 - data[i] - 30);
      data[i + 1] = Math.max(0, 255 - data[i + 1] - 30);
      data[i + 2] = Math.max(0, 255 - data[i + 2] - 30);
    }
  }

  private applyDarkestModeFilter(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
      // Maximum inversion with significant brightness reduction
      data[i] = Math.max(0, 255 - data[i] - 60);
      data[i + 1] = Math.max(0, 255 - data[i + 1] - 60);
      data[i + 2] = Math.max(0, 255 - data[i + 2] - 60);
    }
  }

  private applySepiaFilter(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    }
  }

  private applyBlueLightFilter(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
      // Reduce blue light by decreasing blue channel
      data[i + 2] = Math.max(0, data[i + 2] * 0.7);
      // Slightly warm the image
      data[i] = Math.min(255, data[i] * 1.1);
      data[i + 1] = Math.min(255, data[i + 1] * 1.05);
    }
  }

  private applyCustomFilter(data: Uint8ClampedArray, customColors?: any): void {
    if (!customColors) return;

    // Apply custom color transformation based on user preferences
    const { background, text, accent } = customColors;
    
    // This is a simplified implementation
    // In practice, you'd implement more sophisticated color mapping
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      if (brightness > 128) {
        // Light areas become text color
        data[i] = parseInt(text.slice(1, 3), 16);
        data[i + 1] = parseInt(text.slice(3, 5), 16);
        data[i + 2] = parseInt(text.slice(5, 7), 16);
      } else {
        // Dark areas become background color
        data[i] = parseInt(background.slice(1, 3), 16);
        data[i + 1] = parseInt(background.slice(3, 5), 16);
        data[i + 2] = parseInt(background.slice(5, 7), 16);
      }
    }
  }

  private applyBrightnessContrast(data: Uint8ClampedArray, brightness: number, contrast: number): void {
    const brightnessFactor = brightness / 100;
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      // Apply brightness
      data[i] = Math.min(255, Math.max(0, data[i] * brightnessFactor));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessFactor));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessFactor));

      // Apply contrast
      data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128));
    }
  }

  public async generateThumbnails(
    pdfDoc: PDFDocument,
    progressCallback?: (progress: ConversionProgress) => void
  ): Promise<HTMLCanvasElement[]> {
    const numPages = pdfDoc.getPageCount();
    const thumbnails: HTMLCanvasElement[] = [];
    const batchSize = 3;

    for (let i = 0; i < numPages; i += batchSize) {
      const batch: Promise<HTMLCanvasElement>[] = [];
      const endIndex = Math.min(i + batchSize, numPages);
      
      for (let j = i; j < endIndex; j++) {
        batch.push(this.renderPage(pdfDoc, j + 1, { 
          theme: 'dark', 
          brightness: 100, 
          contrast: 100, 
          scale: 0.3 
        }));
      }
      
      const batchResults = await Promise.allSettled(batch);
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          thumbnails[i + index] = result.value;
        } else {
          console.error(`Failed to generate thumbnail for page ${i + index + 1}:`, result.reason);
          thumbnails[i + index] = this.createErrorThumbnail();
        }
      });

      if (progressCallback) {
        progressCallback({
          current: Math.min(i + batchSize, numPages),
          total: numPages,
          message: `Generated ${Math.min(i + batchSize, numPages)} of ${numPages} thumbnails`,
          percentage: (Math.min(i + batchSize, numPages) / numPages) * 100
        });
      }
    }

    return thumbnails;
  }

  private createErrorThumbnail(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 200;
    const context = canvas.getContext('2d')!;
    
    // Create a gradient background
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ee5a52');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add error icon
    context.fillStyle = '#fff';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.fillText('⚠️', canvas.width / 2, canvas.height / 2 - 10);
    context.font = '12px Arial';
    context.fillText('Error', canvas.width / 2, canvas.height / 2 + 10);
    
    return canvas;
  }

  private getCacheKey(pdfDoc: PDFDocument, pageNumber: number, settings: ThemeSettings): string {
    const settingsHash = JSON.stringify(settings);
    return `${pdfDoc.getTitle() || 'untitled'}_${pageNumber}_${btoa(settingsHash)}`;
  }

  private cacheCanvas(key: string, canvas: HTMLCanvasElement): void {
    if (this.renderCache.size >= this.maxCacheSize) {
      const firstKey = this.renderCache.keys().next().value;
      this.renderCache.delete(firstKey);
    }
    
    // Clone canvas for caching
    const clonedCanvas = document.createElement('canvas');
    clonedCanvas.width = canvas.width;
    clonedCanvas.height = canvas.height;
    const clonedContext = clonedCanvas.getContext('2d')!;
    clonedContext.drawImage(canvas, 0, 0);
    
    this.renderCache.set(key, clonedCanvas);
  }

  public clearCache(): void {
    this.renderCache.clear();
  }

  public getCacheStats(): { size: number; maxSize: number; hitRate: number } {
    // This would require tracking cache hits/misses
    return {
      size: this.renderCache.size,
      maxSize: this.maxCacheSize,
      hitRate: 0 // Placeholder
    };
  }

  public cleanup(): void {
    this.clearCache();
    this.workerPool.forEach(worker => worker.terminate());
    this.workerPool = [];
  }
}
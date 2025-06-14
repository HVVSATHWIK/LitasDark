/**
 * PDF Rendering and Preview Generation
 */
export class PDFRenderer {
  constructor() {
    this.renderCache = new Map();
    this.maxCacheSize = 10;
  }

  /**
   * Render a specific page with theme settings
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {number} pageNumber - Page number (1-based)
   * @param {Object} settings - Rendering settings
   * @returns {Promise<HTMLCanvasElement>}
   */
  async renderPage(pdfDoc, pageNumber, settings = {}) {
    const cacheKey = this.getCacheKey(pdfDoc, pageNumber, settings);
    
    if (this.renderCache.has(cacheKey)) {
      return this.renderCache.get(cacheKey);
    }

    try {
      // Check if required libraries are available
      if (!window.pdfjsLib) {
        throw new Error('PDF.js library not loaded. Please refresh the page.');
      }

      const pdfBytes = await pdfDoc.save();
      const pdfDocument = await window.pdfjsLib.getDocument({ data: pdfBytes }).promise;
      const page = await pdfDocument.getPage(pageNumber);
      
      const scale = settings.scale || 2.0;
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      this.applyThemeFilters(context, canvas.width, canvas.height, settings);
      this.cacheCanvas(cacheKey, canvas);
      
      return canvas;
    } catch (error) {
      throw new Error(`Failed to render page ${pageNumber}: ${error.message}`);
    }
  }

  /**
   * Generate thumbnails for all pages
   * @param {PDFDocument} pdfDoc - PDF document
   * @returns {Promise<HTMLCanvasElement[]>}
   */
  async generateThumbnails(pdfDoc) {
    const numPages = pdfDoc.getPageCount();
    const thumbnails = [];
    const batchSize = 3; // Process in batches to avoid memory issues

    for (let i = 0; i < numPages; i += batchSize) {
      const batch = [];
      const endIndex = Math.min(i + batchSize, numPages);
      
      for (let j = i; j < endIndex; j++) {
        batch.push(this.renderPage(pdfDoc, j + 1, { scale: 0.5 }));
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
    }

    return thumbnails;
  }

  /**
   * Apply theme filters to canvas context
   * @param {CanvasRenderingContext2D} context
   * @param {number} width
   * @param {number} height
   * @param {Object} settings
   */
  applyThemeFilters(context, width, height, settings) {
    const { theme = 'dark', brightness = 100, contrast = 100 } = settings;
    
    // Get image data for pixel manipulation
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Apply theme-specific filters
    switch (theme) {
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
    }

    // Apply brightness and contrast
    this.applyBrightnessContrast(data, brightness, contrast);
    
    // Put the modified image data back
    context.putImageData(imageData, 0, 0);
  }

  applyDarkModeFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      // Invert colors
      data[i] = 255 - data[i];     // Red
      data[i + 1] = 255 - data[i + 1]; // Green
      data[i + 2] = 255 - data[i + 2]; // Blue
      // Alpha remains unchanged
    }
  }

  applyDarkerModeFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      // More aggressive inversion with reduced brightness
      data[i] = Math.max(0, 255 - data[i] - 30);
      data[i + 1] = Math.max(0, 255 - data[i + 1] - 30);
      data[i + 2] = Math.max(0, 255 - data[i + 2] - 30);
    }
  }

  applyDarkestModeFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      // Maximum inversion with significant brightness reduction
      data[i] = Math.max(0, 255 - data[i] - 60);
      data[i + 1] = Math.max(0, 255 - data[i + 1] - 60);
      data[i + 2] = Math.max(0, 255 - data[i + 2] - 60);
    }
  }

  applySepiaFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
      data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
      data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
    }
  }

  applyBlueLightFilter(data) {
    for (let i = 0; i < data.length; i += 4) {
      // Reduce blue light by decreasing blue channel
      data[i + 2] = Math.max(0, data[i + 2] * 0.7);
      // Slightly warm the image
      data[i] = Math.min(255, data[i] * 1.1);
      data[i + 1] = Math.min(255, data[i + 1] * 1.05);
    }
  }

  applyBrightnessContrast(data, brightness, contrast) {
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

  getCacheKey(pdfDoc, pageNumber, settings) {
    return `${pdfDoc.getTitle() || 'untitled'}_${pageNumber}_${JSON.stringify(settings)}`;
  }

  cacheCanvas(key, canvas) {
    if (this.renderCache.size >= this.maxCacheSize) {
      const firstKey = this.renderCache.keys().next().value;
      this.renderCache.delete(firstKey);
    }
    this.renderCache.set(key, canvas);
  }

  createErrorThumbnail() {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 200;
    const context = canvas.getContext('2d');
    
    context.fillStyle = '#333';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#fff';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText('Error', canvas.width / 2, canvas.height / 2);
    
    return canvas;
  }
}
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
      const pdfBytes = await pdfDoc.save();
      const pdfDocument = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
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
    
    // Apply dark mode inversion
    context.globalCompositeOperation = 'difference';
    context.fillStyle = this.getThemeFillColor(theme);
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
    
    // Apply brightness and contrast
    context.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
  }

  getThemeFillColor(theme) {
    const themeColors = {
      dark: 'white',
      darker: '#ccc',
      darkest: '#999'
    };
    return themeColors[theme] || 'white';
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
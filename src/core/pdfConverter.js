/**
 * PDF Conversion Operations
 */
export class PDFConverter {
  constructor(renderer) {
    this.renderer = renderer;
    this.progressCallbacks = new Set();
  }

  /**
   * Convert PDF to dark mode
   * @param {PDFDocument} sourcePdf - Source PDF document
   * @param {Object} settings - Conversion settings
   * @returns {Promise<Uint8Array>} - Converted PDF bytes
   */
  async convertToDarkMode(sourcePdf, settings = {}) {
    const numPages = sourcePdf.getPageCount();
    const newPdfDoc = await PDFLib.PDFDocument.create();
    
    this.notifyProgress(0, numPages, 'Starting conversion...');

    try {
      for (let i = 1; i <= numPages; i++) {
        this.notifyProgress(i - 1, numPages, `Processing page ${i}...`);
        
        const canvas = await this.renderer.renderPage(sourcePdf, i, settings);
        const imageDataUrl = canvas.toDataURL('image/png');
        const embeddedImage = await newPdfDoc.embedPng(imageDataUrl);
        
        const page = newPdfDoc.addPage([canvas.width, canvas.height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: page.getWidth(),
          height: page.getHeight()
        });
      }

      this.notifyProgress(numPages, numPages, 'Finalizing PDF...');
      const pdfBytes = await newPdfDoc.save({
        useObjectStreams: true,
        compress: true,
        optimizeForSize: true
      });

      this.notifyProgress(numPages, numPages, 'Conversion complete!');
      return pdfBytes;
    } catch (error) {
      throw new Error(`Conversion failed: ${error.message}`);
    }
  }

  /**
   * Subscribe to progress updates
   * @param {Function} callback - Progress callback (current, total, message)
   */
  onProgress(callback) {
    this.progressCallbacks.add(callback);
  }

  /**
   * Unsubscribe from progress updates
   * @param {Function} callback
   */
  offProgress(callback) {
    this.progressCallbacks.delete(callback);
  }

  private notifyProgress(current, total, message) {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(current, total, message);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }
}
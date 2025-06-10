/**
 * Batch Processing for Multiple PDFs
 */
export class BatchProcessor {
  constructor(converter, processor) {
    this.converter = converter;
    this.processor = processor;
    this.queue = [];
    this.isProcessing = false;
    this.progressCallbacks = new Set();
    this.results = [];
  }

  /**
   * Add files to processing queue
   * @param {Array<File>} files - Array of PDF files
   * @param {Object} settings - Processing settings
   */
  addToQueue(files, settings) {
    const newItems = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      settings,
      status: 'pending'
    }));
    
    this.queue.push(...newItems);
    return newItems.map(item => item.id);
  }

  /**
   * Start batch processing
   * @returns {Promise<Array>} - Array of results
   */
  async startProcessing() {
    if (this.isProcessing) {
      throw new Error('Batch processing is already in progress');
    }

    this.isProcessing = true;
    this.results = [];
    const total = this.queue.length;

    try {
      for (let i = 0; i < total; i++) {
        const item = this.queue[i];
        this.notifyProgress(i, total, `Processing ${item.file.name}`);
        
        try {
          item.status = 'processing';
          const result = await this.processFile(item.file, item.settings);
          
          this.results.push({
            id: item.id,
            filename: item.file.name,
            success: true,
            result,
            size: result.byteLength
          });
          
          item.status = 'completed';
        } catch (error) {
          this.results.push({
            id: item.id,
            filename: item.file.name,
            success: false,
            error: error.message
          });
          
          item.status = 'failed';
          console.error(`Failed to process ${item.file.name}:`, error);
        }
      }

      this.notifyProgress(total, total, 'Batch processing complete');
      return this.results;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single file
   * @param {File} file - PDF file to process
   * @param {Object} settings - Processing settings
   * @returns {Promise<Uint8Array>} - Processed PDF bytes
   */
  async processFile(file, settings) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    
    let result = pdfDoc;

    // Apply dark mode conversion if requested
    if (settings.convertToDarkMode) {
      const convertedBytes = await this.converter.convertToDarkMode(pdfDoc, settings.themeSettings);
      result = await PDFLib.PDFDocument.load(convertedBytes);
    }

    // Apply watermark if requested
    if (settings.addWatermark && settings.watermarkText) {
      const watermarkedBytes = await this.processor.addWatermark(result, settings.watermarkText, settings.watermarkOptions);
      result = await PDFLib.PDFDocument.load(watermarkedBytes);
    }

    // Remove metadata if requested
    if (settings.removeMetadata) {
      const cleanedBytes = await this.processor.removeMetadata(result);
      result = await PDFLib.PDFDocument.load(cleanedBytes);
    }

    // Compress if requested
    if (settings.compress) {
      return await this.processor.compressPDF(result, settings.compressionOptions);
    }

    return await result.save();
  }

  /**
   * Download all processed files as a ZIP
   * @returns {Promise<void>}
   */
  async downloadAllAsZip() {
    if (this.results.length === 0) {
      throw new Error('No processed files to download');
    }

    // For now, download files individually
    // In a full implementation, you'd use a ZIP library like JSZip
    this.results.forEach((result, index) => {
      if (result.success) {
        setTimeout(() => {
          this.downloadFile(result.result, result.filename, index * 100);
        }, index * 100);
      }
    });
  }

  /**
   * Download a single file
   * @param {Uint8Array} bytes - File bytes
   * @param {string} filename - Original filename
   * @param {number} delay - Delay before download
   */
  downloadFile(bytes, filename, delay = 0) {
    setTimeout(() => {
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed_${filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, delay);
  }

  /**
   * Clear the processing queue
   */
  clearQueue() {
    if (this.isProcessing) {
      throw new Error('Cannot clear queue while processing');
    }
    this.queue = [];
    this.results = [];
  }

  /**
   * Get queue status
   * @returns {Object} - Queue status information
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      completed: this.results.filter(r => r.success).length,
      failed: this.results.filter(r => !r.success).length
    };
  }

  /**
   * Subscribe to progress updates
   * @param {Function} callback - Progress callback
   */
  onProgress(callback) {
    this.progressCallbacks.add(callback);
  }

  /**
   * Unsubscribe from progress updates
   * @param {Function} callback - Progress callback
   */
  offProgress(callback) {
    this.progressCallbacks.delete(callback);
  }

  notifyProgress(current, total, message) {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(current, total, message);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
  }
}
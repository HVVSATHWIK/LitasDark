/**
 * PDF Loading and Document Management
 */
export class PDFLoader {
  constructor() {
    this.currentDocument = null;
    this.loadingCallbacks = new Set();
  }

  /**
   * Load PDF from file input
   * @param {File} file - PDF file to load
   * @returns {Promise<PDFDocument>}
   */
  async loadFromFile(file) {
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please select a PDF file.');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('File too large. Please select a file smaller than 50MB.');
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Wait for PDFLib to be available
      if (!window.PDFLib) {
        throw new Error('PDF library not loaded. Please refresh the page.');
      }
      
      this.currentDocument = await window.PDFLib.PDFDocument.load(arrayBuffer);
      this.notifyLoadingComplete();
      return this.currentDocument;
    } catch (error) {
      this.handleLoadError(error);
      throw error;
    }
  }

  /**
   * Get current loaded document
   * @returns {PDFDocument|null}
   */
  getCurrentDocument() {
    return this.currentDocument;
  }

  /**
   * Check if document is loaded
   * @returns {boolean}
   */
  isDocumentLoaded() {
    return this.currentDocument !== null;
  }

  /**
   * Subscribe to loading completion events
   * @param {Function} callback
   */
  onLoadingComplete(callback) {
    this.loadingCallbacks.add(callback);
  }

  /**
   * Unsubscribe from loading completion events
   * @param {Function} callback
   */
  offLoadingComplete(callback) {
    this.loadingCallbacks.delete(callback);
  }

  notifyLoadingComplete() {
    this.loadingCallbacks.forEach(callback => {
      try {
        callback(this.currentDocument);
      } catch (error) {
        console.error('Error in loading callback:', error);
      }
    });
  }

  handleLoadError(error) {
    if (error.message.includes('Invalid PDF structure') || 
        error.name === 'InvalidPDFException') {
      throw new Error('The file appears to be corrupted or not a valid PDF. Please try a different file.');
    }
    throw new Error('Failed to load PDF. Please ensure the file is valid.');
  }
}
/**
 * OCR (Optical Character Recognition) Processing
 */
export class OCRProcessor {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.isLoading = false;
  }

  /**
   * Initialize OCR engine
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized || this.isLoading) return;
    
    this.isLoading = true;
    
    try {
      // Dynamically import Tesseract.js
      const { createWorker } = await import('tesseract.js');
      
      this.worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR:', error);
      throw new Error('OCR initialization failed. Please check your internet connection.');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Perform OCR on a canvas element
   * @param {HTMLCanvasElement} canvas - Canvas with rendered PDF page
   * @param {Object} options - OCR options
   * @returns {Promise<Object>} - OCR results with text and confidence
   */
  async recognizeText(canvas, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    try {
      const { data } = await this.worker.recognize(canvas, {
        rectangle: options.rectangle, // Optional: specify region to OCR
      });

      return {
        text: data.text,
        confidence: data.confidence,
        words: data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        })),
        lines: data.lines.map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox
        }))
      };
    } catch (error) {
      throw new Error(`OCR recognition failed: ${error.message}`);
    }
  }

  /**
   * Extract text from multiple pages
   * @param {Array<HTMLCanvasElement>} canvases - Array of page canvases
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<Array>} - Array of OCR results per page
   */
  async recognizeMultiplePages(canvases, progressCallback) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results = [];
    const total = canvases.length;

    for (let i = 0; i < total; i++) {
      if (progressCallback) {
        progressCallback(i, total, `Processing page ${i + 1}...`);
      }

      try {
        const result = await this.recognizeText(canvases[i]);
        results.push({
          pageNumber: i + 1,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          pageNumber: i + 1,
          success: false,
          error: error.message
        });
      }
    }

    if (progressCallback) {
      progressCallback(total, total, 'OCR processing complete');
    }

    return results;
  }

  /**
   * Search for specific text in OCR results
   * @param {Array} ocrResults - Results from recognizeMultiplePages
   * @param {string} searchText - Text to search for
   * @param {boolean} caseSensitive - Whether search is case sensitive
   * @returns {Array} - Array of matches with page numbers and positions
   */
  searchText(ocrResults, searchText, caseSensitive = false) {
    const matches = [];
    const searchTerm = caseSensitive ? searchText : searchText.toLowerCase();

    ocrResults.forEach(result => {
      if (!result.success) return;

      const text = caseSensitive ? result.text : result.text.toLowerCase();
      
      if (text.includes(searchTerm)) {
        // Find word-level matches for better positioning
        result.words.forEach(word => {
          const wordText = caseSensitive ? word.text : word.text.toLowerCase();
          if (wordText.includes(searchTerm)) {
            matches.push({
              pageNumber: result.pageNumber,
              text: word.text,
              confidence: word.confidence,
              bbox: word.bbox,
              context: this.getWordContext(result.words, word, 5)
            });
          }
        });
      }
    });

    return matches;
  }

  /**
   * Get context words around a specific word
   * @param {Array} words - All words from OCR
   * @param {Object} targetWord - The word to get context for
   * @param {number} contextSize - Number of words before and after
   * @returns {string} - Context string
   */
  getWordContext(words, targetWord, contextSize = 5) {
    const index = words.findIndex(w => w === targetWord);
    if (index === -1) return targetWord.text;

    const start = Math.max(0, index - contextSize);
    const end = Math.min(words.length, index + contextSize + 1);
    
    return words.slice(start, end).map(w => w.text).join(' ');
  }

  /**
   * Export OCR results to different formats
   * @param {Array} ocrResults - OCR results
   * @param {string} format - Export format ('txt', 'json', 'csv')
   * @returns {string} - Formatted export data
   */
  exportResults(ocrResults, format = 'txt') {
    switch (format.toLowerCase()) {
      case 'txt':
        return ocrResults
          .filter(r => r.success)
          .map(r => `Page ${r.pageNumber}:\n${r.text}\n`)
          .join('\n---\n\n');

      case 'json':
        return JSON.stringify(ocrResults, null, 2);

      case 'csv':
        const csvRows = ['Page,Text,Confidence'];
        ocrResults.forEach(r => {
          if (r.success) {
            const text = r.text.replace(/"/g, '""').replace(/\n/g, ' ');
            csvRows.push(`${r.pageNumber},"${text}",${r.confidence}`);
          }
        });
        return csvRows.join('\n');

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Clean up resources
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * Check if OCR is available
   * @returns {boolean} - Whether OCR functionality is available
   */
  isAvailable() {
    return typeof window !== 'undefined' && 'Worker' in window;
  }
}
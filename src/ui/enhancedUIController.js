/**
 * Enhanced UI Controller with Advanced Features
 */
import { UIController } from './uiController.js';
import { PDFProcessor } from '../features/pdfProcessor.js';
import { BatchProcessor } from '../features/batchProcessor.js';
import { OCRProcessor } from '../features/ocrProcessor.js';
import { showLoading, hideLoading, showError, showMessage } from '../../messages.js';

export class EnhancedUIController extends UIController {
  constructor() {
    super();
    this.pdfProcessor = new PDFProcessor();
    this.batchProcessor = new BatchProcessor(this.pdfConverter, this.pdfProcessor);
    this.ocrProcessor = new OCRProcessor();
    this.currentOCRResults = [];
    
    this.initializeEnhancedFeatures();
  }

  initializeEnhancedFeatures() {
    // Batch processing
    document.getElementById('batchUpload')?.addEventListener('change', (e) => {
      this.handleBatchUpload(e.target.files);
    });

    document.getElementById('startBatchButton')?.addEventListener('click', () => {
      this.startBatchProcessing();
    });

    // Watermark functionality
    document.getElementById('addWatermarkButton')?.addEventListener('click', () => {
      this.addWatermark();
    });

    // OCR functionality
    document.getElementById('extractTextButton')?.addEventListener('click', () => {
      this.extractTextFromPDF();
    });

    document.getElementById('searchTextButton')?.addEventListener('click', () => {
      this.searchInPDF();
    });

    // Document info
    document.getElementById('showInfoButton')?.addEventListener('click', () => {
      this.showDocumentInfo();
    });

    // Compression
    document.getElementById('compressButton')?.addEventListener('click', () => {
      this.compressPDF();
    });

    // Metadata removal
    document.getElementById('removeMetadataButton')?.addEventListener('click', () => {
      this.removeMetadata();
    });

    // Setup batch processor progress handling
    this.batchProcessor.onProgress((current, total, message) => {
      this.updateProgressBar(current, total, message);
    });
  }

  async handleBatchUpload(files) {
    if (!files || files.length === 0) return;

    try {
      const settings = this.getBatchSettings();
      const ids = this.batchProcessor.addToQueue(files, settings);
      
      showMessage(`Added ${files.length} files to batch queue`);
      this.updateBatchQueueDisplay();
    } catch (error) {
      showError(`Failed to add files to queue: ${error.message}`);
    }
  }

  getBatchSettings() {
    return {
      convertToDarkMode: document.getElementById('batchDarkMode')?.checked || false,
      themeSettings: this.getThemeSettings(),
      addWatermark: document.getElementById('batchWatermark')?.checked || false,
      watermarkText: document.getElementById('batchWatermarkText')?.value || '',
      watermarkOptions: {
        opacity: parseFloat(document.getElementById('watermarkOpacity')?.value || 0.3),
        rotation: parseInt(document.getElementById('watermarkRotation')?.value || 45),
        fontSize: parseInt(document.getElementById('watermarkSize')?.value || 50),
        position: document.getElementById('watermarkPosition')?.value || 'center'
      },
      removeMetadata: document.getElementById('batchRemoveMetadata')?.checked || false,
      compress: document.getElementById('batchCompress')?.checked || false,
      compressionOptions: {
        useObjectStreams: true,
        compress: true,
        optimizeForSize: true
      }
    };
  }

  async startBatchProcessing() {
    const loadingElement = document.getElementById('loading');
    
    try {
      showLoading(loadingElement);
      const results = await this.batchProcessor.startProcessing();
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      showMessage(`Batch processing complete: ${successful} successful, ${failed} failed`);
      
      if (successful > 0) {
        await this.batchProcessor.downloadAllAsZip();
      }
      
      this.updateBatchQueueDisplay();
    } catch (error) {
      showError(`Batch processing failed: ${error.message}`);
    } finally {
      hideLoading(loadingElement);
    }
  }

  async addWatermark() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    const watermarkText = document.getElementById('watermarkText')?.value;
    if (!watermarkText) {
      showError('Please enter watermark text.');
      return;
    }

    const loadingElement = document.getElementById('loading');
    
    try {
      showLoading(loadingElement);
      
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      const options = {
        opacity: parseFloat(document.getElementById('watermarkOpacity')?.value || 0.3),
        rotation: parseInt(document.getElementById('watermarkRotation')?.value || 45),
        fontSize: parseInt(document.getElementById('watermarkSize')?.value || 50),
        position: document.getElementById('watermarkPosition')?.value || 'center'
      };
      
      const watermarkedBytes = await this.pdfProcessor.addWatermark(pdfDoc, watermarkText, options);
      this.downloadPDF(watermarkedBytes, 'watermarked.pdf');
      
      showMessage('Watermark added successfully!');
    } catch (error) {
      showError(`Failed to add watermark: ${error.message}`);
    } finally {
      hideLoading(loadingElement);
    }
  }

  async extractTextFromPDF() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    const loadingElement = document.getElementById('loading');
    
    try {
      showLoading(loadingElement);
      
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      const numPages = pdfDoc.getPageCount();
      const canvases = [];
      
      // Render all pages for OCR
      for (let i = 1; i <= numPages; i++) {
        const canvas = await this.pdfRenderer.renderPage(pdfDoc, i, { scale: 2.0 });
        canvases.push(canvas);
      }
      
      // Perform OCR
      this.currentOCRResults = await this.ocrProcessor.recognizeMultiplePages(
        canvases,
        (current, total, message) => {
          this.updateProgressBar(current, total, message);
        }
      );
      
      this.displayOCRResults();
      showMessage('Text extraction completed!');
    } catch (error) {
      showError(`Text extraction failed: ${error.message}`);
    } finally {
      hideLoading(loadingElement);
    }
  }

  async searchInPDF() {
    if (this.currentOCRResults.length === 0) {
      showError('Please extract text first.');
      return;
    }

    const searchText = document.getElementById('searchText')?.value;
    if (!searchText) {
      showError('Please enter search text.');
      return;
    }

    try {
      const matches = this.ocrProcessor.searchText(this.currentOCRResults, searchText);
      this.displaySearchResults(matches);
      
      if (matches.length === 0) {
        showMessage('No matches found.');
      } else {
        showMessage(`Found ${matches.length} matches.`);
      }
    } catch (error) {
      showError(`Search failed: ${error.message}`);
    }
  }

  async showDocumentInfo() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    try {
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      const info = this.pdfProcessor.getDocumentInfo(pdfDoc);
      this.displayDocumentInfo(info);
    } catch (error) {
      showError(`Failed to get document info: ${error.message}`);
    }
  }

  async compressPDF() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    const loadingElement = document.getElementById('loading');
    
    try {
      showLoading(loadingElement);
      
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      const compressedBytes = await this.pdfProcessor.compressPDF(pdfDoc);
      
      this.downloadPDF(compressedBytes, 'compressed.pdf');
      showMessage('PDF compressed successfully!');
    } catch (error) {
      showError(`Compression failed: ${error.message}`);
    } finally {
      hideLoading(loadingElement);
    }
  }

  async removeMetadata() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    const loadingElement = document.getElementById('loading');
    
    try {
      showLoading(loadingElement);
      
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      const cleanedBytes = await this.pdfProcessor.removeMetadata(pdfDoc);
      
      this.downloadPDF(cleanedBytes, 'metadata-removed.pdf');
      showMessage('Metadata removed successfully!');
    } catch (error) {
      showError(`Failed to remove metadata: ${error.message}`);
    } finally {
      hideLoading(loadingElement);
    }
  }

  displayOCRResults() {
    const resultsContainer = document.getElementById('ocrResults');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';
    
    this.currentOCRResults.forEach(result => {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'ocr-result';
      
      if (result.success) {
        resultDiv.innerHTML = `
          <h4>Page ${result.pageNumber} (Confidence: ${Math.round(result.confidence)}%)</h4>
          <div class="ocr-text">${result.text.replace(/\n/g, '<br>')}</div>
        `;
      } else {
        resultDiv.innerHTML = `
          <h4>Page ${result.pageNumber} - Error</h4>
          <div class="error">${result.error}</div>
        `;
      }
      
      resultsContainer.appendChild(resultDiv);
    });

    // Add export buttons
    const exportDiv = document.createElement('div');
    exportDiv.className = 'export-controls';
    exportDiv.innerHTML = `
      <button onclick="window.enhancedUI.exportOCR('txt')">Export as TXT</button>
      <button onclick="window.enhancedUI.exportOCR('json')">Export as JSON</button>
      <button onclick="window.enhancedUI.exportOCR('csv')">Export as CSV</button>
    `;
    resultsContainer.appendChild(exportDiv);
  }

  displaySearchResults(matches) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';
    
    matches.forEach((match, index) => {
      const matchDiv = document.createElement('div');
      matchDiv.className = 'search-match';
      matchDiv.innerHTML = `
        <div class="match-header">
          <strong>Page ${match.pageNumber}</strong> 
          <span class="confidence">(${Math.round(match.confidence)}% confidence)</span>
        </div>
        <div class="match-context">${match.context}</div>
      `;
      resultsContainer.appendChild(matchDiv);
    });
  }

  displayDocumentInfo(info) {
    const infoContainer = document.getElementById('documentInfo');
    if (!infoContainer) return;

    infoContainer.innerHTML = `
      <div class="doc-info">
        <h3>Document Information</h3>
        <div class="info-grid">
          <div><strong>Title:</strong> ${info.title}</div>
          <div><strong>Author:</strong> ${info.author}</div>
          <div><strong>Subject:</strong> ${info.subject}</div>
          <div><strong>Pages:</strong> ${info.pageCount}</div>
          <div><strong>Creator:</strong> ${info.creator}</div>
          <div><strong>Producer:</strong> ${info.producer}</div>
          <div><strong>Created:</strong> ${info.creationDate ? info.creationDate.toLocaleDateString() : 'Unknown'}</div>
          <div><strong>Modified:</strong> ${info.modificationDate ? info.modificationDate.toLocaleDateString() : 'Unknown'}</div>
        </div>
      </div>
    `;
  }

  updateBatchQueueDisplay() {
    const status = this.batchProcessor.getStatus();
    const statusElement = document.getElementById('batchStatus');
    
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="batch-status">
          <div>Queue: ${status.queueLength} files</div>
          <div>Completed: ${status.completed}</div>
          <div>Failed: ${status.failed}</div>
          <div>Status: ${status.isProcessing ? 'Processing...' : 'Ready'}</div>
        </div>
      `;
    }
  }

  exportOCR(format) {
    try {
      const exportData = this.ocrProcessor.exportResults(this.currentOCRResults, format);
      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ocr-results.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage(`OCR results exported as ${format.toUpperCase()}`);
    } catch (error) {
      showError(`Export failed: ${error.message}`);
    }
  }

  // Cleanup when page unloads
  cleanup() {
    this.ocrProcessor.terminate();
  }
}

// Make it globally available for button clicks
window.enhancedUI = null;
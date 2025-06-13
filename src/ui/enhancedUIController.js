/**
 * Enhanced UI Controller with Modern UX
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
    this.modernUI = null;
    
    this.initializeEnhancedFeatures();
    this.initializeModernUI();
  }

  async initializeModernUI() {
    // Wait for modern UI to be available
    if (window.modernUI) {
      this.modernUI = window.modernUI;
    } else {
      // Retry after a short delay
      setTimeout(() => this.initializeModernUI(), 100);
    }
  }

  initializeEnhancedFeatures() {
    // Enhanced file upload with better UX
    this.setupEnhancedFileUpload();
    
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
      if (this.modernUI) {
        this.modernUI.showProgress(current, total, message);
      }
    });
    
    // Enhanced zoom controls
    this.setupZoomControls();
  }

  setupEnhancedFileUpload() {
    const fileInput = document.getElementById('pdfUpload');
    if (!fileInput) return;

    // Enhanced drag and drop
    const uploadZone = fileInput.closest('.upload-zone') || fileInput.parentElement;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.remove('drag-over');
      });
    });

    uploadZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type === 'application/pdf') {
        fileInput.files = files;
        this.handleFileUpload(files[0]);
      }
    });
  }

  setupZoomControls() {
    let currentZoom = 100;
    const zoomLevel = document.getElementById('zoomLevel');
    const previewCanvas = document.getElementById('previewCanvas');
    
    document.getElementById('zoomIn')?.addEventListener('click', () => {
      currentZoom = Math.min(currentZoom + 25, 200);
      this.updateZoom(currentZoom, zoomLevel, previewCanvas);
    });

    document.getElementById('zoomOut')?.addEventListener('click', () => {
      currentZoom = Math.max(currentZoom - 25, 50);
      this.updateZoom(currentZoom, zoomLevel, previewCanvas);
    });

    document.getElementById('resetZoom')?.addEventListener('click', () => {
      currentZoom = 100;
      this.updateZoom(currentZoom, zoomLevel, previewCanvas);
    });
  }

  updateZoom(zoom, zoomLevel, canvas) {
    if (zoomLevel) zoomLevel.textContent = `${zoom}%`;
    if (canvas) {
      canvas.style.transform = `scale(${zoom / 100})`;
      canvas.style.transformOrigin = 'center';
    }
  }

  async handleFileUpload(file) {
    if (!file) return;

    const loadingElement = document.getElementById('loading');
    
    try {
      // Show modern loading state
      if (this.modernUI) {
        this.modernUI.showToast('Uploading PDF...', 'info');
      }
      
      await super.handleFileUpload(file);
      
      // Show success message
      if (this.modernUI) {
        this.modernUI.showToast('PDF uploaded successfully!', 'success');
      }
      
      // Show preview section
      document.getElementById('preview')?.style.setProperty('display', 'block');
      
    } catch (error) {
      if (this.modernUI) {
        this.modernUI.showToast(error.message, 'error');
      }
    }
  }

  async generatePreview() {
    const button = document.getElementById('generatePreviewButton');
    if (!button) return;

    const stopLoading = this.modernUI?.createLoadingState(button, 'Generating...') || (() => {});
    
    try {
      await super.generatePreview();
      
      if (this.modernUI) {
        this.modernUI.showToast('Preview generated successfully!', 'success');
      }
      
      // Smooth scroll to preview
      document.getElementById('preview')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
    } catch (error) {
      if (this.modernUI) {
        this.modernUI.showToast(error.message, 'error');
      }
    } finally {
      stopLoading();
    }
  }

  async convertToDarkMode() {
    const button = document.getElementById('convertButton');
    if (!button) return;

    const stopLoading = this.modernUI?.createLoadingState(button, 'Converting...') || (() => {});
    
    try {
      await super.convertToDarkMode();
      
      // Show download section with animation
      const downloadSection = document.getElementById('downloadSection');
      if (downloadSection) {
        downloadSection.style.display = 'block';
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      if (this.modernUI) {
        this.modernUI.showToast('PDF converted to dark mode successfully!', 'success');
      }
      
    } catch (error) {
      if (this.modernUI) {
        this.modernUI.showToast(error.message, 'error');
      }
    } finally {
      stopLoading();
    }
  }

  async handleBatchUpload(files) {
    if (!files || files.length === 0) return;

    try {
      const settings = this.getBatchSettings();
      const ids = this.batchProcessor.addToQueue(files, settings);
      
      if (this.modernUI) {
        this.modernUI.showToast(`Added ${files.length} files to batch queue`, 'success');
      }
      
      this.updateBatchQueueDisplay();
    } catch (error) {
      if (this.modernUI) {
        this.modernUI.showToast(`Failed to add files to queue: ${error.message}`, 'error');
      }
    }
  }

  async startBatchProcessing() {
    const button = document.getElementById('startBatchButton');
    if (!button) return;

    const stopLoading = this.modernUI?.createLoadingState(button, 'Processing...') || (() => {});
    
    try {
      const results = await this.batchProcessor.startProcessing();
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      if (this.modernUI) {
        this.modernUI.showToast(
          `Batch processing complete: ${successful} successful, ${failed} failed`, 
          successful > 0 ? 'success' : 'warning'
        );
      }
      
      if (successful > 0) {
        await this.batchProcessor.downloadAllAsZip();
      }
      
      this.updateBatchQueueDisplay();
    } catch (error) {
      if (this.modernUI) {
        this.modernUI.showToast(`Batch processing failed: ${error.message}`, 'error');
      }
    } finally {
      stopLoading();
    }
  }

  async extractTextFromPDF() {
    const button = document.getElementById('extractTextButton');
    if (!button) return;

    const stopLoading = this.modernUI?.createLoadingState(button, 'Extracting...') || (() => {});
    
    try {
      await super.extractTextFromPDF();
      
      if (this.modernUI) {
        this.modernUI.showToast('Text extraction completed!', 'success');
      }
      
    } catch (error) {
      if (this.modernUI) {
        this.modernUI.showToast(`Text extraction failed: ${error.message}`, 'error');
      }
    } finally {
      stopLoading();
    }
  }

  async showDocumentInfo() {
    try {
      await super.showDocumentInfo();
      
      if (this.modernUI) {
        this.modernUI.showToast('Document information loaded', 'info');
      }
      
    } catch (error) {
      if (this.modernUI) {
        this.modernUI.showToast(`Failed to get document info: ${error.message}`, 'error');
      }
    }
  }

  displayOCRResults() {
    super.displayOCRResults();
    
    // Add enhanced styling to OCR results
    const resultsContainer = document.getElementById('ocrResults');
    if (resultsContainer) {
      resultsContainer.classList.add('space-y-4');
      
      // Style individual results
      resultsContainer.querySelectorAll('.ocr-result').forEach(result => {
        result.classList.add('p-4', 'bg-gray-50', 'rounded-lg', 'border', 'border-gray-200');
      });
    }
  }

  updateBatchQueueDisplay() {
    const status = this.batchProcessor.getStatus();
    const statusElement = document.getElementById('batchStatus');
    
    if (statusElement) {
      statusElement.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600">${status.queueLength}</div>
            <div class="text-sm text-gray-600">In Queue</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600">${status.completed}</div>
            <div class="text-sm text-gray-600">Completed</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-600">${status.failed}</div>
            <div class="text-sm text-gray-600">Failed</div>
          </div>
          <div class="text-center">
            <div class="text-sm font-medium ${status.isProcessing ? 'text-blue-600' : 'text-gray-600'}">
              ${status.isProcessing ? 'Processing...' : 'Ready'}
            </div>
          </div>
        </div>
      `;
    }
  }

  // Override parent methods to use modern UI
  downloadPDF(pdfBytes, filename, linkId = 'downloadLink') {
    try {
      super.downloadPDF(pdfBytes, filename, linkId);
      
      if (this.modernUI) {
        this.modernUI.showToast(`${filename} is ready for download!`, 'success');
      }
      
    } catch (error) {
      if (this.modernUI) {
        this.modernUI.showToast('Failed to download PDF. Please try again.', 'error');
      }
    }
  }

  updateProgressBar(current, total, message) {
    super.updateProgressBar(current, total, message);
    
    // Update loading message
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingProgress = document.getElementById('loadingProgress');
    
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
    
    if (loadingProgress) {
      const percentage = Math.round((current / total) * 100);
      loadingProgress.textContent = `${current} of ${total} (${percentage}%)`;
    }
  }

  // Cleanup when page unloads
  cleanup() {
    super.cleanup();
    this.ocrProcessor.terminate();
  }
}

// Make it globally available for button clicks
window.enhancedUI = null;
/**
 * UI Controller for PDF Application
 */
import { PDFLoader } from '../core/pdfLoader.js';
import { PDFRenderer } from '../core/pdfRenderer.js';
import { PDFConverter } from '../core/pdfConverter.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Validator } from '../utils/validation.js';
import { showLoading, hideLoading, showError, showMessage } from '../messages.js';

export class UIController {
  constructor() {
    this.pdfLoader = new PDFLoader();
    this.pdfRenderer = new PDFRenderer();
    this.pdfConverter = new PDFConverter(this.pdfRenderer);
    
    this.initializeEventListeners();
    this.setupProgressHandling();
  }

  initializeEventListeners() {
    // File upload
    document.getElementById('pdfUpload').addEventListener('change', (e) => {
      this.handleFileUpload(e.target.files[0]);
    });

    // Preview generation
    document.getElementById('generatePreviewButton').addEventListener('click', () => {
      this.generatePreview();
    });

    // Conversion
    document.getElementById('convertButton').addEventListener('click', () => {
      this.convertToDarkMode();
    });

    // Theme settings changes
    ['themeSelect', 'brightness', 'contrast'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        this.updatePreview();
      });
    });

    // PDF operations
    document.getElementById('splitButton').addEventListener('click', () => {
      this.splitPDF();
    });

    document.getElementById('mergeButton').addEventListener('click', () => {
      this.mergePDFs();
    });

    document.getElementById('rotateButton').addEventListener('click', () => {
      this.rotatePage();
    });
  }

  setupProgressHandling() {
    this.pdfConverter.onProgress((current, total, message) => {
      this.updateProgressBar(current, total, message);
    });
  }

  async handleFileUpload(file) {
    if (!file) return;

    const loadingElement = document.getElementById('loading');
    
    try {
      Validator.validateFile(file);
      showLoading(loadingElement);
      
      await this.pdfLoader.loadFromFile(file);
      await this.generateThumbnails();
      
      showMessage('PDF loaded successfully! Generate a preview to see the dark mode effect.');
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading(loadingElement);
    }
  }

  async generatePreview() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    const loadingElement = document.getElementById('loading');
    
    try {
      showLoading(loadingElement);
      const settings = this.getThemeSettings();
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      
      // Render first page as preview
      const canvas = await this.pdfRenderer.renderPage(pdfDoc, 1, settings);
      this.displayPreview(canvas);
      
      document.getElementById('preview').style.display = 'block';
    } catch (error) {
      const handledError = ErrorHandler.handlePDFError(error, 'preview generation');
      showError(handledError.message);
    } finally {
      hideLoading(loadingElement);
    }
  }

  async convertToDarkMode() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    const loadingElement = document.getElementById('loading');
    
    try {
      showLoading(loadingElement);
      const settings = this.getThemeSettings();
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      
      const convertedBytes = await this.pdfConverter.convertToDarkMode(pdfDoc, settings);
      this.downloadPDF(convertedBytes, 'dark-mode.pdf');
      
      showMessage('PDF converted successfully!');
    } catch (error) {
      const handledError = ErrorHandler.handlePDFError(error, 'conversion');
      showError(handledError.message);
    } finally {
      hideLoading(loadingElement);
    }
  }

  getThemeSettings() {
    return {
      theme: document.getElementById('themeSelect').value,
      brightness: parseInt(document.getElementById('brightness').value, 10),
      contrast: parseInt(document.getElementById('contrast').value, 10),
      scale: 1.5
    };
  }

  displayPreview(canvas) {
    const previewCanvas = document.getElementById('previewCanvas');
    const context = previewCanvas.getContext('2d');
    
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    context.drawImage(canvas, 0, 0);
  }

  downloadPDF(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.getElementById('downloadLink');
    
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'block';
    downloadLink.click();
    
    // Clean up URL after download
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  updateProgressBar(current, total, message) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      const percentage = (current / total) * 100;
      progressBar.style.width = `${percentage}%`;
      progressBar.setAttribute('aria-valuenow', percentage);
      progressBar.setAttribute('aria-valuetext', message);
    }
  }

  // Additional methods for split, merge, rotate operations...
  // (Implementation similar to above pattern)
}
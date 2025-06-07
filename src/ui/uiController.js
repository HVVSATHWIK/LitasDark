/**
 * UI Controller for PDF Application
 */
import { PDFLoader } from '../core/pdfLoader.js';
import { PDFRenderer } from '../core/pdfRenderer.js';
import { PDFConverter } from '../core/pdfConverter.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { Validator } from '../utils/validation.js';
import { showLoading, hideLoading, showError, showMessage } from '../../messages.js';

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

    // Back to top button
    document.getElementById('backToTop').addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  async generateThumbnails() {
    const pdfDoc = this.pdfLoader.getCurrentDocument();
    if (!pdfDoc) return;

    try {
      const thumbnails = await this.pdfRenderer.generateThumbnails(pdfDoc);
      const thumbnailsContainer = document.getElementById('thumbnails');
      thumbnailsContainer.innerHTML = '';

      thumbnails.forEach((canvas, index) => {
        if (canvas) {
          const thumbnail = document.createElement('div');
          thumbnail.classList.add('thumbnail');
          thumbnail.appendChild(canvas);
          thumbnail.setAttribute('role', 'button');
          thumbnail.setAttribute('aria-label', `Page ${index + 1} preview`);
          thumbnail.tabIndex = 0;

          thumbnail.addEventListener('click', () => {
            this.renderPage(index + 1);
          });

          thumbnailsContainer.appendChild(thumbnail);
        }
      });
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    }
  }

  async renderPage(pageNumber) {
    const pdfDoc = this.pdfLoader.getCurrentDocument();
    if (!pdfDoc) return;

    try {
      const settings = this.getThemeSettings();
      const canvas = await this.pdfRenderer.renderPage(pdfDoc, pageNumber, settings);
      this.displayPreview(canvas);
    } catch (error) {
      showError(`Failed to render page ${pageNumber}`);
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

  async updatePreview() {
    if (this.pdfLoader.isDocumentLoaded()) {
      await this.generatePreview();
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

  async splitPDF() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    try {
      const startPage = document.getElementById('startPage').value;
      const endPage = document.getElementById('endPage').value;
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      
      const { start, end } = Validator.validatePageRange(startPage, endPage, pdfDoc.getPageCount());
      
      const splitPdfDoc = await PDFLib.PDFDocument.create();
      const pages = await splitPdfDoc.copyPages(pdfDoc, [...Array(end - start + 1).keys()].map(i => i + start - 1));
      pages.forEach((page) => {
        splitPdfDoc.addPage(page);
      });

      const splitPdfBytes = await splitPdfDoc.save();
      this.downloadPDF(splitPdfBytes, 'split_pdf.pdf', 'splitDownloadLink');
      
      showMessage('PDF split successfully!');
    } catch (error) {
      showError(error.message);
    }
  }

  async mergePDFs() {
    const pdfFiles = document.getElementById('pdfFiles').files;
    if (pdfFiles.length === 0) {
      showError('Please select PDF files to merge.');
      return;
    }

    try {
      const mergedPdfDoc = await PDFLib.PDFDocument.create();
      const fileNames = [];

      for (const file of pdfFiles) {
        Validator.validateFile(file);
        const fileArrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(fileArrayBuffer);
        const pages = await mergedPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach((page) => {
          mergedPdfDoc.addPage(page);
        });
        fileNames.push(file.name.replace('.pdf', ''));
      }

      const mergedPdfBytes = await mergedPdfDoc.save();
      this.downloadPDF(mergedPdfBytes, `${fileNames.join('_')}_merged.pdf`, 'mergeDownloadLink');
      
      showMessage('PDFs merged successfully!');
    } catch (error) {
      showError(`Failed to merge PDFs: ${error.message}`);
    }
  }

  async rotatePage() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    try {
      const pageNumber = document.getElementById('rotatePageNumber').value;
      const angle = document.getElementById('rotateAngle').value;
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      
      const pageNum = parseInt(pageNumber, 10);
      const rotationAngle = Validator.validateRotationAngle(angle);
      
      if (pageNum < 1 || pageNum > pdfDoc.getPageCount()) {
        throw new Error(`Page number must be between 1 and ${pdfDoc.getPageCount()}`);
      }

      const page = pdfDoc.getPage(pageNum - 1);
      page.setRotation(PDFLib.degrees(rotationAngle));

      const rotatedPdfBytes = await pdfDoc.save();
      this.downloadPDF(rotatedPdfBytes, 'rotated_pdf.pdf', 'rotateDownloadLink');
      
      showMessage('Page rotated successfully!');
    } catch (error) {
      showError(error.message);
    }
  }

  getThemeSettings() {
    const settings = {
      theme: document.getElementById('themeSelect').value,
      brightness: parseInt(document.getElementById('brightness').value, 10),
      contrast: parseInt(document.getElementById('contrast').value, 10),
      scale: 1.5
    };

    try {
      Validator.validateThemeSettings(settings);
    } catch (error) {
      showError(error.message);
      return { theme: 'dark', brightness: 100, contrast: 100, scale: 1.5 };
    }

    return settings;
  }

  displayPreview(canvas) {
    const previewCanvas = document.getElementById('previewCanvas');
    const context = previewCanvas.getContext('2d');
    
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    context.drawImage(canvas, 0, 0);
  }

  downloadPDF(pdfBytes, filename, linkId = 'downloadLink') {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.getElementById(linkId);
    
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'block';
    
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
}
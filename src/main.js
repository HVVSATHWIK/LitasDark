/**
 * LitasDark PDF Converter - Enhanced Main Application
 */

// Configure PDF.js worker source
if (typeof window !== 'undefined' && window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.js';
}

// Import core modules
import { PDFLoader } from './core/pdfLoader.js';
import { PDFRenderer } from './core/pdfRenderer.js';
import { PDFConverter } from './core/pdfConverter.js';
import { showLoading, hideLoading, showError, showMessage } from '../messages.js';

class LitasDarkApp {
  constructor() {
    this.pdfLoader = new PDFLoader();
    this.pdfRenderer = new PDFRenderer();
    this.pdfConverter = new PDFConverter(this.pdfRenderer);
    this.currentZoom = 100;
    this.batchFiles = [];
    this.isProcessing = false;
    
    this.initializeApp();
  }

  initializeApp() {
    // Wait for libraries to load
    this.waitForLibraries().then(() => {
      this.setupEventListeners();
      this.setupProgressHandling();
      this.setupFileUpload();
      this.setupBatchProcessing();
      this.setupUI();
      
      console.log('LitasDark application initialized successfully');
    }).catch(error => {
      console.error('Failed to initialize application:', error);
      showError('Failed to load required libraries. Please refresh the page.');
    });
  }

  async waitForLibraries() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      if (window.PDFLib && window.pdfjsLib) {
        return Promise.resolve();
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    throw new Error('Required libraries failed to load');
  }

  setupEventListeners() {
    // File upload
    const fileInput = document.getElementById('pdfUpload');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.handleFileUpload(e.target.files[0]);
      });
    }

    // Preview generation
    const previewBtn = document.getElementById('generatePreviewButton');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        this.generatePreview();
      });
    }

    // Conversion
    const convertBtn = document.getElementById('convertButton');
    if (convertBtn) {
      convertBtn.addEventListener('click', () => {
        this.convertToDarkMode();
      });
    }

    // Theme settings changes
    ['themeSelect', 'brightness', 'contrast'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => {
          this.updatePreview();
        });
      }
    });

    // PDF Operations
    this.setupPDFOperations();

    // Range input value display
    this.setupRangeInputs();

    // Back to top button
    this.setupBackToTop();

    // Zoom controls
    this.setupZoomControls();

    // Tools
    this.setupTools();
  }

  setupPDFOperations() {
    // Split PDF
    const splitBtn = document.getElementById('splitButton');
    if (splitBtn) {
      splitBtn.addEventListener('click', () => {
        this.splitPDF();
      });
    }

    // Merge PDFs
    const mergeBtn = document.getElementById('mergeButton');
    if (mergeBtn) {
      mergeBtn.addEventListener('click', () => {
        this.mergePDFs();
      });
    }

    // Rotate Page
    const rotateBtn = document.getElementById('rotateButton');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', () => {
        this.rotatePage();
      });
    }
  }

  setupTools() {
    // Document Info
    const infoBtn = document.getElementById('showInfoButton');
    if (infoBtn) {
      infoBtn.addEventListener('click', () => {
        this.showDocumentInfo();
      });
    }

    // Compress PDF
    const compressBtn = document.getElementById('compressButton');
    if (compressBtn) {
      compressBtn.addEventListener('click', () => {
        this.compressPDF();
      });
    }

    // Remove Metadata
    const metadataBtn = document.getElementById('removeMetadataButton');
    if (metadataBtn) {
      metadataBtn.addEventListener('click', () => {
        this.removeMetadata();
      });
    }

    // Add Watermark
    const watermarkBtn = document.getElementById('addWatermarkButton');
    if (watermarkBtn) {
      watermarkBtn.addEventListener('click', () => {
        this.addWatermark();
      });
    }
  }

  setupRangeInputs() {
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
      const valueDisplay = document.getElementById(input.id + 'Value');
      if (valueDisplay) {
        // Set initial value
        valueDisplay.textContent = input.value;
        
        input.addEventListener('input', () => {
          valueDisplay.textContent = input.value;
        });
      }
    });
  }

  setupBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Show/hide back to top button
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
          backToTopBtn.style.display = 'flex';
        } else {
          backToTopBtn.style.display = 'none';
        }
      });
    }
  }

  setupZoomControls() {
    const zoomLevel = document.getElementById('zoomLevel');
    const previewCanvas = document.getElementById('previewCanvas');
    
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetZoomBtn = document.getElementById('resetZoom');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.currentZoom = Math.min(this.currentZoom + 25, 200);
        this.updateZoom(this.currentZoom, zoomLevel, previewCanvas);
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.currentZoom = Math.max(this.currentZoom - 25, 50);
        this.updateZoom(this.currentZoom, zoomLevel, previewCanvas);
      });
    }

    if (resetZoomBtn) {
      resetZoomBtn.addEventListener('click', () => {
        this.currentZoom = 100;
        this.updateZoom(this.currentZoom, zoomLevel, previewCanvas);
      });
    }
  }

  updateZoom(zoom, zoomLevel, canvas) {
    if (zoomLevel) {
      zoomLevel.textContent = `${zoom}%`;
    }
    if (canvas) {
      canvas.style.transform = `scale(${zoom / 100})`;
      canvas.style.transformOrigin = 'center';
    }
  }

  setupFileUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('pdfUpload');
    
    if (!uploadZone || !fileInput) return;

    // Click handler
    uploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    // Keyboard handler
    uploadZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    // Drag and drop handlers
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
      } else {
        showError('Please drop a valid PDF file');
      }
    });
  }

  setupBatchProcessing() {
    const batchUploadZone = document.getElementById('batchUploadZone');
    const batchUpload = document.getElementById('batchUpload');
    const startBatchBtn = document.getElementById('startBatchButton');

    if (batchUploadZone && batchUpload) {
      // Click handler
      batchUploadZone.addEventListener('click', () => {
        batchUpload.click();
      });

      // File selection handler
      batchUpload.addEventListener('change', (e) => {
        this.handleBatchUpload(e.target.files);
      });

      // Drag and drop handlers
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        batchUploadZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        batchUploadZone.addEventListener(eventName, () => {
          batchUploadZone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        batchUploadZone.addEventListener(eventName, () => {
          batchUploadZone.classList.remove('drag-over');
        });
      });

      batchUploadZone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
        if (files.length > 0) {
          this.handleBatchUpload(files);
        } else {
          showError('Please drop valid PDF files');
        }
      });
    }

    if (startBatchBtn) {
      startBatchBtn.addEventListener('click', () => {
        this.startBatchProcessing();
      });
    }
  }

  setupProgressHandling() {
    this.pdfConverter.onProgress((current, total, message) => {
      this.updateProgressBar(current, total, message);
    });
  }

  setupUI() {
    // Initialize particles if available
    if (typeof particlesJS !== 'undefined') {
      particlesJS('particles-js', {
        particles: {
          number: { value: 50, density: { enable: true, value_area: 800 } },
          color: { value: ['#6200ea', '#059992', '#ff6b6b'] },
          shape: { type: 'circle' },
          opacity: {
            value: 0.4,
            random: true,
            anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false },
          },
          size: {
            value: 3,
            random: true,
            anim: { enable: true, speed: 20, size_min: 0.1, sync: false },
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: '#ffffff',
            opacity: 0.2,
            width: 1,
          },
          move: {
            enable: true,
            speed: 1,
            direction: 'none',
            random: false,
            straight: false,
            out_mode: 'out',
            bounce: false,
          },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: true, mode: 'repulse' },
            onclick: { enable: true, mode: 'push' },
            resize: true,
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
            push: { particles_nb: 2 },
          },
        },
        retina_detect: true,
      });
    }

    // Setup tab functionality
    this.setupTabs();
  }

  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Remove active class from all tabs and contents
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        });
        tabContents.forEach(content => {
          content.classList.remove('active');
        });
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  async handleFileUpload(file) {
    if (!file) return;

    const loadingElement = document.getElementById('loading');
    
    try {
      this.validateFile(file);
      showLoading(loadingElement);
      
      await this.pdfLoader.loadFromFile(file);
      await this.generateThumbnails();
      
      showMessage('PDF loaded successfully! Generate a preview to see the dark mode effect.');
      
      // Enable preview and convert buttons
      const previewBtn = document.getElementById('generatePreviewButton');
      const convertBtn = document.getElementById('convertButton');
      if (previewBtn) previewBtn.disabled = false;
      if (convertBtn) convertBtn.disabled = false;
      
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading(loadingElement);
    }
  }

  handleBatchUpload(files) {
    if (!files || files.length === 0) return;

    this.batchFiles = Array.from(files);
    
    // Update UI
    const batchUploadZone = document.getElementById('batchUploadZone');
    const startBatchBtn = document.getElementById('startBatchButton');
    
    if (batchUploadZone) {
      batchUploadZone.innerHTML = `
        <div class="upload-icon">
          <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="upload-text">${files.length} PDF files selected</div>
        <div class="upload-subtext">Click to select different files</div>
      `;
    }
    
    if (startBatchBtn) {
      startBatchBtn.disabled = false;
    }
    
    showMessage(`${files.length} PDF files added to batch queue`);
  }

  async startBatchProcessing() {
    if (this.batchFiles.length === 0) {
      showError('No files selected for batch processing');
      return;
    }

    if (this.isProcessing) {
      showError('Batch processing is already in progress');
      return;
    }

    this.isProcessing = true;
    const loadingElement = document.getElementById('loading');
    const batchStatus = document.getElementById('batchStatus');
    const batchResults = document.getElementById('batchResults');
    
    try {
      showLoading(loadingElement);
      
      if (batchStatus) {
        batchStatus.style.display = 'block';
        batchStatus.innerHTML = `
          <h4>Processing ${this.batchFiles.length} files...</h4>
          <div class="batch-progress">
            <div class="progress-bar" style="width: 0%"></div>
          </div>
        `;
      }

      const settings = this.getBatchSettings();
      const results = [];
      
      for (let i = 0; i < this.batchFiles.length; i++) {
        const file = this.batchFiles[i];
        const progress = ((i + 1) / this.batchFiles.length) * 100;
        
        this.updateProgressBar(i + 1, this.batchFiles.length, `Processing ${file.name}`);
        
        if (batchStatus) {
          const progressBar = batchStatus.querySelector('.progress-bar');
          if (progressBar) {
            progressBar.style.width = `${progress}%`;
          }
        }
        
        try {
          await this.pdfLoader.loadFromFile(file);
          const pdfDoc = this.pdfLoader.getCurrentDocument();
          
          if (settings.convertToDarkMode) {
            const convertedBytes = await this.pdfConverter.convertToDarkMode(pdfDoc, settings.themeSettings);
            this.downloadPDF(convertedBytes, `dark_${file.name}`);
          }
          
          results.push({ file: file.name, success: true });
        } catch (error) {
          results.push({ file: file.name, success: false, error: error.message });
        }
      }
      
      // Show results
      if (batchResults) {
        batchResults.style.display = 'block';
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        batchResults.innerHTML = `
          <h4>Batch Processing Complete</h4>
          <p>Successfully processed: ${successful} files</p>
          <p>Failed: ${failed} files</p>
        `;
      }
      
      showMessage(`Batch processing complete: ${results.filter(r => r.success).length} successful, ${results.filter(r => !r.success).length} failed`);
      
    } catch (error) {
      showError(`Batch processing failed: ${error.message}`);
    } finally {
      hideLoading(loadingElement);
      this.isProcessing = false;
    }
  }

  getBatchSettings() {
    const darkModeCheck = document.getElementById('batchDarkMode');
    const compressCheck = document.getElementById('batchCompress');
    const metadataCheck = document.getElementById('batchRemoveMetadata');
    const watermarkCheck = document.getElementById('batchWatermark');
    const watermarkText = document.getElementById('batchWatermarkText');

    return {
      convertToDarkMode: darkModeCheck ? darkModeCheck.checked : false,
      compress: compressCheck ? compressCheck.checked : false,
      removeMetadata: metadataCheck ? metadataCheck.checked : false,
      addWatermark: watermarkCheck ? watermarkCheck.checked : false,
      watermarkText: watermarkText ? watermarkText.value : '',
      themeSettings: this.getThemeSettings()
    };
  }

  validateFile(file) {
    if (!file) {
      throw new Error('No file selected');
    }

    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please select a PDF file.');
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File too large. Please select a file smaller than 50MB.');
    }

    return true;
  }

  async generateThumbnails() {
    const pdfDoc = this.pdfLoader.getCurrentDocument();
    if (!pdfDoc) return;

    try {
      const thumbnails = await this.pdfRenderer.generateThumbnails(pdfDoc);
      const thumbnailsContainer = document.getElementById('thumbnails');
      
      if (thumbnailsContainer) {
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
              // Update active thumbnail
              thumbnailsContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
              thumbnail.classList.add('active');
            });

            thumbnailsContainer.appendChild(thumbnail);
          }
        });
      }
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
      
      const previewSection = document.getElementById('preview');
      if (previewSection) {
        previewSection.style.display = 'block';
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
    } catch (error) {
      showError(`Failed to generate preview: ${error.message}`);
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
      
      // Show download section
      const downloadSection = document.getElementById('downloadSection');
      if (downloadSection) {
        downloadSection.style.display = 'block';
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
    } catch (error) {
      showError(`Conversion failed: ${error.message}`);
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
      
      const start = parseInt(startPage, 10);
      const end = parseInt(endPage, 10);
      
      if (isNaN(start) || isNaN(end) || start < 1 || end < 1 || start > end) {
        throw new Error('Please enter valid page numbers');
      }
      
      if (start > pdfDoc.getPageCount() || end > pdfDoc.getPageCount()) {
        throw new Error(`Page numbers cannot exceed ${pdfDoc.getPageCount()}`);
      }
      
      const splitPdfDoc = await window.PDFLib.PDFDocument.create();
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

    const loadingElement = document.getElementById('loading');

    try {
      showLoading(loadingElement);
      
      const mergedPdfDoc = await window.PDFLib.PDFDocument.create();
      const fileNames = [];

      for (const file of pdfFiles) {
        this.validateFile(file);
        const fileArrayBuffer = await file.arrayBuffer();
        const pdfDoc = await window.PDFLib.PDFDocument.load(fileArrayBuffer);
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
    } finally {
      hideLoading(loadingElement);
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
      const rotationAngle = parseInt(angle, 10);
      
      if (isNaN(pageNum) || pageNum < 1 || pageNum > pdfDoc.getPageCount()) {
        throw new Error(`Page number must be between 1 and ${pdfDoc.getPageCount()}`);
      }

      const page = pdfDoc.getPage(pageNum - 1);
      page.setRotation(window.PDFLib.degrees(rotationAngle));

      const rotatedPdfBytes = await pdfDoc.save();
      this.downloadPDF(rotatedPdfBytes, 'rotated_pdf.pdf', 'rotateDownloadLink');
      
      showMessage('Page rotated successfully!');
    } catch (error) {
      showError(error.message);
    }
  }

  showDocumentInfo() {
    const pdfDoc = this.pdfLoader.getCurrentDocument();
    if (!pdfDoc) {
      showError('Please upload a PDF file first.');
      return;
    }

    const infoContainer = document.getElementById('documentInfo');
    if (!infoContainer) return;

    try {
      const info = {
        pageCount: pdfDoc.getPageCount(),
        title: pdfDoc.getTitle() || 'Untitled',
        author: pdfDoc.getAuthor() || 'Unknown',
        subject: pdfDoc.getSubject() || 'None',
        creator: pdfDoc.getCreator() || 'Unknown',
        producer: pdfDoc.getProducer() || 'Unknown'
      };

      infoContainer.innerHTML = `
        <div class="info-item"><strong>Pages:</strong> ${info.pageCount}</div>
        <div class="info-item"><strong>Title:</strong> ${info.title}</div>
        <div class="info-item"><strong>Author:</strong> ${info.author}</div>
        <div class="info-item"><strong>Subject:</strong> ${info.subject}</div>
        <div class="info-item"><strong>Creator:</strong> ${info.creator}</div>
        <div class="info-item"><strong>Producer:</strong> ${info.producer}</div>
      `;
      
      infoContainer.style.display = 'block';
      showMessage('Document information displayed');
    } catch (error) {
      showError('Failed to get document information');
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
      
      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
        compress: true,
        optimizeForSize: true
      });
      
      this.downloadPDF(compressedBytes, 'compressed.pdf');
      showMessage('PDF compressed successfully!');
    } catch (error) {
      showError(`Failed to compress PDF: ${error.message}`);
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
      
      // Clear metadata
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      
      const cleanedBytes = await pdfDoc.save();
      this.downloadPDF(cleanedBytes, 'no_metadata.pdf');
      showMessage('Metadata removed successfully!');
    } catch (error) {
      showError(`Failed to remove metadata: ${error.message}`);
    } finally {
      hideLoading(loadingElement);
    }
  }

  async addWatermark() {
    if (!this.pdfLoader.isDocumentLoaded()) {
      showError('Please upload a PDF file first.');
      return;
    }

    const watermarkText = document.getElementById('watermarkText').value;
    if (!watermarkText.trim()) {
      showError('Please enter watermark text');
      return;
    }

    const loadingElement = document.getElementById('loading');

    try {
      showLoading(loadingElement);
      const pdfDoc = this.pdfLoader.getCurrentDocument();
      const opacity = parseInt(document.getElementById('watermarkOpacity').value) / 100;
      const rotation = parseInt(document.getElementById('watermarkRotation').value);
      
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 2,
          y: height / 2,
          size: 50,
          color: window.PDFLib.rgb(0.5, 0.5, 0.5),
          opacity: opacity,
          rotate: window.PDFLib.degrees(rotation)
        });
      });
      
      const watermarkedBytes = await pdfDoc.save();
      this.downloadPDF(watermarkedBytes, 'watermarked.pdf');
      showMessage('Watermark added successfully!');
    } catch (error) {
      showError(`Failed to add watermark: ${error.message}`);
    } finally {
      hideLoading(loadingElement);
    }
  }

  getThemeSettings() {
    const themeSelect = document.getElementById('themeSelect');
    const brightnessInput = document.getElementById('brightness');
    const contrastInput = document.getElementById('contrast');

    return {
      theme: themeSelect ? themeSelect.value : 'dark',
      brightness: brightnessInput ? parseInt(brightnessInput.value, 10) : 100,
      contrast: contrastInput ? parseInt(contrastInput.value, 10) : 100,
      scale: 1.5
    };
  }

  displayPreview(canvas) {
    const previewCanvas = document.getElementById('previewCanvas');
    if (!previewCanvas) return;

    const context = previewCanvas.getContext('2d');
    
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    context.drawImage(canvas, 0, 0);
    
    // Apply current zoom
    this.updateZoom(this.currentZoom, document.getElementById('zoomLevel'), previewCanvas);
  }

  downloadPDF(pdfBytes, filename, linkId = 'downloadLink') {
    try {
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Update the visible download link
      const visibleLink = document.getElementById(linkId);
      if (visibleLink) {
        visibleLink.href = url;
        visibleLink.download = filename;
        visibleLink.style.display = 'inline-block';
        visibleLink.textContent = `Download ${filename}`;
      }
      
      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);
      
    } catch (error) {
      console.error('Download error:', error);
      showError('Failed to download PDF. Please try again.');
    }
  }

  updateProgressBar(current, total, message) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      const percentage = (current / total) * 100;
      progressBar.style.width = `${percentage}%`;
      progressBar.setAttribute('aria-valuenow', percentage.toString());
      progressBar.setAttribute('aria-valuetext', message);
    }

    // Update loading message if visible
    const loadingMessage = document.getElementById('loadingMessage');
    const loadingProgress = document.getElementById('loadingProgress');
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
    if (loadingProgress) {
      loadingProgress.textContent = `${current} of ${total}`;
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LitasDarkApp();
});

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showError('An unexpected error occurred. Please refresh the page.');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showError('An unexpected error occurred. Please try again.');
  event.preventDefault();
});
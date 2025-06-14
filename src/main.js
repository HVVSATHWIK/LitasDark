/**
 * LitasDark PDF Converter - Main Entry Point
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
    
    this.initializeApp();
  }

  initializeApp() {
    this.setupEventListeners();
    this.setupProgressHandling();
    this.setupFileUpload();
    this.setupUI();
    
    console.log('LitasDark application initialized successfully');
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

    // Range input value display
    this.setupRangeInputs();

    // Back to top button
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      // Show/hide back to top button
      window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
          backToTopBtn.style.display = 'block';
        } else {
          backToTopBtn.style.display = 'none';
        }
      });
    }

    // Zoom controls
    this.setupZoomControls();
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
    const fileInput = document.getElementById('pdfUpload');
    if (!fileInput) return;

    // Create enhanced upload zone
    const uploadZone = this.createUploadZone(fileInput);
    
    // Replace the original input with enhanced zone
    const parent = fileInput.parentElement;
    if (parent) {
      parent.insertBefore(uploadZone, fileInput);
      fileInput.style.display = 'none';
    }
  }

  createUploadZone(fileInput) {
    const zone = document.createElement('div');
    zone.className = 'upload-zone';
    zone.setAttribute('role', 'button');
    zone.setAttribute('tabindex', '0');
    zone.setAttribute('aria-label', 'Upload PDF file');

    zone.innerHTML = `
      <div class="upload-icon">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
      </div>
      <div class="upload-text">Click to upload or drag and drop</div>
      <div class="upload-subtext">PDF files up to 50MB</div>
    `;

    // Click handler
    zone.addEventListener('click', () => {
      fileInput.click();
    });

    // Keyboard handler
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    // Drag and drop handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      zone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      zone.addEventListener(eventName, () => {
        zone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      zone.addEventListener(eventName, () => {
        zone.classList.remove('drag-over');
      });
    });

    zone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type === 'application/pdf') {
        fileInput.files = files;
        this.handleFileUpload(files[0]);
      } else {
        showError('Please drop a valid PDF file');
      }
    });

    return zone;
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
          content.style.display = 'none';
        });
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        
        const targetContent = document.getElementById(targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
          targetContent.style.display = 'block';
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
      
      // Enable preview button
      const previewBtn = document.getElementById('generatePreviewButton');
      if (previewBtn) {
        previewBtn.disabled = false;
      }
      
    } catch (error) {
      showError(error.message);
    } finally {
      hideLoading(loadingElement);
    }
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
      
      // Enable convert button
      const convertBtn = document.getElementById('convertButton');
      if (convertBtn) {
        convertBtn.disabled = false;
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

  downloadPDF(pdfBytes, filename) {
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
      const visibleLink = document.getElementById('downloadLink');
      if (visibleLink) {
        visibleLink.href = url;
        visibleLink.download = filename;
        visibleLink.style.display = 'inline-block';
        visibleLink.textContent = `Download ${filename}`;
      }
      
      // Clean up URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 5000);
      
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
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for external libraries to load
  const initApp = () => {
    if (window.PDFLib && window.pdfjsLib) {
      new LitasDarkApp();
    } else {
      setTimeout(initApp, 100);
    }
  };
  
  initApp();
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
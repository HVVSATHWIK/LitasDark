export class ModernUIController {
  constructor() {
    this.toastContainer = null;
    this.activeModals = new Set();
    this.initializeToastContainer();
    this.setupGlobalEventListeners();
    this.enhanceExistingElements();
  }

  initializeToastContainer() {
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    this.toastContainer.setAttribute('aria-live', 'polite');
    this.toastContainer.setAttribute('aria-label', 'Notifications');
    document.body.appendChild(this.toastContainer);
  }

  setupGlobalEventListeners() {
    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTopModal();
      }
    });

    // Enhanced focus management
    document.addEventListener('focusin', (e) => {
      const target = e.target;
      if (target.matches('.btn, .form-input, .form-select')) {
        target.classList.add('focus-visible');
      }
    });

    document.addEventListener('focusout', (e) => {
      const target = e.target;
      target.classList.remove('focus-visible');
    });

    // Enhanced drag and drop
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      const uploadZone = document.querySelector('.upload-zone');
      if (uploadZone) {
        uploadZone.classList.add('drag-over');
      }
    });

    document.addEventListener('dragleave', (e) => {
      if (!e.relatedTarget) {
        const uploadZone = document.querySelector('.upload-zone');
        if (uploadZone) {
          uploadZone.classList.remove('drag-over');
        }
      }
    });

    document.addEventListener('drop', (e) => {
      e.preventDefault();
      const uploadZone = document.querySelector('.upload-zone');
      if (uploadZone) {
        uploadZone.classList.remove('drag-over');
      }
    });
  }

  enhanceExistingElements() {
    // Enhance buttons
    document.querySelectorAll('button').forEach(button => {
      if (!button.className.includes('btn')) {
        button.classList.add('btn', 'btn-primary');
      }
    });

    // Enhance form inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
      if (!input.className.includes('form-')) {
        if (input.tagName === 'SELECT') {
          input.classList.add('form-input', 'form-select');
        } else {
          input.classList.add('form-input');
        }
      }
    });

    // Enhance file upload areas
    this.enhanceFileUpload();
  }

  enhanceFileUpload() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      const wrapper = this.createUploadZone(input);
      input.parentNode?.insertBefore(wrapper, input);
      input.style.display = 'none';
    });
  }

  createUploadZone(input) {
    const zone = document.createElement('div');
    zone.className = 'upload-zone';
    zone.setAttribute('role', 'button');
    zone.setAttribute('tabindex', '0');
    zone.setAttribute('aria-label', 'Upload file');

    zone.innerHTML = `
      <div class="upload-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
        </svg>
      </div>
      <div class="upload-text">Click to upload or drag and drop</div>
      <div class="upload-subtext">PDF files up to 50MB</div>
    `;

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        input.click();
      }
    });

    return zone;
  }

  showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');

    const icons = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-title">${icons[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}</span>
        <button class="toast-close" aria-label="Close notification">✕</button>
      </div>
      <div class="toast-message">${message}</div>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.removeToast(toast));

    this.toastContainer.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
      if (toast.parentNode) {
        this.removeToast(toast);
      }
    }, duration);
  }

  removeToast(toast) {
    toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => {
      if (toast.parentNode) {
        this.toastContainer.removeChild(toast);
      }
    }, 300);
  }

  showModal(content, title = '', actions = []) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');

    const modal = document.createElement('div');
    modal.className = 'modal';

    let actionsHTML = '';
    if (actions.length > 0) {
      actionsHTML = `
        <div class="modal-footer">
          ${actions.map((action, index) => 
            `<button class="btn ${action.type || 'btn-primary'}" data-action="${index}">${action.text}</button>`
          ).join('')}
        </div>
      `;
    }

    modal.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title" id="modal-title">${title}</h2>
        <button class="btn btn-ghost btn-icon modal-close" aria-label="Close modal">✕</button>
      </div>
      <div class="modal-content">${content}</div>
      ${actionsHTML}
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    this.activeModals.add(overlay);

    // Setup event listeners
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => this.closeModal(overlay));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeModal(overlay);
      }
    });

    // Setup action buttons
    actions.forEach((action, index) => {
      const btn = modal.querySelector(`[data-action="${index}"]`);
      if (btn) {
        btn.addEventListener('click', () => {
          action.action();
          this.closeModal(overlay);
        });
      }
    });

    // Focus management
    const firstFocusable = modal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    return overlay;
  }

  closeModal(modal) {
    modal.style.animation = 'fadeOut 0.2s ease-in forwards';
    setTimeout(() => {
      if (modal.parentNode) {
        document.body.removeChild(modal);
        this.activeModals.delete(modal);
      }
    }, 200);
  }

  closeTopModal() {
    if (this.activeModals.size > 0) {
      const topModal = Array.from(this.activeModals).pop();
      if (topModal) {
        this.closeModal(topModal);
      }
    }
  }

  showProgress(current, total, message = '') {
    let progressContainer = document.querySelector('.progress-display');
    
    if (!progressContainer) {
      progressContainer = document.createElement('div');
      progressContainer.className = 'progress-display card';
      progressContainer.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        min-width: 20rem;
      `;
      document.body.appendChild(progressContainer);
    }

    const percentage = Math.round((current / total) * 100);
    
    progressContainer.innerHTML = `
      <div class="card-content">
        <div style="margin-bottom: 0.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-weight: 500;">${message}</span>
            <span style="font-size: 0.875rem; color: var(--gray-600);">${percentage}%</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar" style="width: ${percentage}%"></div>
          </div>
        </div>
        <div style="font-size: 0.75rem; color: var(--gray-500);">
          ${current} of ${total} completed
        </div>
      </div>
    `;

    if (current >= total) {
      setTimeout(() => {
        if (progressContainer && progressContainer.parentNode) {
          progressContainer.style.animation = 'fadeOut 0.3s ease-in forwards';
          setTimeout(() => {
            if (progressContainer.parentNode) {
              document.body.removeChild(progressContainer);
            }
          }, 300);
        }
      }, 2000);
    }
  }

  createLoadingState(element, text = 'Loading...') {
    const originalContent = element.innerHTML;
    const originalDisabled = element.disabled;

    element.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <div class="loading-spinner"></div>
        <span>${text}</span>
      </div>
    `;

    if (element.tagName === 'BUTTON') {
      element.disabled = true;
    }

    return () => {
      element.innerHTML = originalContent;
      if (element.tagName === 'BUTTON') {
        element.disabled = originalDisabled;
      }
    };
  }

  enhanceAccessibility() {
    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--primary-600);
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main content landmark
    const main = document.querySelector('main');
    if (main && !main.id) {
      main.id = 'main-content';
    }

    // Enhance form labels
    document.querySelectorAll('input, select, textarea').forEach(input => {
      if (!input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const label = document.querySelector(`label[for="${input.id}"]`);
        if (!label && input.id) {
          const wrapper = input.closest('.form-group');
          if (wrapper) {
            const labelText = wrapper.querySelector('.form-label');
            if (labelText) {
              input.setAttribute('aria-label', labelText.textContent || '');
            }
          }
        }
      }
    });
  }
}

// CSS animations for toast removal
const style = document.createElement('style');
style.textContent = `
  @keyframes slideOutRight {
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @keyframes fadeOut {
    to {
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
export class AccessibilityManager {
  private announcer: HTMLElement;
  private focusHistory: HTMLElement[] = [];
  private keyboardNavigation: boolean = false;

  constructor() {
    this.createScreenReaderAnnouncer();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupARIALabels();
    this.detectAccessibilityPreferences();
  }

  private createScreenReaderAnnouncer(): void {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.announcer);
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      this.announcer.textContent = '';
    }, 1000);
  }

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (e) => {
      this.keyboardNavigation = true;
      document.body.classList.add('keyboard-navigation');
      
      switch (e.key) {
        case 'Tab':
          this.handleTabNavigation(e);
          break;
        case 'Escape':
          this.handleEscapeKey(e);
          break;
        case 'Enter':
        case ' ':
          this.handleActivation(e);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(e);
          break;
      }
    });

    document.addEventListener('mousedown', () => {
      this.keyboardNavigation = false;
      document.body.classList.remove('keyboard-navigation');
    });

    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'o':
            e.preventDefault();
            this.triggerFileUpload();
            break;
          case 'p':
            e.preventDefault();
            this.triggerPreview();
            break;
          case 'd':
            e.preventDefault();
            this.triggerConversion();
            break;
          case 's':
            e.preventDefault();
            this.triggerSave();
            break;
          case '/':
            e.preventDefault();
            this.showKeyboardShortcuts();
            break;
        }
      }
    });
  }

  private handleTabNavigation(e: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    
    if (e.shiftKey) {
      // Shift+Tab - previous element
      if (currentIndex <= 0) {
        e.preventDefault();
        focusableElements[focusableElements.length - 1]?.focus();
      }
    } else {
      // Tab - next element
      if (currentIndex >= focusableElements.length - 1) {
        e.preventDefault();
        focusableElements[0]?.focus();
      }
    }
  }

  private handleEscapeKey(e: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
      activeModal.classList.remove('active');
      this.restoreFocus();
      return;
    }

    const activeDropdown = document.querySelector('.dropdown.active');
    if (activeDropdown) {
      activeDropdown.classList.remove('active');
      return;
    }

    // Return focus to main content
    const mainContent = document.querySelector('main');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
    }
  }

  private handleActivation(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    
    if (target.getAttribute('role') === 'button' || target.classList.contains('clickable')) {
      e.preventDefault();
      target.click();
    }
  }

  private handleArrowNavigation(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    
    // Handle tab navigation with arrow keys
    if (target.getAttribute('role') === 'tab') {
      e.preventDefault();
      const tabs = Array.from(document.querySelectorAll('[role="tab"]')) as HTMLElement[];
      const currentIndex = tabs.indexOf(target);
      
      let nextIndex;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      } else {
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      }
      
      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = `
      button:not([disabled]),
      [href],
      input:not([disabled]),
      select:not([disabled]),
      textarea:not([disabled]),
      [tabindex]:not([tabindex="-1"]),
      [role="button"]:not([disabled]),
      [role="tab"]:not([disabled])
    `;
    
    return Array.from(document.querySelectorAll(selector))
      .filter(el => this.isVisible(el)) as HTMLElement[];
  }

  private isVisible(element: Element): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  private setupFocusManagement(): void {
    // Track focus for restoration
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target && target !== document.body) {
        this.focusHistory.push(target);
        if (this.focusHistory.length > 10) {
          this.focusHistory.shift();
        }
      }
    });

    // Add focus indicators
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-navigation *:focus {
        outline: 3px solid var(--accent-color) !important;
        outline-offset: 2px !important;
      }
      
      .keyboard-navigation button:focus,
      .keyboard-navigation input:focus,
      .keyboard-navigation select:focus {
        box-shadow: 0 0 0 3px rgba(98, 0, 234, 0.3) !important;
      }
    `;
    document.head.appendChild(style);
  }

  private setupARIALabels(): void {
    // Add missing ARIA labels
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach((button, index) => {
      const text = button.textContent?.trim();
      if (!text) {
        button.setAttribute('aria-label', `Button ${index + 1}`);
      }
    });

    // Add ARIA landmarks
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
    }

    const nav = document.querySelector('.feature-tabs');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
      nav.setAttribute('aria-label', 'Feature navigation');
    }

    // Add ARIA live regions
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.setAttribute('aria-live', 'polite');
      progressBar.setAttribute('aria-label', 'Processing progress');
    }
  }

  private detectAccessibilityPreferences(): void {
    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduce-motion');
      this.announce('Reduced motion mode detected');
    }

    // Detect high contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.body.classList.add('high-contrast');
      this.announce('High contrast mode detected');
    }

    // Detect color scheme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('prefers-dark');
    }
  }

  public saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusHistory.push(activeElement);
    }
  }

  public restoreFocus(): void {
    const lastFocused = this.focusHistory.pop();
    if (lastFocused && this.isVisible(lastFocused)) {
      lastFocused.focus();
    }
  }

  private triggerFileUpload(): void {
    const fileInput = document.getElementById('pdfUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
      this.announce('File upload dialog opened');
    }
  }

  private triggerPreview(): void {
    const previewButton = document.getElementById('generatePreviewButton') as HTMLButtonElement;
    if (previewButton && !previewButton.disabled) {
      previewButton.click();
      this.announce('Generating preview');
    }
  }

  private triggerConversion(): void {
    const convertButton = document.getElementById('convertButton') as HTMLButtonElement;
    if (convertButton && !convertButton.disabled) {
      convertButton.click();
      this.announce('Starting conversion to dark mode');
    }
  }

  private triggerSave(): void {
    const downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement;
    if (downloadLink && downloadLink.style.display !== 'none') {
      downloadLink.click();
      this.announce('Downloading converted PDF');
    }
  }

  private showKeyboardShortcuts(): void {
    const shortcuts = `
      Keyboard Shortcuts:
      Ctrl+O: Upload file
      Ctrl+P: Generate preview
      Ctrl+D: Convert to dark mode
      Ctrl+S: Download converted PDF
      Escape: Close dialogs
      Tab: Navigate forward
      Shift+Tab: Navigate backward
      Arrow keys: Navigate tabs
      Enter/Space: Activate buttons
    `;
    
    this.announce(shortcuts, 'assertive');
    
    // Also show visual shortcuts dialog
    this.createShortcutsDialog();
  }

  private createShortcutsDialog(): void {
    const dialog = document.createElement('div');
    dialog.className = 'shortcuts-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-labelledby', 'shortcuts-title');
    dialog.setAttribute('aria-modal', 'true');
    
    dialog.innerHTML = `
      <div class="shortcuts-content">
        <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
        <div class="shortcuts-list">
          <div class="shortcut-item">
            <kbd>Ctrl+O</kbd>
            <span>Upload file</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl+P</kbd>
            <span>Generate preview</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl+D</kbd>
            <span>Convert to dark mode</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl+S</kbd>
            <span>Download converted PDF</span>
          </div>
          <div class="shortcut-item">
            <kbd>Escape</kbd>
            <span>Close dialogs</span>
          </div>
          <div class="shortcut-item">
            <kbd>Tab</kbd>
            <span>Navigate forward</span>
          </div>
          <div class="shortcut-item">
            <kbd>Shift+Tab</kbd>
            <span>Navigate backward</span>
          </div>
        </div>
        <button class="close-shortcuts" aria-label="Close shortcuts dialog">Close</button>
      </div>
    `;

    document.body.appendChild(dialog);
    
    // Focus the dialog
    const closeButton = dialog.querySelector('.close-shortcuts') as HTMLButtonElement;
    closeButton.focus();
    
    // Close on button click or escape
    closeButton.addEventListener('click', () => {
      dialog.remove();
      this.restoreFocus();
    });
    
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dialog.remove();
        this.restoreFocus();
      }
    });
  }

  public updateProgress(current: number, total: number, message: string): void {
    const percentage = Math.round((current / total) * 100);
    this.announce(`${message}. ${percentage}% complete.`);
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', percentage.toString());
      progressBar.setAttribute('aria-valuetext', `${percentage}% - ${message}`);
    }
  }

  public announceError(error: string): void {
    this.announce(`Error: ${error}`, 'assertive');
  }

  public announceSuccess(message: string): void {
    this.announce(`Success: ${message}`, 'polite');
  }

  public cleanup(): void {
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer);
    }
    this.focusHistory = [];
  }
}
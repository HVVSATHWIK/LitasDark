export class MobileOptimizedUI {
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private isSwipeEnabled: boolean = true;
  private swipeThreshold: number = 50;

  constructor() {
    this.initializeMobileFeatures();
    this.setupTouchGestures();
    this.setupResponsiveLayout();
  }

  private initializeMobileFeatures(): void {
    // Add viewport meta tag if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
      document.head.appendChild(viewport);
    }

    // Prevent zoom on double tap
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });

    // Add mobile-specific CSS classes
    document.body.classList.add('mobile-optimized');
    
    // Detect mobile device
    if (this.isMobileDevice()) {
      document.body.classList.add('is-mobile');
      this.setupMobileSpecificFeatures();
    }
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  private setupMobileSpecificFeatures(): void {
    // Add pull-to-refresh functionality
    this.setupPullToRefresh();
    
    // Add bottom sheet for mobile actions
    this.createMobileActionSheet();
    
    // Optimize file upload for mobile
    this.optimizeMobileFileUpload();
    
    // Add haptic feedback if available
    this.setupHapticFeedback();
  }

  private setupTouchGestures(): void {
    const previewContainer = document.getElementById('preview');
    if (!previewContainer) return;

    previewContainer.addEventListener('touchstart', (e) => {
      if (!this.isSwipeEnabled) return;
      
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    previewContainer.addEventListener('touchend', (e) => {
      if (!this.isSwipeEnabled) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;
      
      // Check if it's a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.swipeThreshold) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
    }, { passive: true });

    // Pinch to zoom
    let initialDistance = 0;
    let currentScale = 1;

    previewContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        initialDistance = this.getDistance(e.touches[0], e.touches[1]);
      }
    }, { passive: true });

    previewContainer.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / initialDistance;
        currentScale = Math.min(Math.max(scale, 0.5), 3);
        
        const canvas = previewContainer.querySelector('canvas');
        if (canvas) {
          canvas.style.transform = `scale(${currentScale})`;
        }
      }
    });
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private handleSwipeLeft(): void {
    // Navigate to next page
    const nextButton = document.getElementById('nextComparisonPage');
    if (nextButton) {
      nextButton.click();
      this.triggerHapticFeedback('light');
    }
  }

  private handleSwipeRight(): void {
    // Navigate to previous page
    const prevButton = document.getElementById('prevComparisonPage');
    if (prevButton) {
      prevButton.click();
      this.triggerHapticFeedback('light');
    }
  }

  private setupPullToRefresh(): void {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    const threshold = 100;

    document.addEventListener('touchstart', (e) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (!isPulling) return;
      
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > 0 && window.scrollY === 0) {
        e.preventDefault();
        
        // Visual feedback
        const pullIndicator = this.getPullIndicator();
        pullIndicator.style.transform = `translateY(${Math.min(pullDistance, threshold)}px)`;
        pullIndicator.style.opacity = `${Math.min(pullDistance / threshold, 1)}`;
        
        if (pullDistance > threshold) {
          pullIndicator.classList.add('ready-to-refresh');
        } else {
          pullIndicator.classList.remove('ready-to-refresh');
        }
      }
    });

    document.addEventListener('touchend', () => {
      if (!isPulling) return;
      
      const pullDistance = currentY - startY;
      const pullIndicator = this.getPullIndicator();
      
      if (pullDistance > threshold) {
        this.performRefresh();
      }
      
      // Reset
      pullIndicator.style.transform = 'translateY(0)';
      pullIndicator.style.opacity = '0';
      pullIndicator.classList.remove('ready-to-refresh');
      isPulling = false;
    });
  }

  private getPullIndicator(): HTMLElement {
    let indicator = document.getElementById('pull-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pull-indicator';
      indicator.innerHTML = '↓ Pull to refresh';
      indicator.style.cssText = `
        position: fixed;
        top: -50px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-color);
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1000;
      `;
      document.body.appendChild(indicator);
    }
    return indicator;
  }

  private performRefresh(): void {
    // Trigger refresh action
    window.location.reload();
  }

  private createMobileActionSheet(): void {
    const actionSheet = document.createElement('div');
    actionSheet.id = 'mobile-action-sheet';
    actionSheet.className = 'mobile-action-sheet';
    actionSheet.innerHTML = `
      <div class="action-sheet-content">
        <div class="action-sheet-header">
          <div class="action-sheet-handle"></div>
          <h3>Quick Actions</h3>
        </div>
        <div class="action-sheet-body">
          <button class="action-button" data-action="upload">
            📁 Upload PDF
          </button>
          <button class="action-button" data-action="convert">
            🌙 Convert to Dark Mode
          </button>
          <button class="action-button" data-action="preview">
            👁️ Generate Preview
          </button>
          <button class="action-button" data-action="settings">
            ⚙️ Settings
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(actionSheet);

    // Add event listeners
    actionSheet.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('action-button')) {
        const action = target.dataset.action;
        this.handleMobileAction(action!);
        this.hideMobileActionSheet();
      }
    });

    // Add swipe down to close
    let startY = 0;
    actionSheet.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    }, { passive: true });

    actionSheet.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 0) {
        actionSheet.style.transform = `translateY(${deltaY}px)`;
      }
    }, { passive: true });

    actionSheet.addEventListener('touchend', (e) => {
      const currentY = e.changedTouches[0].clientY;
      const deltaY = currentY - startY;
      
      if (deltaY > 100) {
        this.hideMobileActionSheet();
      } else {
        actionSheet.style.transform = 'translateY(0)';
      }
    }, { passive: true });
  }

  private handleMobileAction(action: string): void {
    switch (action) {
      case 'upload':
        document.getElementById('pdfUpload')?.click();
        break;
      case 'convert':
        document.getElementById('convertButton')?.click();
        break;
      case 'preview':
        document.getElementById('generatePreviewButton')?.click();
        break;
      case 'settings':
        this.showMobileSettings();
        break;
    }
  }

  public showMobileActionSheet(): void {
    const actionSheet = document.getElementById('mobile-action-sheet');
    if (actionSheet) {
      actionSheet.classList.add('active');
      this.triggerHapticFeedback('medium');
    }
  }

  private hideMobileActionSheet(): void {
    const actionSheet = document.getElementById('mobile-action-sheet');
    if (actionSheet) {
      actionSheet.classList.remove('active');
    }
  }

  private optimizeMobileFileUpload(): void {
    const fileInput = document.getElementById('pdfUpload') as HTMLInputElement;
    if (!fileInput) return;

    // Add accept attribute for better mobile file picker
    fileInput.accept = '.pdf,application/pdf';
    
    // Add capture attribute for camera access
    fileInput.setAttribute('capture', 'environment');

    // Create a more mobile-friendly upload button
    const uploadButton = document.createElement('button');
    uploadButton.className = 'mobile-upload-button';
    uploadButton.innerHTML = `
      <div class="upload-icon">📁</div>
      <div class="upload-text">Tap to Upload PDF</div>
    `;
    
    uploadButton.addEventListener('click', () => {
      fileInput.click();
    });

    // Replace the original input with the button
    fileInput.style.display = 'none';
    fileInput.parentNode?.insertBefore(uploadButton, fileInput.nextSibling);
  }

  private setupHapticFeedback(): void {
    // Check if haptic feedback is available
    if ('vibrate' in navigator) {
      this.triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy') => {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30]
        };
        navigator.vibrate(patterns[type]);
      };
    }
  }

  private triggerHapticFeedback(type: 'light' | 'medium' | 'heavy'): void {
    // Default implementation (overridden if haptic feedback is available)
  }

  private setupResponsiveLayout(): void {
    // Add responsive breakpoint classes
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      document.body.classList.remove('bp-xs', 'bp-sm', 'bp-md', 'bp-lg', 'bp-xl');
      
      if (width < 576) {
        document.body.classList.add('bp-xs');
      } else if (width < 768) {
        document.body.classList.add('bp-sm');
      } else if (width < 992) {
        document.body.classList.add('bp-md');
      } else if (width < 1200) {
        document.body.classList.add('bp-lg');
      } else {
        document.body.classList.add('bp-xl');
      }
    };

    updateBreakpoints();
    window.addEventListener('resize', updateBreakpoints);
  }

  private showMobileSettings(): void {
    // Create a mobile-optimized settings panel
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'mobile-settings-panel';
    settingsPanel.innerHTML = `
      <div class="settings-header">
        <button class="settings-close">✕</button>
        <h3>Settings</h3>
      </div>
      <div class="settings-content">
        <div class="setting-group">
          <label>Theme</label>
          <select id="mobile-theme-select">
            <option value="dark">Dark</option>
            <option value="darker">Darker</option>
            <option value="darkest">Darkest</option>
            <option value="sepia">Sepia</option>
            <option value="blue-light">Blue Light Filter</option>
          </select>
        </div>
        <div class="setting-group">
          <label>Brightness</label>
          <input type="range" id="mobile-brightness" min="50" max="150" value="100">
        </div>
        <div class="setting-group">
          <label>Contrast</label>
          <input type="range" id="mobile-contrast" min="50" max="150" value="100">
        </div>
      </div>
    `;

    document.body.appendChild(settingsPanel);
    settingsPanel.classList.add('active');

    // Close button
    settingsPanel.querySelector('.settings-close')?.addEventListener('click', () => {
      settingsPanel.remove();
    });
  }

  public enableSwipe(): void {
    this.isSwipeEnabled = true;
  }

  public disableSwipe(): void {
    this.isSwipeEnabled = false;
  }
}
/**
 * Enhanced Application Entry Point
 */

// Configure PDF.js worker source before any other imports
if (typeof window !== 'undefined' && window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';
}

import { EnhancedUIController } from './ui/enhancedUIController.js';
import { MobileOptimizedUI } from './components/mobileOptimized.js';
import { AccessibilityManager } from './components/accessibilityManager.js';
import { PerformanceMonitor } from './utils/performanceMonitor.js';
import { ErrorHandler } from './utils/errorHandler.js';
import { stateManager } from './core/stateManager.js';

class LitasDarkApp {
  private enhancedUI: EnhancedUIController;
  private mobileUI: MobileOptimizedUI;
  private accessibilityManager: AccessibilityManager;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      // Start performance monitoring
      PerformanceMonitor.startResourceMonitoring();
      
      // Initialize error handling
      this.setupGlobalErrorHandling();
      
      // Initialize core components
      await this.initializeComponents();
      
      // Setup service worker for offline functionality
      await this.registerServiceWorker();
      
      // Initialize theme based on user preference
      this.initializeTheme();
      
      // Setup cleanup handlers
      this.setupCleanupHandlers();
      
      this.isInitialized = true;
      console.log('LitasDark application initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.handleInitializationError(error as Error);
    }
  }

  private async initializeComponents(): Promise<void> {
    // Initialize UI controllers
    this.enhancedUI = new EnhancedUIController();
    this.mobileUI = new MobileOptimizedUI();
    this.accessibilityManager = new AccessibilityManager();
    
    // Make globally available for debugging
    (window as any).litasDark = {
      ui: this.enhancedUI,
      mobile: this.mobileUI,
      accessibility: this.accessibilityManager,
      state: stateManager,
      performance: PerformanceMonitor
    };
    
    // Setup state management
    this.setupStateManagement();
    
    // Initialize PWA features
    this.initializePWAFeatures();
  }

  private setupGlobalErrorHandling(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      const errorInfo = ErrorHandler.handleError(
        event.error || new Error(event.message),
        'global',
        'Uncaught error'
      );
      this.accessibilityManager?.announceError(errorInfo.message);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorInfo = ErrorHandler.handleError(
        new Error(event.reason),
        'global',
        'Unhandled promise rejection'
      );
      this.accessibilityManager?.announceError(errorInfo.message);
      event.preventDefault();
    });

    // Setup error reporting
    ErrorHandler.onError((errorInfo) => {
      // In production, you might want to send this to an error reporting service
      console.error('Application error:', errorInfo);
      
      // Show user-friendly error message
      this.showErrorNotification(errorInfo);
    });
  }

  private setupStateManagement(): void {
    // Subscribe to state changes
    stateManager.subscribe('stateChanged', (data) => {
      this.handleStateChange(data.previous, data.current);
    });

    // Subscribe to loading state changes
    stateManager.subscribe('stateChanged', (data) => {
      if (data.current.isLoading !== data.previous.isLoading) {
        this.handleLoadingStateChange(data.current.isLoading);
      }
    });
  }

  private handleStateChange(previousState: any, currentState: any): void {
    // Handle document changes
    if (previousState.currentDocument !== currentState.currentDocument) {
      if (currentState.currentDocument) {
        this.accessibilityManager.announce('PDF document loaded successfully');
      }
    }

    // Handle error changes
    if (previousState.error !== currentState.error) {
      if (currentState.error) {
        this.accessibilityManager.announceError(currentState.error);
      }
    }
  }

  private handleLoadingStateChange(isLoading: boolean): void {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      if (isLoading) {
        loadingElement.classList.remove('hidden');
        loadingElement.classList.add('visible');
      } else {
        loadingElement.classList.remove('visible');
        loadingElement.classList.add('hidden');
      }
    }
  }

  private initializeTheme(): void {
    const state = stateManager.getState();
    const preferredTheme = state.theme;
    
    // Apply theme based on user preference or system preference
    if (preferredTheme === 'auto') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.classList.toggle('dark-theme', systemPrefersDark);
    } else {
      document.body.classList.toggle('dark-theme', preferredTheme === 'dark');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (stateManager.getState().theme === 'auto') {
        document.body.classList.toggle('dark-theme', e.matches);
      }
    });
  }

  private initializePWAFeatures(): void {
    // Add to home screen prompt
    let deferredPrompt: any;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallPrompt();
    });

    // Handle app installation
    window.addEventListener('appinstalled', () => {
      this.accessibilityManager.announce('App installed successfully');
      deferredPrompt = null;
    });
  }

  private showInstallPrompt(): void {
    // Create install prompt UI
    const installBanner = document.createElement('div');
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
      <div class="install-content">
        <span>Install LitasDark for a better experience</span>
        <button id="install-button">Install</button>
        <button id="dismiss-install">Dismiss</button>
      </div>
    `;

    document.body.appendChild(installBanner);

    // Handle install button click
    document.getElementById('install-button')?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User ${outcome} the install prompt`);
        deferredPrompt = null;
      }
      installBanner.remove();
    });

    // Handle dismiss button click
    document.getElementById('dismiss-install')?.addEventListener('click', () => {
      installBanner.remove();
    });
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateAvailableNotification();
              }
            });
          }
        });
      } catch (error) {
        console.log('Service Worker registration failed:', error);
      }
    }
  }

  private showUpdateAvailableNotification(): void {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <span>A new version is available!</span>
        <button id="update-button">Update</button>
        <button id="dismiss-update">Later</button>
      </div>
    `;

    document.body.appendChild(notification);

    document.getElementById('update-button')?.addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('dismiss-update')?.addEventListener('click', () => {
      notification.remove();
    });
  }

  private showErrorNotification(errorInfo: any): void {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="error-icon">⚠️</div>
        <div class="error-details">
          <div class="error-message">${errorInfo.message}</div>
          <div class="error-actions">
            ${ErrorHandler.createRecoveryAction(errorInfo).map(action => 
              `<button class="recovery-action">${action}</button>`
            ).join('')}
          </div>
        </div>
        <button class="close-error">✕</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);

    // Handle close button
    notification.querySelector('.close-error')?.addEventListener('click', () => {
      notification.remove();
    });
  }

  private setupCleanupHandlers(): void {
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Cleanup on visibility change (mobile app backgrounding)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performMaintenanceTasks();
      }
    });

    // Periodic cleanup
    setInterval(() => {
      this.performMaintenanceTasks();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private performMaintenanceTasks(): void {
    // Clean up expired cache
    const storageManager = (stateManager as any).storageManager;
    if (storageManager) {
      storageManager.cleanupExpiredCache();
    }

    // Check performance issues
    const issues = PerformanceMonitor.checkPerformanceIssues();
    if (issues.length > 0) {
      console.warn('Performance issues detected:', issues);
    }

    // Clear old error logs
    const errorLog = ErrorHandler.getErrorLog();
    if (errorLog.length > 50) {
      ErrorHandler.clearErrorLog();
    }
  }

  private handleInitializationError(error: Error): void {
    // Show fallback UI
    document.body.innerHTML = `
      <div class="initialization-error">
        <h1>Failed to Initialize Application</h1>
        <p>We're sorry, but the application failed to start properly.</p>
        <p>Error: ${error.message}</p>
        <button onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }

  private cleanup(): void {
    if (!this.isInitialized) return;

    try {
      this.enhancedUI?.cleanup();
      this.accessibilityManager?.cleanup();
      PerformanceMonitor.cleanup();
      
      console.log('Application cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Public API
  public getState() {
    return stateManager.getState();
  }

  public getPerformanceReport() {
    return PerformanceMonitor.generateReport();
  }

  public getErrorLog() {
    return ErrorHandler.getErrorLog();
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LitasDarkApp();
});

// Export for global access
(window as any).LitasDarkApp = LitasDarkApp;
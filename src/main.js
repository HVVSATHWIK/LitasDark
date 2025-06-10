/**
 * Application Entry Point - Enhanced Version
 */
import { EnhancedUIController } from './ui/enhancedUIController.js';

// Initialize enhanced application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const enhancedUI = new EnhancedUIController();
  window.enhancedUI = enhancedUI; // Make globally available
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    enhancedUI.cleanup();
  });
});

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Could send to error reporting service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Service Worker registration for offline functionality (future enhancement)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // navigator.serviceWorker.register('/sw.js')
    //   .then(registration => console.log('SW registered'))
    //   .catch(error => console.log('SW registration failed'));
  });
}
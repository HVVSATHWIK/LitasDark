/**
 * Application Entry Point
 */
import { UIController } from './ui/uiController.js';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new UIController();
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
/**
 * Error Handling Utilities for LitasDark Application
 */
export class ErrorHandler {
  static errorLog = [];
  static maxLogSize = 100;

  /**
   * Handle PDF-specific errors
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   * @returns {Object} Formatted error information
   */
  static handlePDFError(error, context = '') {
    const errorInfo = {
      code: error.name || 'Error',
      message: this.getPDFErrorMessage(error),
      details: {
        original: error.message,
        context,
        stack: error.stack,
        timestamp: new Date()
      },
      timestamp: new Date()
    };

    this.logError(errorInfo);
    return errorInfo;
  }

  /**
   * Get user-friendly PDF error message
   * @param {Error} error - The error object
   * @returns {string} User-friendly message
   */
  static getPDFErrorMessage(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid pdf') || message.includes('corrupted') || message.includes('malformed')) {
      return 'The PDF file appears to be corrupted. Please try a different file.';
    }
    
    if (message.includes('password') || message.includes('encrypted')) {
      return 'This PDF is password protected. Please provide the password or use an unprotected file.';
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error occurred. Please check your connection and try again.';
    }
    
    if (message.includes('memory') || message.includes('out of memory')) {
      return 'The file is too large to process. Please try a smaller file.';
    }
    
    if (message.includes('timeout')) {
      return 'The operation timed out. Please try again or use a smaller file.';
    }
    
    return 'An error occurred while processing the PDF. Please try again.';
  }

  /**
   * Create recovery actions for errors
   * @param {Object} errorInfo - Error information
   * @returns {Array} Array of recovery action suggestions
   */
  static createRecoveryAction(errorInfo) {
    const actions = [];
    const message = (errorInfo.message || '').toLowerCase();
    
    if (message.includes('corrupted') || message.includes('invalid') || message.includes('pdf error')) {
      actions.push('Try a different PDF file');
      actions.push('Check if the file is corrupted');
      actions.push('Re-download the original file');
    }
    
    if (message.includes('password') || message.includes('encrypted')) {
      actions.push('Remove password protection from the PDF');
      actions.push('Use an unprotected version of the file');
    }
    
    if (message.includes('network')) {
      actions.push('Check your internet connection');
      actions.push('Try again in a few moments');
      actions.push('Use a local copy of the file');
    }
    
    if (message.includes('large') || message.includes('memory')) {
      actions.push('Try a smaller file');
      actions.push('Split the PDF into smaller parts');
      actions.push('Compress the PDF before processing');
    }
    
    if (actions.length === 0) {
      actions.push('Refresh the page and try again');
      actions.push('Clear browser cache and cookies');
      actions.push('Try using a different browser');
    }
    
    return actions;
  }

  /**
   * Handle general application errors
   * @param {Error} error - The error object
   * @param {string} context - Context where error occurred
   * @returns {Object} Formatted error information
   */
  static handleError(error, context = '') {
    const errorInfo = {
      code: error.name || 'ApplicationError',
      message: error.message || 'An unexpected error occurred',
      details: {
        context,
        stack: error.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      },
      timestamp: new Date()
    };

    this.logError(errorInfo);
    return errorInfo;
  }

  /**
   * Execute operation with error handling and retry logic
   * @param {Function} operation - Operation to execute
   * @param {string} context - Context description
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} retryDelay - Delay between retries in ms
   * @returns {Promise} Operation result
   */
  static async withErrorHandling(operation, context = '', maxRetries = 0, retryDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry for certain types of errors
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        if (attempt < maxRetries) {
          console.warn(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`, error);
          await this.delay(retryDelay);
          retryDelay *= 2; // Exponential backoff
        }
      }
    }
    
    throw this.handleError(lastError, context);
  }

  /**
   * Check if error should not be retried
   * @param {Error} error - The error object
   * @returns {boolean} True if error should not be retried
   */
  static isNonRetryableError(error) {
    const message = error.message.toLowerCase();
    return message.includes('invalid pdf') || 
           message.includes('corrupted') || 
           message.includes('password') ||
           message.includes('encrypted') ||
           message.includes('permission denied');
  }

  /**
   * Log error to internal log
   * @param {Object} errorInfo - Error information
   */
  static logError(errorInfo) {
    this.errorLog.unshift(errorInfo);
    
    // Limit log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.splice(this.maxLogSize);
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorInfo);
    }
  }

  /**
   * Get error log
   * @returns {Array} Array of logged errors
   */
  static getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  static clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Report error to external service (placeholder)
   * @param {Object} errorInfo - Error information
   */
  static async reportError(errorInfo) {
    // In a real application, this would send errors to a service like Sentry
    console.warn('Error reporting not configured:', errorInfo);
  }

  /**
   * Create user-friendly error message for UI
   * @param {Error|Object} error - Error object or error info
   * @returns {string} User-friendly message
   */
  static createUserMessage(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Delay utility for retries
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wrap async function with error boundary
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Context for error handling
   * @returns {Function} Wrapped function
   */
  static withErrorBoundary(fn, context) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const errorInfo = this.handleError(error, context);
        throw new Error(this.createUserMessage(errorInfo));
      }
    };
  }
}
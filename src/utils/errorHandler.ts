import { ErrorInfo } from '../types/index.js';

export class ErrorHandler {
  private static errorLog: ErrorInfo[] = [];
  private static maxLogSize = 100;
  private static listeners: Set<(error: ErrorInfo) => void> = new Set();

  public static handleError(error: Error, context: string = '', userAction?: string): ErrorInfo {
    const errorInfo: ErrorInfo = {
      code: this.getErrorCode(error),
      message: this.getUserFriendlyMessage(error),
      details: {
        originalMessage: error.message,
        stack: error.stack,
        context
      },
      timestamp: new Date(),
      userAction
    };

    this.logError(errorInfo);
    this.notifyListeners(errorInfo);

    return errorInfo;
  }

  public static handlePDFError(error: Error, context: string = ''): ErrorInfo {
    console.error(`PDF Error in ${context}:`, error);
    
    const errorMessages: Record<string, string> = {
      'Invalid PDF structure': 'The PDF file appears to be corrupted. Please try a different file.',
      'InvalidPDFException': 'Invalid PDF format. Please ensure the file is a valid PDF.',
      'getPage': 'Failed to access PDF page. The file may be corrupted.',
      'render': 'Failed to render PDF page. Please try again.',
      'embedPng': 'Failed to process images. The PDF may contain unsupported content.',
      'save': 'Failed to save the converted PDF. Please try again.',
      'NetworkError': 'Network connection failed. Please check your internet connection.',
      'QuotaExceededError': 'Storage quota exceeded. Please clear some space and try again.',
      'SecurityError': 'Security restriction encountered. Please check file permissions.'
    };

    let userMessage = errorMessages['default'] || 'An unexpected error occurred. Please try again.';
    
    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key) || error.name === key) {
        userMessage = message;
        break;
      }
    }

    return this.handleError(new Error(userMessage), context);
  }

  public static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string = '',
    retries: number = 0
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries && this.isRetryableError(error as Error)) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          continue;
        }
        
        throw this.handlePDFError(error as Error, context);
      }
    }
    
    throw this.handlePDFError(lastError!, context);
  }

  private static isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'fetch',
      'network'
    ];
    
    return retryableErrors.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase()) ||
      error.name.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static getErrorCode(error: Error): string {
    if (error.name) return error.name;
    if (error.message.includes('PDF')) return 'PDF_ERROR';
    if (error.message.includes('network')) return 'NETWORK_ERROR';
    if (error.message.includes('storage')) return 'STORAGE_ERROR';
    return 'UNKNOWN_ERROR';
  }

  private static getUserFriendlyMessage(error: Error): string {
    const friendlyMessages: Record<string, string> = {
      'PDF_ERROR': 'There was an issue processing your PDF file.',
      'NETWORK_ERROR': 'Network connection problem. Please check your internet connection.',
      'STORAGE_ERROR': 'Storage issue encountered. Please try clearing browser data.',
      'VALIDATION_ERROR': 'Invalid input provided. Please check your data.',
      'PERMISSION_ERROR': 'Permission denied. Please check file access rights.',
      'QUOTA_ERROR': 'Storage quota exceeded. Please free up some space.',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
    };

    const code = this.getErrorCode(error);
    return friendlyMessages[code] || error.message;
  }

  private static logError(errorInfo: ErrorInfo): void {
    this.errorLog.unshift(errorInfo);
    
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorInfo);
    }
  }

  private static notifyListeners(errorInfo: ErrorInfo): void {
    this.listeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  public static onError(listener: (error: ErrorInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public static getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  public static clearErrorLog(): void {
    this.errorLog = [];
  }

  public static exportErrorLog(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }

  public static createRecoveryAction(error: ErrorInfo): string[] {
    const actions: string[] = [];
    
    switch (error.code) {
      case 'PDF_ERROR':
        actions.push('Try a different PDF file');
        actions.push('Check if the file is corrupted');
        actions.push('Reduce file size if too large');
        break;
      case 'NETWORK_ERROR':
        actions.push('Check internet connection');
        actions.push('Try again in a few moments');
        actions.push('Disable VPN if active');
        break;
      case 'STORAGE_ERROR':
        actions.push('Clear browser cache');
        actions.push('Free up device storage');
        actions.push('Try incognito mode');
        break;
      default:
        actions.push('Refresh the page');
        actions.push('Try again later');
        actions.push('Contact support if issue persists');
    }
    
    return actions;
  }
}
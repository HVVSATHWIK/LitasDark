/**
 * Centralized Error Handling
 */
export class ErrorHandler {
  static handlePDFError(error, context = '') {
    console.error(`PDF Error in ${context}:`, error);
    
    const errorMessages = {
      'Invalid PDF structure': 'The PDF file appears to be corrupted. Please try a different file.',
      'InvalidPDFException': 'Invalid PDF format. Please ensure the file is a valid PDF.',
      'getPage': 'Failed to access PDF page. The file may be corrupted.',
      'render': 'Failed to render PDF page. Please try again.',
      'embedPng': 'Failed to process images. The PDF may contain unsupported content.',
      'save': 'Failed to save the converted PDF. Please try again.',
      'PDF library not loaded': 'Required libraries are still loading. Please wait a moment and try again.',
      'NetworkError': 'Network connection failed. Please check your internet connection.',
      'QuotaExceededError': 'Storage quota exceeded. Please clear some space and try again.'
    };

    for (const [key, message] of Object.entries(errorMessages)) {
      if (error.message.includes(key) || error.name === key) {
        return new Error(message);
      }
    }

    return new Error(`An unexpected error occurred${context ? ` in ${context}` : ''}. Please try again.`);
  }

  static async withErrorHandling(operation, context = '') {
    try {
      return await operation();
    } catch (error) {
      throw this.handlePDFError(error, context);
    }
  }

  static createRecoveryAction(error) {
    const actions = [];
    
    if (error.message.includes('library not loaded')) {
      actions.push('Refresh the page');
      actions.push('Check your internet connection');
    } else if (error.message.includes('corrupted')) {
      actions.push('Try a different PDF file');
      actions.push('Check if the file is valid');
    } else if (error.message.includes('too large')) {
      actions.push('Use a smaller PDF file');
      actions.push('Compress the PDF before uploading');
    } else {
      actions.push('Try again');
      actions.push('Refresh the page if the problem persists');
    }
    
    return actions;
  }
}
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
      'save': 'Failed to save the converted PDF. Please try again.'
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
}
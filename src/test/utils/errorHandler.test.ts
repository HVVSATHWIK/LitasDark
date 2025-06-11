import { describe, it, expect, vi } from 'vitest';
import { ErrorHandler } from '../../utils/errorHandler.js';

describe('ErrorHandler', () => {
  it('should handle PDF errors correctly', () => {
    const error = new Error('Invalid PDF structure');
    const errorInfo = ErrorHandler.handlePDFError(error, 'test context');
    
    expect(errorInfo.code).toBe('Error');
    expect(errorInfo.message).toBe('The PDF file appears to be corrupted. Please try a different file.');
    expect(errorInfo.details.context).toBe('test context');
  });

  it('should create recovery actions', () => {
    const errorInfo = {
      code: 'PDF_ERROR',
      message: 'Test error',
      details: {},
      timestamp: new Date()
    };
    
    const actions = ErrorHandler.createRecoveryAction(errorInfo);
    
    expect(actions).toContain('Try a different PDF file');
    expect(actions).toContain('Check if the file is corrupted');
  });

  it('should handle retryable errors', async () => {
    let attempts = 0;
    const operation = vi.fn(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('NetworkError: fetch failed');
      }
      return 'success';
    });

    const result = await ErrorHandler.withErrorHandling(operation, 'test', 2);
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should log errors correctly', () => {
    const error = new Error('Test error');
    ErrorHandler.handleError(error, 'test context');
    
    const errorLog = ErrorHandler.getErrorLog();
    expect(errorLog).toHaveLength(1);
    expect(errorLog[0].details.context).toBe('test context');
  });
});
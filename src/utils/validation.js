/**
 * Input Validation Utilities
 */
export class Validator {
  static validateFile(file) {
    if (!file) {
      throw new Error('No file selected');
    }

    if (file.type !== 'application/pdf') {
      throw new Error('Invalid file type. Please select a PDF file.');
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File too large. Please select a file smaller than 50MB.');
    }

    return true;
  }

  static validatePageRange(startPage, endPage, totalPages) {
    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);

    if (isNaN(start) || isNaN(end)) {
      throw new Error('Page numbers must be valid integers');
    }

    if (start < 1 || end < 1) {
      throw new Error('Page numbers must be greater than 0');
    }

    if (start > totalPages || end > totalPages) {
      throw new Error(`Page numbers cannot exceed ${totalPages}`);
    }

    if (start > end) {
      throw new Error('Start page cannot be greater than end page');
    }

    return { start, end };
  }

  static validateRotationAngle(angle) {
    const validAngles = [0, 90, 180, 270];
    const numAngle = parseInt(angle, 10);
    
    if (!validAngles.includes(numAngle)) {
      throw new Error('Rotation angle must be 0, 90, 180, or 270 degrees');
    }

    return numAngle;
  }

  static validateThemeSettings(settings) {
    const { theme, brightness, contrast } = settings;
    
    const validThemes = ['dark', 'darker', 'darkest', 'sepia', 'blue-light'];
    if (theme && !validThemes.includes(theme)) {
      throw new Error('Invalid theme selection');
    }

    if (brightness !== undefined) {
      const b = parseInt(brightness, 10);
      if (isNaN(b) || b < 50 || b > 150) {
        throw new Error('Brightness must be between 50 and 150');
      }
    }

    if (contrast !== undefined) {
      const c = parseInt(contrast, 10);
      if (isNaN(c) || c < 50 || c > 150) {
        throw new Error('Contrast must be between 50 and 150');
      }
    }

    return true;
  }
}
/**
 * PDF Comparison Tool
 */
export class PDFComparer {
  constructor(renderer) {
    this.renderer = renderer;
    this.originalPdf = null;
    this.convertedPdf = null;
    this.currentPage = 1;
  }

  /**
   * Set PDFs for comparison
   * @param {PDFDocument} originalPdf - Original PDF document
   * @param {PDFDocument} convertedPdf - Converted PDF document
   */
  setPdfs(originalPdf, convertedPdf) {
    this.originalPdf = originalPdf;
    this.convertedPdf = convertedPdf;
    this.currentPage = 1;
  }

  /**
   * Render comparison view
   * @param {HTMLElement} originalContainer - Container for original PDF
   * @param {HTMLElement} convertedContainer - Container for converted PDF
   * @param {number} pageNumber - Page number to compare
   */
  async renderComparison(originalContainer, convertedContainer, pageNumber = 1) {
    if (!this.originalPdf || !this.convertedPdf) {
      throw new Error('PDFs not set for comparison');
    }

    const maxPages = Math.min(
      this.originalPdf.getPageCount(),
      this.convertedPdf.getPageCount()
    );

    if (pageNumber < 1 || pageNumber > maxPages) {
      throw new Error(`Page number out of range (1-${maxPages})`);
    }

    this.currentPage = pageNumber;

    // Clear containers
    originalContainer.innerHTML = '';
    convertedContainer.innerHTML = '';

    // Render original PDF
    const originalCanvas = await this.renderer.renderPage(
      this.originalPdf,
      pageNumber,
      { scale: 1.0 } // No dark mode for original
    );
    originalContainer.appendChild(originalCanvas);

    // Render converted PDF
    const convertedCanvas = await this.renderer.renderPage(
      this.convertedPdf,
      pageNumber,
      { scale: 1.0 }
    );
    convertedContainer.appendChild(convertedCanvas);

    return {
      currentPage: pageNumber,
      totalPages: maxPages
    };
  }

  /**
   * Navigate to next page
   * @param {HTMLElement} originalContainer - Container for original PDF
   * @param {HTMLElement} convertedContainer - Container for converted PDF
   */
  async nextPage(originalContainer, convertedContainer) {
    const maxPages = Math.min(
      this.originalPdf.getPageCount(),
      this.convertedPdf.getPageCount()
    );

    if (this.currentPage < maxPages) {
      return this.renderComparison(
        originalContainer,
        convertedContainer,
        this.currentPage + 1
      );
    }

    return {
      currentPage: this.currentPage,
      totalPages: maxPages
    };
  }

  /**
   * Navigate to previous page
   * @param {HTMLElement} originalContainer - Container for original PDF
   * @param {HTMLElement} convertedContainer - Container for converted PDF
   */
  async prevPage(originalContainer, convertedContainer) {
    if (this.currentPage > 1) {
      return this.renderComparison(
        originalContainer,
        convertedContainer,
        this.currentPage - 1
      );
    }

    return {
      currentPage: this.currentPage,
      totalPages: Math.min(
        this.originalPdf.getPageCount(),
        this.convertedPdf.getPageCount()
      )
    };
  }

  /**
   * Generate side-by-side comparison PDF
   * @returns {Promise<Uint8Array>} - Comparison PDF bytes
   */
  async generateComparisonPdf() {
    if (!this.originalPdf || !this.convertedPdf) {
      throw new Error('PDFs not set for comparison');
    }

    const { PDFDocument, rgb } = PDFLib;
    const comparisonPdf = await PDFDocument.create();

    const maxPages = Math.min(
      this.originalPdf.getPageCount(),
      this.convertedPdf.getPageCount()
    );

    for (let i = 1; i <= maxPages; i++) {
      // Render both pages
      const originalCanvas = await this.renderer.renderPage(
        this.originalPdf,
        i,
        { scale: 0.8 }
      );
      const convertedCanvas = await this.renderer.renderPage(
        this.convertedPdf,
        i,
        { scale: 0.8 }
      );

      // Get image data
      const originalImageData = originalCanvas.toDataURL('image/png');
      const convertedImageData = convertedCanvas.toDataURL('image/png');

      // Embed images
      const originalImage = await comparisonPdf.embedPng(originalImageData);
      const convertedImage = await comparisonPdf.embedPng(convertedImageData);

      // Calculate dimensions
      const pageWidth = originalImage.width + convertedImage.width + 40;
      const pageHeight = Math.max(originalImage.height, convertedImage.height) + 80;

      // Add page
      const page = comparisonPdf.addPage([pageWidth, pageHeight]);

      // Draw title
      page.drawText('Original vs Dark Mode Comparison', {
        x: 20,
        y: pageHeight - 30,
        size: 16,
        color: rgb(0, 0, 0)
      });

      // Draw page number
      page.drawText(`Page ${i} of ${maxPages}`, {
        x: pageWidth - 100,
        y: pageHeight - 30,
        size: 12,
        color: rgb(0.5, 0.5, 0.5)
      });

      // Draw original image
      page.drawImage(originalImage, {
        x: 20,
        y: pageHeight - 50 - originalImage.height,
        width: originalImage.width,
        height: originalImage.height
      });

      // Draw label for original
      page.drawText('Original', {
        x: 20 + originalImage.width / 2 - 30,
        y: 20,
        size: 12,
        color: rgb(0, 0, 0)
      });

      // Draw converted image
      page.drawImage(convertedImage, {
        x: originalImage.width + 40,
        y: pageHeight - 50 - convertedImage.height,
        width: convertedImage.width,
        height: convertedImage.height
      });

      // Draw label for converted
      page.drawText('Dark Mode', {
        x: originalImage.width + 40 + convertedImage.width / 2 - 30,
        y: 20,
        size: 12,
        color: rgb(0, 0, 0)
      });
    }

    return await comparisonPdf.save();
  }
}
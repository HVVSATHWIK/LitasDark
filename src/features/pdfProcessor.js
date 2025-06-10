/**
 * Advanced PDF Processing Operations
 */
export class PDFProcessor {
  constructor() {
    this.supportedOperations = ['watermark', 'metadata', 'compression'];
  }

  /**
   * Add watermark to PDF
   * @param {PDFDocument} pdfDoc - Source PDF document
   * @param {string} watermarkText - Text to use as watermark
   * @param {Object} options - Watermark options
   * @returns {Promise<Uint8Array>} - Modified PDF bytes
   */
  async addWatermark(pdfDoc, watermarkText, options = {}) {
    const {
      opacity = 0.3,
      rotation = 45,
      fontSize = 50,
      color = [0.5, 0.5, 0.5],
      position = 'center'
    } = options;

    const numPages = pdfDoc.getPageCount();
    
    try {
      for (let i = 0; i < numPages; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        // Calculate position based on option
        let x, y;
        switch (position) {
          case 'center':
            x = width / 2;
            y = height / 2;
            break;
          case 'top-left':
            x = 50;
            y = height - 50;
            break;
          case 'top-right':
            x = width - 50;
            y = height - 50;
            break;
          case 'bottom-left':
            x = 50;
            y = 50;
            break;
          case 'bottom-right':
            x = width - 50;
            y = 50;
            break;
          default:
            x = width / 2;
            y = height / 2;
        }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          color: PDFLib.rgb(...color),
          opacity,
          rotate: PDFLib.degrees(rotation),
        });
      }

      return await pdfDoc.save();
    } catch (error) {
      throw new Error(`Failed to add watermark: ${error.message}`);
    }
  }

  /**
   * Remove metadata from PDF
   * @param {PDFDocument} pdfDoc - Source PDF document
   * @returns {Promise<Uint8Array>} - Sanitized PDF bytes
   */
  async removeMetadata(pdfDoc) {
    try {
      // Clear document metadata
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());

      return await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false
      });
    } catch (error) {
      throw new Error(`Failed to remove metadata: ${error.message}`);
    }
  }

  /**
   * Compress PDF to reduce file size
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {Object} options - Compression options
   * @returns {Promise<Uint8Array>} - Compressed PDF bytes
   */
  async compressPDF(pdfDoc, options = {}) {
    const { 
      useObjectStreams = true, 
      compress = true,
      optimizeForSize = true 
    } = options;

    try {
      return await pdfDoc.save({
        useObjectStreams,
        compress,
        optimizeForSize,
        addDefaultPage: false
      });
    } catch (error) {
      throw new Error(`Failed to compress PDF: ${error.message}`);
    }
  }

  /**
   * Extract basic document information
   * @param {PDFDocument} pdfDoc - PDF document
   * @returns {Object} - Document information
   */
  getDocumentInfo(pdfDoc) {
    try {
      return {
        pageCount: pdfDoc.getPageCount(),
        title: pdfDoc.getTitle() || 'Untitled',
        author: pdfDoc.getAuthor() || 'Unknown',
        subject: pdfDoc.getSubject() || '',
        keywords: pdfDoc.getKeywords() || [],
        creator: pdfDoc.getCreator() || '',
        producer: pdfDoc.getProducer() || '',
        creationDate: pdfDoc.getCreationDate(),
        modificationDate: pdfDoc.getModificationDate()
      };
    } catch (error) {
      console.error('Error extracting document info:', error);
      return {
        pageCount: pdfDoc.getPageCount(),
        title: 'Untitled',
        author: 'Unknown',
        subject: '',
        keywords: [],
        creator: '',
        producer: '',
        creationDate: null,
        modificationDate: null
      };
    }
  }
}
/**
 * PDF Annotation Processing
 */
export class AnnotationProcessor {
  constructor() {
    this.currentAnnotations = [];
    this.canvas = null;
    this.context = null;
    this.isDrawing = false;
    this.drawingColor = '#FF5733';
    this.drawingWidth = 2;
    this.drawingTool = 'pen'; // pen, highlighter, text, shapes
  }

  /**
   * Initialize annotation canvas
   * @param {HTMLCanvasElement} canvas - Canvas element for annotations
   */
  initializeCanvas(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.setupEventListeners();
  }

  /**
   * Set up drawing event listeners
   */
  setupEventListeners() {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    
    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });
    
    this.canvas.addEventListener('touchend', (e) => {
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }

  /**
   * Start drawing annotation
   * @param {MouseEvent} e - Mouse event
   */
  startDrawing(e) {
    this.isDrawing = true;
    this.context.beginPath();
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.context.moveTo(x, y);
    
    // Save starting point
    this.currentAnnotations.push({
      tool: this.drawingTool,
      color: this.drawingColor,
      width: this.drawingWidth,
      points: [{x, y}]
    });
  }

  /**
   * Draw annotation
   * @param {MouseEvent} e - Mouse event
   */
  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.context.lineTo(x, y);
    this.context.strokeStyle = this.drawingColor;
    this.context.lineWidth = this.drawingWidth;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
    
    if (this.drawingTool === 'highlighter') {
      this.context.globalAlpha = 0.3;
      this.context.lineWidth = this.drawingWidth * 3;
    } else {
      this.context.globalAlpha = 1.0;
    }
    
    this.context.stroke();
    
    // Add point to current annotation
    const currentAnnotation = this.currentAnnotations[this.currentAnnotations.length - 1];
    currentAnnotation.points.push({x, y});
  }

  /**
   * Stop drawing annotation
   */
  stopDrawing() {
    this.isDrawing = false;
  }

  /**
   * Clear all annotations
   */
  clearAnnotations() {
    if (!this.canvas || !this.context) return;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.currentAnnotations = [];
  }

  /**
   * Set drawing tool
   * @param {string} tool - Drawing tool (pen, highlighter, text, shapes)
   */
  setDrawingTool(tool) {
    this.drawingTool = tool;
  }

  /**
   * Set drawing color
   * @param {string} color - Drawing color in hex format
   */
  setDrawingColor(color) {
    this.drawingColor = color;
  }

  /**
   * Set drawing width
   * @param {number} width - Drawing line width
   */
  setDrawingWidth(width) {
    this.drawingWidth = width;
  }

  /**
   * Get annotation data
   * @returns {Array} - Array of annotation objects
   */
  getAnnotations() {
    return this.currentAnnotations;
  }

  /**
   * Apply annotations to PDF
   * @param {PDFDocument} pdfDoc - PDF document
   * @param {number} pageNumber - Page number
   * @returns {Promise<PDFDocument>} - PDF with annotations
   */
  async applyAnnotationsToPDF(pdfDoc, pageNumber) {
    // Implementation would depend on pdf-lib capabilities
    // This is a simplified version
    const page = pdfDoc.getPage(pageNumber - 1);
    
    for (const annotation of this.currentAnnotations) {
      if (annotation.tool === 'pen' || annotation.tool === 'highlighter') {
        // Draw line annotations
        for (let i = 1; i < annotation.points.length; i++) {
          const startPoint = annotation.points[i - 1];
          const endPoint = annotation.points[i];
          
          page.drawLine({
            start: { x: startPoint.x, y: page.getHeight() - startPoint.y },
            end: { x: endPoint.x, y: page.getHeight() - endPoint.y },
            thickness: annotation.width,
            color: PDFLib.rgb(
              parseInt(annotation.color.slice(1, 3), 16) / 255,
              parseInt(annotation.color.slice(3, 5), 16) / 255,
              parseInt(annotation.color.slice(5, 7), 16) / 255
            ),
            opacity: annotation.tool === 'highlighter' ? 0.3 : 1.0
          });
        }
      }
    }
    
    return pdfDoc;
  }
}
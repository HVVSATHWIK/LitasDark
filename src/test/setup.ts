import { vi } from 'vitest';

// Mock PDF.js
global.pdfjsLib = {
  getDocument: vi.fn(),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
};

// Mock PDF-lib
global.PDFLib = {
  PDFDocument: {
    create: vi.fn(),
    load: vi.fn()
  },
  rgb: vi.fn(),
  degrees: vi.fn()
};

// Mock IndexedDB
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
  cmp: vi.fn()
};

// Mock File API
global.File = class File {
  constructor(chunks, filename, options = {}) {
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    this.type = options.type || '';
    this.lastModified = Date.now();
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
};

// Mock Canvas API
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4)
  })),
  putImageData: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn()
}));

// Mock Web Workers
global.Worker = class Worker {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
  }

  postMessage(data) {
    // Mock worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { success: true, result: data } });
      }
    }, 0);
  }

  terminate() {
    // Mock termination
  }
};

// Mock OffscreenCanvas
global.OffscreenCanvas = class OffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  getContext() {
    return global.HTMLCanvasElement.prototype.getContext();
  }

  transferToImageBitmap() {
    return {};
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
};
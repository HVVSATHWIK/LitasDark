/**
 * Test Setup Configuration for LitasDark Application
 */
import { vi } from 'vitest';

// Mock global objects that are not available in test environment
global.console = {
  ...console,
  // Suppress console.warn in tests unless explicitly needed
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn()
};

// Mock window.performance
let mockTime = 0;
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => {
      mockTime += 10; // Increment by 10ms each call to simulate time passing
      return mockTime;
    }),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    },
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => [])
  },
  writable: true
});

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-agent',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
    cookieEnabled: true
  },
  writable: true
});

// Mock URL methods
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn()
};

// Mock File API
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.size = bits.reduce((acc, bit) => acc + (bit.length || bit.byteLength || 0), 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  text() {
    return Promise.resolve(this.bits.join(''));
  }
};

// Mock Blob
global.Blob = class Blob {
  constructor(bits = [], options = {}) {
    this.size = bits.reduce((acc, bit) => acc + (bit.length || bit.byteLength || 0), 0);
    this.type = options.type || '';
  }
};

// Mock FileReader
global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
  }

  readAsArrayBuffer() {
    setTimeout(() => {
      this.readyState = 2;
      this.result = new ArrayBuffer(1024);
      if (this.onload) this.onload({ target: this });
    }, 0);
  }

  readAsText() {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'mock file content';
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
};

// Mock DataTransfer for drag and drop tests
global.DataTransfer = class DataTransfer {
  constructor() {
    this.items = {
      add: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
      length: 0
    };
    this.files = [];
  }
};

// Mock Canvas API
const mockCanvas = {
  getContext: vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(4),
      width: 1,
      height: 1
    })),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    rect: vi.fn()
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
  toBlob: vi.fn((callback) => callback(new Blob())),
  width: 800,
  height: 600
};

global.HTMLCanvasElement = class HTMLCanvasElement {
  constructor() {
    Object.assign(this, mockCanvas);
  }
};

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName) => {
  if (tagName === 'canvas') {
    return Object.assign(originalCreateElement('canvas'), mockCanvas);
  }
  return originalCreateElement(tagName);
});

// Mock PDF.js and PDF-lib libraries
global.pdfjsLib = {
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: vi.fn(() => Promise.resolve({
        getViewport: vi.fn(() => ({ width: 800, height: 600 })),
        render: vi.fn(() => ({ promise: Promise.resolve() }))
      }))
    })
  })),
  GlobalWorkerOptions: {
    workerSrc: ''
  }
};

global.PDFLib = {
  PDFDocument: {
    create: vi.fn(() => Promise.resolve({
      addPage: vi.fn(),
      embedPng: vi.fn(() => Promise.resolve({})),
      save: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3, 4]))),
      getPageCount: vi.fn(() => 1),
      getPage: vi.fn(() => ({
        drawImage: vi.fn(),
        getSize: vi.fn(() => ({ width: 800, height: 600 })),
        setRotation: vi.fn()
      })),
      copyPages: vi.fn(() => Promise.resolve([{}]))
    })),
    load: vi.fn(() => Promise.resolve({
      getPageCount: vi.fn(() => 1),
      getPage: vi.fn(() => ({
        getSize: vi.fn(() => ({ width: 800, height: 600 })),
        setRotation: vi.fn()
      })),
      save: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3, 4]))),
      getPageIndices: vi.fn(() => [0]),
      getTitle: vi.fn(() => 'Test PDF'),
      getAuthor: vi.fn(() => 'Test Author'),
      getSubject: vi.fn(() => 'Test Subject'),
      getCreator: vi.fn(() => 'Test Creator'),
      getProducer: vi.fn(() => 'Test Producer'),
      setTitle: vi.fn(),
      setAuthor: vi.fn(),
      setSubject: vi.fn(),
      setKeywords: vi.fn(),
      setProducer: vi.fn(),
      setCreator: vi.fn()
    }))
  },
  degrees: vi.fn((deg) => deg),
  rgb: vi.fn((r, g, b) => ({ r, g, b }))
};

// Mock particles.js
global.particlesJS = vi.fn();

// Setup cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
  // Reset mock time
  mockTime = 0;
});

// Global test utilities
global.createMockFile = (name = 'test.pdf', size = 1024, type = 'application/pdf') => {
  return new File(['mock pdf content'], name, { type, size });
};

global.createMockPDFDocument = () => ({
  getPageCount: vi.fn(() => 3),
  getPage: vi.fn((index) => ({
    getSize: vi.fn(() => ({ width: 800, height: 600 })),
    setRotation: vi.fn()
  })),
  save: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3, 4]))),
  getTitle: vi.fn(() => 'Mock PDF'),
  getAuthor: vi.fn(() => 'Mock Author')
});

console.log('Test setup completed');
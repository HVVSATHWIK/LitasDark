// Web Worker for PDF rendering operations
importScripts('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js');
importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.min.js');

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.9.359/pdf.worker.min.js';

self.onmessage = async function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'renderPage':
        result = await renderPageInWorker(data);
        break;
      case 'applyFilters':
        result = await applyFiltersInWorker(data);
        break;
      case 'generateThumbnail':
        result = await generateThumbnailInWorker(data);
        break;
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
    
    self.postMessage({
      id,
      success: true,
      result
    });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error.message
    });
  }
};

async function renderPageInWorker(data) {
  const { pdfBytes, pageNumber, settings } = data;
  
  // Load PDF document
  const pdfDocument = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const page = await pdfDocument.getPage(pageNumber);
  
  const scale = settings.scale || 1.5;
  const viewport = page.getViewport({ scale });
  
  // Create OffscreenCanvas
  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  // Apply theme filters
  applyThemeFilters(context, canvas.width, canvas.height, settings);
  
  // Convert to ImageBitmap for transfer
  const imageBitmap = canvas.transferToImageBitmap();
  
  return {
    imageBitmap,
    width: canvas.width,
    height: canvas.height
  };
}

function applyThemeFilters(context, width, height, settings) {
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  switch (settings.theme) {
    case 'dark':
      applyDarkModeFilter(data);
      break;
    case 'darker':
      applyDarkerModeFilter(data);
      break;
    case 'darkest':
      applyDarkestModeFilter(data);
      break;
    case 'sepia':
      applySepiaFilter(data);
      break;
    case 'blue-light':
      applyBlueLightFilter(data);
      break;
  }

  applyBrightnessContrast(data, settings.brightness || 100, settings.contrast || 100);
  context.putImageData(imageData, 0, 0);
}

function applyDarkModeFilter(data) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
}

function applyDarkerModeFilter(data) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, 255 - data[i] - 30);
    data[i + 1] = Math.max(0, 255 - data[i + 1] - 30);
    data[i + 2] = Math.max(0, 255 - data[i + 2] - 30);
  }
}

function applyDarkestModeFilter(data) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.max(0, 255 - data[i] - 60);
    data[i + 1] = Math.max(0, 255 - data[i + 1] - 60);
    data[i + 2] = Math.max(0, 255 - data[i + 2] - 60);
  }
}

function applySepiaFilter(data) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
  }
}

function applyBlueLightFilter(data) {
  for (let i = 0; i < data.length; i += 4) {
    data[i + 2] = Math.max(0, data[i + 2] * 0.7);
    data[i] = Math.min(255, data[i] * 1.1);
    data[i + 1] = Math.min(255, data[i + 1] * 1.05);
  }
}

function applyBrightnessContrast(data, brightness, contrast) {
  const brightnessFactor = brightness / 100;
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * brightnessFactor));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessFactor));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessFactor));

    data[i] = Math.min(255, Math.max(0, contrastFactor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, contrastFactor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, contrastFactor * (data[i + 2] - 128) + 128));
  }
}

async function applyFiltersInWorker(data) {
  // Implementation for applying filters to existing image data
  return data;
}

async function generateThumbnailInWorker(data) {
  // Implementation for generating thumbnails
  return await renderPageInWorker({
    ...data,
    settings: { ...data.settings, scale: 0.3 }
  });
}
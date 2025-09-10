/**
 * Performance Monitoring Utilities for LitasDark Application
 */
export class PerformanceMonitor {
  static metrics = new Map();
  static observers = new Set();
  static isMonitoring = false;

  /**
   * Start monitoring performance
   */
  static startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupPerformanceObserver();
    this.trackMemoryUsage();
    
    console.log('Performance monitoring started');
  }

  /**
   * Stop monitoring performance
   */
  static stopMonitoring() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    console.log('Performance monitoring stopped');
  }

  /**
   * Start measuring an operation
   * @param {string} operationName - Name of the operation
   * @returns {Object} Measurement object
   */
  static startMeasurement(operationName) {
    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();
    
    return {
      name: operationName,
      startTime,
      startMemory,
      end: () => this.endMeasurement(operationName, startTime, startMemory)
    };
  }

  /**
   * End measuring an operation
   * @param {string} operationName - Name of the operation
   * @param {number} startTime - Start time
   * @param {Object} startMemory - Start memory usage
   * @returns {Object} Measurement result
   */
  static endMeasurement(operationName, startTime, startMemory) {
    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    const duration = endTime - startTime;
    
    const measurement = {
      name: operationName,
      duration,
      memoryUsed: this.calculateMemoryDelta(startMemory, endMemory),
      timestamp: new Date()
    };
    
    this.recordMetricInternal(operationName, measurement);
    return measurement;
  }

  /**
   * Measure an async operation (simplified API for tests)
   * @param {string} operationName - Name of the operation
   * @param {Function} operation - Async operation to measure
   * @returns {Promise} Operation result with duration
   */
  static async measureAsync(operationName, operation) {
    const measurement = this.startMeasurement(operationName);
    
    try {
      const result = await operation();
      const metrics = measurement.end();
      
      return {
        result,
        duration: metrics.duration,
        success: true
      };
    } catch (error) {
      const metrics = measurement.end();
      
      return {
        result: null,
        duration: metrics.duration,
        success: false,
        error
      };
    }
  }

  /**
   * Get raw metrics for an operation
   * @param {string} operationName - Name of the operation
   * @returns {Array} Array of measurements
   */
  static getRawMetrics(operationName) {
    return this.metrics.get(operationName) || [];
  }

  /**
   * Measure a synchronous operation
   * @param {string} operationName - Name of the operation
   * @param {Function} operation - Sync operation to measure
   * @returns {Object} Operation result with measurement
   */
  static measureSync(operationName, operation) {
    const measurement = this.startMeasurement(operationName);
    
    try {
      const result = operation();
      const metrics = measurement.end();
      
      return {
        result,
        metrics,
        success: true
      };
    } catch (error) {
      const metrics = measurement.end();
      metrics.error = error.message;
      
      return {
        result: null,
        metrics,
        success: false,
        error
      };
    }
  }

  /**
   * Clear all metrics and reset monitor
   */
  static cleanup() {
    this.clearMetrics();
    this.stopMonitoring();
  }

  /**
   * Start timing an operation (simple API for tests)
   * @param {string} operationName - Name of the operation
   * @returns {Function} Function to end timing
   */
  static startTiming(operationName) {
    const measurement = this.startMeasurement(operationName);
    return () => {
      const result = measurement.end();
      return result.duration;
    };
  }

  /**
   * Record a simple metric value
   * @param {string} operationName - Name of the operation
   * @param {number} value - Metric value
   */
  static recordMetric(operationName, value) {
    const measurement = {
      name: operationName,
      duration: value,
      timestamp: new Date()
    };
    
    this.recordMetricInternal(operationName, measurement);
  }

  /**
   * Internal method to record metrics (renamed to avoid conflict)
   * @param {string} operationName - Name of the operation
   * @param {Object} measurement - Measurement data
   */
  static recordMetricInternal(operationName, measurement) {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, []);
    }
    
    const operationMetrics = this.metrics.get(operationName);
    operationMetrics.push(measurement);
    
    // Keep only last 100 measurements per operation
    if (operationMetrics.length > 100) {
      operationMetrics.splice(0, operationMetrics.length - 100);
    }
    
    // Log slow operations
    if (measurement.duration > 1000) {
      console.warn(`Slow operation detected: ${operationName} took ${measurement.duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get metrics for an operation (simplified for tests)
   * @param {string} operationName - Name of the operation
   * @returns {Object|null} Metrics summary
   */
  static getMetrics(operationName) {
    const measurements = this.metrics.get(operationName) || [];
    
    if (measurements.length === 0) {
      return null;
    }
    
    const durations = measurements.map(m => m.duration);
    
    return {
      count: measurements.length,
      latest: durations[durations.length - 1],
      min: Math.min(...durations),
      max: Math.max(...durations),
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      total: durations.reduce((a, b) => a + b, 0)
    };
  }

  /**
   * Get all metrics
   * @returns {Object} All recorded metrics
   */
  static getAllMetrics() {
    const result = {};
    this.metrics.forEach((measurements, operationName) => {
      result[operationName] = [...measurements];
    });
    return result;
  }

  /**
   * Get performance summary for an operation
   * @param {string} operationName - Name of the operation
   * @returns {Object} Performance summary
   */
  static getPerformanceSummary(operationName) {
    const measurements = this.getMetrics(operationName);
    
    if (measurements.length === 0) {
      return null;
    }
    
    const durations = measurements.map(m => m.duration);
    const memoryUsages = measurements.map(m => m.memoryUsed?.total || 0);
    
    return {
      operation: operationName,
      count: measurements.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        total: durations.reduce((a, b) => a + b, 0)
      },
      memory: {
        minUsed: Math.min(...memoryUsages),
        maxUsed: Math.max(...memoryUsages),
        avgUsed: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
      },
      errors: measurements.filter(m => m.error).length,
      lastRun: measurements[measurements.length - 1].timestamp
    };
  }

  /**
   * Clear metrics for an operation
   * @param {string} operationName - Name of the operation
   */
  static clearMetrics(operationName) {
    if (operationName) {
      this.metrics.delete(operationName);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Get current memory usage
   * @returns {Object} Memory usage information
   */
  static getMemoryUsage() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }

  /**
   * Calculate memory delta between two measurements
   * @param {Object} startMemory - Start memory usage
   * @param {Object} endMemory - End memory usage
   * @returns {Object} Memory delta
   */
  static calculateMemoryDelta(startMemory, endMemory) {
    return {
      used: endMemory.used - startMemory.used,
      total: endMemory.total - startMemory.total
    };
  }

  /**
   * Setup performance observer for navigation and resource timing
   */
  static setupPerformanceObserver() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          this.handlePerformanceEntry(entry);
        });
      });

      observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      this.observers.add(observer);
    } catch (error) {
      console.warn('Failed to setup performance observer:', error);
    }
  }

  /**
   * Handle performance entry
   * @param {PerformanceEntry} entry - Performance entry
   */
  static handlePerformanceEntry(entry) {
    if (entry.entryType === 'navigation') {
      this.recordMetric('page-load', {
        name: 'page-load',
        duration: entry.loadEventEnd - entry.navigationStart,
        timestamp: new Date()
      });
    } else if (entry.entryType === 'resource') {
      if (entry.duration > 1000) {
        console.warn(`Slow resource load: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Track memory usage periodically
   */
  static trackMemoryUsage() {
    if (!this.isMonitoring) return;

    const interval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(interval);
        return;
      }

      const memory = this.getMemoryUsage();
      this.recordMetric('memory-usage', {
        name: 'memory-usage',
        duration: 0,
        memoryUsed: memory,
        timestamp: new Date()
      });

      // Warn about high memory usage
      if (memory.used > memory.limit * 0.8) {
        console.warn('High memory usage detected:', memory);
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Export metrics as JSON
   * @returns {string} JSON string of all metrics
   */
  static exportMetrics() {
    return JSON.stringify({
      metrics: this.getAllMetrics(),
      summary: this.getOverallSummary(),
      timestamp: new Date()
    }, null, 2);
  }

  /**
   * Get overall performance summary
   * @returns {Object} Overall summary
   */
  static getOverallSummary() {
    const summary = {};
    this.metrics.forEach((measurements, operationName) => {
      summary[operationName] = this.getPerformanceSummary(operationName);
    });
    return summary;
  }

  /**
   * Log performance report to console
   */
  static logPerformanceReport() {
    console.group('Performance Report');
    
    this.metrics.forEach((measurements, operationName) => {
      const summary = this.getPerformanceSummary(operationName);
      console.log(`${operationName}:`, summary);
    });
    
    console.groupEnd();
  }
}
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  private static observers: PerformanceObserver[] = [];

  public static startTiming(label: string): () => number {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  public static async measureAsync<T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const endTiming = this.startTiming(label);
    
    try {
      const result = await operation();
      const duration = endTiming();
      return { result, duration };
    } catch (error) {
      endTiming();
      throw error;
    }
  }

  public static recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  public static getMetrics(label: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    latest: number;
  } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;

    return {
      count: values.length,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  }

  public static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [label, values] of this.metrics.entries()) {
      result[label] = this.getMetrics(label);
    }
    
    return result;
  }

  public static startResourceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.recordMetric(`resource_${entry.name}`, entry.duration);
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'longtask') {
            this.recordMetric('long_task', entry.duration);
            console.warn(`Long task detected: ${entry.duration}ms`);
          }
        }
      });
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        // longtask not supported in all browsers
      }
    }
  }

  public static getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      };
    }
    return null;
  }

  public static checkPerformanceIssues(): string[] {
    const issues: string[] = [];
    
    // Check memory usage
    const memory = this.getMemoryUsage();
    if (memory && memory.percentage > 80) {
      issues.push('High memory usage detected');
    }

    // Check for long tasks
    const longTasks = this.getMetrics('long_task');
    if (longTasks && longTasks.count > 5) {
      issues.push('Multiple long tasks detected');
    }

    // Check render performance
    const renderMetrics = this.getMetrics('pdf_render');
    if (renderMetrics && renderMetrics.average > 5000) {
      issues.push('Slow PDF rendering performance');
    }

    return issues;
  }

  public static generateReport(): string {
    const metrics = this.getAllMetrics();
    const memory = this.getMemoryUsage();
    const issues = this.checkPerformanceIssues();

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics,
      memory,
      issues,
      userAgent: navigator.userAgent
    }, null, 2);
  }

  public static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}
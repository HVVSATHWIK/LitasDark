import { describe, it, expect, beforeEach } from 'vitest';
import { PerformanceMonitor } from '../../utils/performanceMonitor.js';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.cleanup();
  });

  it('should record timing metrics', () => {
    const endTiming = PerformanceMonitor.startTiming('test_operation');
    
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }
    
    const duration = endTiming();
    
    expect(duration).toBeGreaterThan(0);
    
    const metrics = PerformanceMonitor.getMetrics('test_operation');
    expect(metrics).toBeTruthy();
    expect(metrics!.count).toBe(1);
    expect(metrics!.latest).toBe(duration);
  });

  it('should measure async operations', async () => {
    const asyncOperation = () => new Promise(resolve => setTimeout(resolve, 10));
    
    const { result, duration } = await PerformanceMonitor.measureAsync('async_test', asyncOperation);
    
    expect(duration).toBeGreaterThan(5);
    expect(result).toBeUndefined();
    
    const metrics = Perform

anceMonitor.getMetrics('async_test');
    expect(metrics!.count).toBe(1);
  });

  it('should calculate statistics correctly', () => {
    PerformanceMonitor.recordMetric('test_stats', 10);
    PerformanceMonitor.recordMetric('test_stats', 20);
    PerformanceMonitor.recordMetric('test_stats', 30);
    
    const metrics = PerformanceMonitor.getMetrics('test_stats');
    
    expect(metrics!.count).toBe(3);
    expect(metrics!.average).toBe(20);
    expect(metrics!.min).toBe(10);
    expect(metrics!.max).toBe(30);
    expect(metrics!.latest).toBe(30);
  });

  it('should limit stored metrics', () => {
    for (let i = 0; i < 150; i++) {
      PerformanceMonitor.recordMetric('test_limit', i);
    }
    
    const metrics = PerformanceMonitor.getMetrics('test_limit');
    expect(metrics!.count).toBe(100); // Should be limited to 100
  });
});
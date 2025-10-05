// Performance monitoring and optimization utilities
import { logger } from '@/lib/logger';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  public startTiming(label: string): void {
    this.metrics.set(label, performance.now());
  }

  public endTiming(label: string): number {
    const startTime = this.metrics.get(label);
    if (!startTime) {
      logger.warn(`No start time found for ${label}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.metrics.delete(label);
    
    if (duration > 100) {
      logger.warn(`Slow operation detected: ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  public measureAsync<T>(label: string, operation: () => Promise<T>): Promise<T> {
    this.startTiming(label);
    return operation().finally(() => {
      this.endTiming(label);
    });
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
import webpush from 'web-push';
import type { PushSubscription } from '@shared/schema';
import { storage } from './storage';

interface QueuedNotification {
  subscription: PushSubscription;
  payload: string;
  attempts: number;
  lastAttempt: Date;
  notificationId?: number;
}

export class PushRetryQueue {
  private queue: Map<string, QueuedNotification> = new Map();
  private maxAttempts = 3;
  private retryDelays = [5000, 15000, 60000]; // 5s, 15s, 1min exponential backoff
  private processing = false;

  /**
   * Add a notification to the retry queue
   */
  add(subscription: PushSubscription, payload: string, notificationId?: number): void {
    const key = subscription.endpoint;
    this.queue.set(key, {
      subscription,
      payload,
      attempts: 0,
      lastAttempt: new Date(),
      notificationId
    });
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * Process the retry queue with exponential backoff
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.size === 0) return;
    
    this.processing = true;
    
    try {
      const now = Date.now();
      const toProcess: string[] = [];
      
      // Find items ready to retry
      for (const [key, item] of Array.from(this.queue.entries())) {
        const delay = this.retryDelays[item.attempts] || this.retryDelays[this.retryDelays.length - 1];
        const nextRetryTime = item.lastAttempt.getTime() + delay;
        
        if (now >= nextRetryTime) {
          toProcess.push(key);
        }
      }
      
      // Process each item
      for (const key of toProcess) {
        const item = this.queue.get(key);
        if (!item) continue;
        
        try {
          await this.sendNotification(item);
          // Success - remove from queue
          this.queue.delete(key);
          
          // Mark subscription as valid
          await storage.markSubscriptionValid(item.subscription.endpoint);
        } catch (error: any) {
          item.attempts++;
          item.lastAttempt = new Date();
          
          // Check if should remove from queue
          const statusCode = error.statusCode || error.status;
          const shouldRemove = this.shouldRemoveFromQueue(statusCode, item.attempts);
          
          if (shouldRemove) {
            this.queue.delete(key);
            
            // Mark subscription as invalid if terminal error
            if (this.isTerminalError(statusCode)) {
              await storage.markSubscriptionInvalid(
                item.subscription.endpoint,
                statusCode,
                error.message
              );
            }
          }
        }
      }
      
      // Schedule next processing if queue not empty
      if (this.queue.size > 0) {
        setTimeout(() => {
          this.processing = false;
          this.processQueue();
        }, 1000);
      } else {
        this.processing = false;
      }
    } catch (error) {
      console.error('Error processing retry queue:', error);
      this.processing = false;
    }
  }

  /**
   * Send a notification to a subscription
   */
  private async sendNotification(item: QueuedNotification): Promise<void> {
    await webpush.sendNotification({
      endpoint: item.subscription.endpoint,
      keys: {
        p256dh: item.subscription.p256dh,
        auth: item.subscription.auth
      }
    }, item.payload);
  }

  /**
   * Determine if a notification should be removed from queue
   */
  private shouldRemoveFromQueue(statusCode: number | undefined, attempts: number): boolean {
    // Terminal errors - remove immediately
    if (this.isTerminalError(statusCode)) {
      return true;
    }
    
    // Max attempts reached
    if (attempts >= this.maxAttempts) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if an error is terminal (subscription should be removed)
   */
  private isTerminalError(statusCode: number | undefined): boolean {
    if (!statusCode) return false;
    
    // These errors indicate the subscription is no longer valid
    return statusCode === 410  // Gone
        || statusCode === 404  // Not Found
        || statusCode === 400; // Bad Request (malformed subscription)
  }

  /**
   * Categorize error and return handling strategy
   */
  static categorizeError(statusCode: number | undefined): {
    type: 'terminal' | 'temporary' | 'config' | 'unknown';
    action: 'remove' | 'retry' | 'keep' | 'investigate';
    description: string;
  } {
    if (!statusCode) {
      return {
        type: 'unknown',
        action: 'retry',
        description: 'Unknown error - will retry'
      };
    }
    
    // Terminal errors - subscription invalid
    if (statusCode === 410) {
      return { type: 'terminal', action: 'remove', description: 'Subscription expired' };
    }
    if (statusCode === 404) {
      return { type: 'terminal', action: 'remove', description: 'Subscription not found' };
    }
    if (statusCode === 400) {
      return { type: 'terminal', action: 'remove', description: 'Invalid subscription format' };
    }
    
    // Configuration errors - keep subscription, fix config
    if (statusCode === 401 || statusCode === 403) {
      return { type: 'config', action: 'keep', description: 'Authentication error - check VAPID keys' };
    }
    if (statusCode === 413) {
      return { type: 'config', action: 'keep', description: 'Payload too large' };
    }
    
    // Temporary errors - retry
    if (statusCode === 429) {
      return { type: 'temporary', action: 'retry', description: 'Rate limited' };
    }
    if (statusCode >= 500) {
      return { type: 'temporary', action: 'retry', description: 'Server error' };
    }
    
    // Other client errors - investigate
    if (statusCode >= 400 && statusCode < 500) {
      return { type: 'unknown', action: 'investigate', description: `Unexpected client error ${statusCode}` };
    }
    
    return { type: 'unknown', action: 'retry', description: 'Unknown error' };
  }

  /**
   * Get queue status
   */
  getStatus(): { size: number; processing: boolean } {
    return {
      size: this.queue.size,
      processing: this.processing
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue.clear();
  }
}

export const pushRetryQueue = new PushRetryQueue();

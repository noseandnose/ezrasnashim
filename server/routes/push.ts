import type { Express, Request, Response } from "express";
import type { IStorage } from "../storage";
import type { PushRetryQueue } from "../pushRetryQueue";
import webpush from "web-push";

export interface PushRouteDeps {
  requireAdminAuth: (req: any, res: any, next: any) => void;
  storage: IStorage;
  pushRetryQueue: PushRetryQueue;
  VAPID_PUBLIC_KEY: string | undefined;
}

export function registerPushRoutes(app: Express, deps: PushRouteDeps) {
  const { requireAdminAuth, storage, pushRetryQueue, VAPID_PUBLIC_KEY } = deps;

  app.get("/api/push/vapid-public-key", (req: Request, res: Response) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY || null });
  });

  app.post("/api/push/subscribe", async (req: Request, res: Response) => {
    try {
      const { subscription, sessionId } = req.body;
      
      if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
        return res.status(400).json({ error: "Invalid subscription object - missing required fields" });
      }

      const savedSubscription = await storage.subscribeToPush({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        sessionId: sessionId || null
      });

      res.json({ 
        success: true, 
        message: "Successfully subscribed to push notifications",
        subscriptionId: savedSubscription.id 
      });
    } catch (error) {
      console.error("Error subscribing to push:", error);
      return res.status(500).json({ error: "Failed to subscribe to push notifications" });
    }
  });

  app.post("/api/push/unsubscribe", async (req: Request, res: Response) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint required" });
      }

      await storage.unsubscribeFromPush(endpoint);
      res.json({ success: true, message: "Successfully unsubscribed from push notifications" });
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      return res.status(500).json({ error: "Failed to unsubscribe from push notifications" });
    }
  });

  app.post("/api/push/send", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const { title, body, icon, badge, url, requireInteraction } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
      }

      const subscriptions = await storage.getActiveSubscriptions();
      
      if (subscriptions.length === 0) {
        return res.json({ 
          success: false, 
          message: "No active subscriptions found",
          sentCount: 0 
        });
      }

      const notification = await storage.createNotification({
        title,
        body,
        icon: icon || '/icon-192x192.png',
        badge: badge || '/badge-72x72.png',
        url: url || '/',
        data: { timestamp: Date.now() },
        sentCount: 0,
        successCount: 0,
        failureCount: 0,
        createdBy: 'admin'
      });

      const payload = JSON.stringify({
        title,
        body,
        icon: icon || '/icon-192x192.png',
        badge: badge || '/badge-72x72.png',
        url: url || '/',
        requireInteraction: requireInteraction || false,
        timestamp: Date.now()
      });

      let successCount = 0;
      let failureCount = 0;

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            await storage.markSubscriptionInvalid(sub.endpoint, 400, "Invalid subscription structure");
            failureCount++;
            return;
          }
          
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload);
          
          await storage.markSubscriptionValid(sub.endpoint);
          successCount++;
        } catch (error: any) {
          const statusCode = error.statusCode || error.status;
          const { PushRetryQueue } = await import("../pushRetryQueue");
          const errorCategory = PushRetryQueue.categorizeError(statusCode);
          
          console.error(`Push notification failed for ${sub.endpoint.substring(0, 50)}...`, {
            statusCode,
            message: error.message,
            category: errorCategory.type,
            action: errorCategory.action
          });
          
          if (errorCategory.action === 'remove') {
            await storage.markSubscriptionInvalid(sub.endpoint, statusCode, error.message);
            failureCount++;
          } else if (errorCategory.action === 'retry') {
            pushRetryQueue.add(sub, payload, notification.id);
            failureCount++;
          } else if (errorCategory.action === 'keep') {
            console.error(`Configuration issue: ${errorCategory.description}`);
            failureCount++;
          } else {
            pushRetryQueue.add(sub, payload, notification.id);
            failureCount++;
          }
        }
      });

      await Promise.all(sendPromises);

      await storage.updateNotificationStats(notification.id, successCount, failureCount);

      res.json({ 
        success: true, 
        message: `Sent to ${successCount} users`,
        sentCount: successCount + failureCount,
        successCount,
        failureCount
      });
    } catch (error) {
      console.error("Error sending push notification:", error);
      return res.status(500).json({ error: "Failed to send push notification" });
    }
  });

  app.get("/api/push/history", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const history = await storage.getNotificationHistory(50);
      res.json(history);
    } catch (error) {
      console.error("Error fetching notification history:", error);
      return res.status(500).json({ error: "Failed to fetch notification history" });
    }
  });

  app.post("/api/push/simple-test", async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getActiveSubscriptions();
      
      if (subscriptions.length === 0) {
        return res.json({ success: false, message: "No subscriptions" });
      }

      const payload = JSON.stringify({
        title: "Test Push"
      });

      console.log('[Simple Test] Sending minimal payload:', payload);
      
      let sent = 0;
      for (const sub of subscriptions) {
        try {
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            await storage.unsubscribeFromPush(sub.endpoint);
            continue;
          }
          
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload);
          sent++;
          console.log('[Simple Test] Sent successfully');
        } catch (error: any) {
          console.error('[Simple Test] Error:', error.statusCode, error.message);
          if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 400) {
            await storage.unsubscribeFromPush(sub.endpoint);
          }
        }
      }

      res.json({ success: sent > 0, sent });
    } catch (error) {
      console.error("[Simple Test] Error:", error);
      return res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/push/test", async (req: Request, res: Response) => {
    try {
      const { title, body } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ error: "Title and body are required" });
      }

      const subscriptions = await storage.getActiveSubscriptions();
      
      if (subscriptions.length === 0) {
        return res.json({ 
          success: false, 
          message: "No active subscriptions found",
          sentCount: 0 
        });
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        timestamp: Date.now()
      });

      console.log('[Test Push] Sending to', subscriptions.length, 'subscription(s)');
      console.log('[Test Push] Payload:', payload);

      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            await storage.unsubscribeFromPush(sub.endpoint);
            failureCount++;
            errors.push(`Invalid subscription structure`);
            return;
          }
          
          console.log('[Test Push] Sending to endpoint:', sub.endpoint.substring(0, 50) + '...');
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload);
          successCount++;
          console.log('[Test Push] Success for endpoint:', sub.endpoint.substring(0, 50) + '...');
        } catch (error: any) {
          failureCount++;
          const errorMsg = `Endpoint ${sub.endpoint.substring(0, 50)}...: ${error.message}`;
          errors.push(errorMsg);
          console.error('[Test Push] Failed:', errorMsg);
          
          const statusCode = error.statusCode || error.status;
          if (statusCode === 410 || statusCode === 404 || statusCode === 400) {
            await storage.unsubscribeFromPush(sub.endpoint);
            console.log('[Test Push] Removed invalid subscription (', statusCode, ')');
          } else if (statusCode === 401 || statusCode === 403) {
            console.error('[Test Push] Auth error - check VAPID configuration');
          }
        }
      });

      await Promise.all(sendPromises);

      res.json({ 
        success: successCount > 0, 
        message: `Sent to ${successCount} users, ${failureCount} failed`,
        successCount,
        failureCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("[Test Push] Error:", error);
      return res.status(500).json({ error: "Failed to send test push notification" });
    }
  });

  app.post("/api/push/validate-subscriptions", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getSubscriptionsNeedingValidation(24);
      
      if (subscriptions.length === 0) {
        return res.json({ 
          success: true, 
          message: "All subscriptions are up to date",
          validated: 0
        });
      }

      const validationPayload = JSON.stringify({
        title: "Connection Check",
        body: "",
        tag: "validation-ping",
        silent: true,
        data: { type: "validation" }
      });

      let validCount = 0;
      let invalidCount = 0;
      const errors: Array<{ endpoint: string; error: string }> = [];

      for (const sub of subscriptions) {
        try {
          if (!sub.endpoint || !sub.p256dh || !sub.auth) {
            await storage.markSubscriptionInvalid(sub.endpoint, 400, "Invalid subscription structure");
            invalidCount++;
            continue;
          }

          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, validationPayload);

          await storage.markSubscriptionValid(sub.endpoint);
          validCount++;
        } catch (error: any) {
          const statusCode = error.statusCode || error.status;
          const errorMessage = error.message;
          
          await storage.markSubscriptionInvalid(sub.endpoint, statusCode, errorMessage);
          invalidCount++;
          
          errors.push({
            endpoint: sub.endpoint.substring(0, 50) + "...",
            error: `${statusCode || 'Unknown'}: ${errorMessage}`
          });
        }
      }

      res.json({
        success: true,
        message: `Validated ${subscriptions.length} subscriptions`,
        validCount,
        invalidCount,
        totalChecked: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Error validating subscriptions:", error);
      return res.status(500).json({ error: "Failed to validate subscriptions" });
    }
  });

  app.get("/api/push/subscriptions", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      
      const sanitized = subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + "...",
        sessionId: sub.sessionId,
        subscribed: sub.subscribed,
        lastValidatedAt: sub.lastValidatedAt,
        validationFailures: sub.validationFailures,
        lastErrorCode: sub.lastErrorCode,
        lastErrorMessage: sub.lastErrorMessage,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      }));

      res.json(sanitized);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      return res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/push/queue-status", requireAdminAuth, (req: Request, res: Response) => {
    const status = pushRetryQueue.getStatus();
    res.json(status);
  });
}

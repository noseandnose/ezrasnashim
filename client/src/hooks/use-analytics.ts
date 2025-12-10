import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { getLocalDateString } from "@/lib/dateUtils";

// Offline queue storage key
const PENDING_ANALYTICS_KEY = 'ezras_nashim_pending_analytics';

interface PendingEvent {
  eventType: string;
  eventData: Record<string, any>;
  sessionId: string;
  idempotencyKey: string;
  timestamp: number;
  date: string;
}

// Get pending events from localStorage
function getPendingEvents(): PendingEvent[] {
  try {
    const stored = localStorage.getItem(PENDING_ANALYTICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save pending events to localStorage
function savePendingEvents(events: PendingEvent[]): void {
  localStorage.setItem(PENDING_ANALYTICS_KEY, JSON.stringify(events));
}

// Queue an event for later sync if offline
function queueEvent(event: PendingEvent): void {
  const pending = getPendingEvents();
  pending.push(event);
  savePendingEvents(pending);
}

// Sync all pending events to server
async function syncPendingEvents(): Promise<void> {
  if (!navigator.onLine) return;
  
  const pending = getPendingEvents();
  if (pending.length === 0) return;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/analytics/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: pending })
    });
    
    if (response.ok) {
      savePendingEvents([]);
    }
  } catch (error) {
    console.error('Failed to sync analytics events:', error);
  }
}

// Generate or retrieve session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

// Generate idempotency key for an event
function generateIdempotencyKey(eventType: string, eventData: Record<string, any>, sessionId: string): string {
  const date = getLocalDateString();
  const dataHash = JSON.stringify(eventData);
  return `${sessionId}-${date}-${eventType}-${dataHash}-${Date.now()}`;
}

interface TrackEventParams {
  eventType: "modal_complete" | "tehillim_complete" | "name_prayed" | "tehillim_book_complete" | "tzedaka_completion" | "meditation_complete" | "feature_usage";
  eventData?: Record<string, any>;
}

export const useAnalytics = () => {
  useLocation();

  const trackEventMutation = useMutation({
    mutationFn: async ({ eventType, eventData }: TrackEventParams) => {
      const sessionId = getSessionId();
      const date = getLocalDateString();
      const idempotencyKey = generateIdempotencyKey(eventType, eventData || {}, sessionId);
      
      const event: PendingEvent = {
        eventType,
        eventData: eventData || {},
        sessionId,
        idempotencyKey,
        timestamp: Date.now(),
        date
      };
      
      // If offline, queue for later
      if (!navigator.onLine) {
        queueEvent(event);
        return { queued: true };
      }
      
      // Try to send directly
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/analytics/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType,
            eventData: eventData || {},
            sessionId,
            idempotencyKey,
            date
          }),
        });
        if (!response.ok) throw new Error("Failed to track event");
        return response.json();
      } catch (error) {
        // Queue for later if request fails
        queueEvent(event);
        return { queued: true };
      }
    },
  });

  // Track unique session/user activity efficiently (once per session)
  useEffect(() => {
    const sessionKey = `session_tracked_${getSessionId()}`;
    if (!sessionStorage.getItem(sessionKey)) {
      // Track this unique session only once
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/analytics/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId() }),
      });
      sessionStorage.setItem(sessionKey, "true");
    }
    
    // Sync any pending events on mount
    syncPendingEvents();
  }, []);

  const trackEvent = (eventType: TrackEventParams["eventType"], eventData?: Record<string, any>) => {
    trackEventMutation.mutate({ eventType, eventData: eventData || {} });
  };

  const trackCompletion = (modalName: string) => {
    trackEvent("modal_complete", { modalType: modalName });
  };

  return { trackEvent, trackCompletion };
};

// Sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPendingEvents();
  });
  
  // Listen for service worker sync messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SYNC_ANALYTICS') {
        syncPendingEvents();
      }
    });
  }
  
  // Sync on app initialization (after 1 second delay)
  setTimeout(() => {
    syncPendingEvents();
  }, 1000);
}

// Hook for tracking modal completions
export const useTrackModalComplete = () => {
  const { trackEvent } = useAnalytics();

  const trackModalComplete = (modalType: string) => {
    if (import.meta.env.MODE === 'development') {
      // Tracking modal completion
    }
    trackEvent("modal_complete", { modalType });
  };

  return { trackModalComplete };
};

// Hook for tracking feature usage (non-mitzvah activities)
export const useTrackFeatureUsage = () => {
  const { trackEvent } = useAnalytics();

  const trackFeatureUsage = (featureName: string, featureData?: Record<string, any>) => {
    if (import.meta.env.MODE === 'development') {
      // Tracking feature usage
    }
    trackEvent("feature_usage", { feature: featureName, ...featureData });
  };

  return { trackFeatureUsage };
};
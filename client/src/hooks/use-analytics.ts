import { useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";

// Generate or retrieve session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

interface TrackEventParams {
  eventType: "modal_complete" | "tehillim_complete" | "name_prayed";
  eventData?: Record<string, any>;
}

export const useAnalytics = () => {
  const [location] = useLocation();

  const trackEventMutation = useMutation({
    mutationFn: async ({ eventType, eventData }: TrackEventParams) => {
      // Only track significant completion events, not page views
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          eventData,
          sessionId: getSessionId(),
        }),
      });
      if (!response.ok) throw new Error("Failed to track event");
      return response.json();
    },
  });

  // Track unique session/user activity efficiently (once per session)
  useEffect(() => {
    const sessionKey = `session_tracked_${getSessionId()}`;
    if (!sessionStorage.getItem(sessionKey)) {
      // Track this unique session only once
      fetch(`${import.meta.env.VITE_API_URL}/api/analytics/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId() }),
      });
      sessionStorage.setItem(sessionKey, "true");
    }
  }, []);

  const trackEvent = (eventType: TrackEventParams["eventType"], eventData?: Record<string, any>) => {
    trackEventMutation.mutate({ eventType, eventData });
  };

  const trackCompletion = (modalName: string) => {
    trackEvent("modal_complete", { modal: modalName });
  };

  return { trackEvent, trackCompletion };
};

// Hook for tracking modal completions
export const useTrackModalComplete = () => {
  const { trackEvent } = useAnalytics();

  const trackModalComplete = (modalType: string) => {
    console.log("Tracking modal completion:", modalType);
    trackEvent("modal_complete", { modalType });
  };

  return { trackModalComplete };
};
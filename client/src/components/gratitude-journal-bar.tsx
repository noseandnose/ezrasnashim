import { useState, useCallback } from "react";
import { Heart, ChevronDown, ChevronUp, Lock, BookOpen, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import axiosClient from "@/lib/axiosClient";
import { getLocalDateString } from "@/lib/dateUtils";
import { useLocation } from "wouter";

export default function GratitudeJournalBar() {
  const { isAuthenticated, session } = useAuth();
  const { openModal } = useModalStore();
  const { completeTask } = useDailyCompletionStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const [, setLocation] = useLocation();

  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = getLocalDateString();
  const modalName = 'gratitude-journal';
  const hasCompletedToday = isModalComplete(modalName);

  const { data: todaysEntry } = useQuery({
    queryKey: ['/api/gratitude/today', today],
    queryFn: async () => {
      if (!session?.access_token) return null;
      const response = await axiosClient.get(`/api/gratitude/today?date=${today}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      return response.data;
    },
    enabled: isAuthenticated && !!session?.access_token,
    staleTime: 60 * 1000,
  });

  const alreadyCompleted = hasCompletedToday || !!todaysEntry;

  const handleSubmit = useCallback(async (withTehillim: boolean) => {
    if (!text.trim() || !session?.access_token || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await axiosClient.post('/api/gratitude', {
        text: text.trim(),
        date: today,
        completedWithTehillim: withTehillim
      }, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      markModalComplete(modalName);
      completeTask('life');

      queryClient.invalidateQueries({ queryKey: ['/api/gratitude/today', today] });
      queryClient.invalidateQueries({ queryKey: ['/api/gratitude'] });

      setText("");
      setExpanded(false);

      if (withTehillim) {
        openModal('special-tehillim', 'tefilla', 100);
      }
    } catch (error) {
      console.error('Failed to save gratitude entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [text, session, isSubmitting, today, markModalComplete, completeTask, openModal]);

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => setLocation('/login')}
        className="w-full rounded-2xl py-3 px-4 text-left shadow-lg border border-blush/10 bg-white/60 flex items-center space-x-4 opacity-70"
      >
        <div className="p-2.5 rounded-full bg-gray-300">
          <Lock className="text-white" size={18} strokeWidth={1.5} />
        </div>
        <div className="flex-grow">
          <h3 className="platypi-bold text-sm text-gray-400">Today I'm grateful for...</h3>
          <p className="platypi-regular text-xs text-gray-400">Log in to use the Gratitude Journal</p>
        </div>
      </button>
    );
  }

  if (alreadyCompleted) {
    return (
      <div className="w-full rounded-2xl py-3 px-4 text-left shadow-lg border border-sage/30 bg-white flex items-center space-x-4">
        <div className="p-2.5 rounded-full bg-sage">
          <Check className="text-white" size={18} strokeWidth={1.5} />
        </div>
        <div className="flex-grow">
          <h3 className="platypi-bold text-sm text-black">Today I'm grateful for...</h3>
          <p className="platypi-regular text-xs text-black/60 line-clamp-1">
            {todaysEntry?.text || "Completed today"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl shadow-lg border border-blush/10 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-3 px-4 text-left flex items-center space-x-4 hover:bg-white/90 transition-all active:scale-[0.98]"
      >
        <div className="p-2.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500">
          <Heart className="text-white" size={18} strokeWidth={1.5} />
        </div>
        <div className="flex-grow">
          <h3 className="platypi-bold text-sm text-black">Today I'm grateful for...</h3>
          <p className="platypi-regular text-xs text-black/60">Daily Gratitude Journal</p>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-black/40" />
        ) : (
          <ChevronDown size={18} className="text-black/40" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-blush/10">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write what you're grateful for today..."
            className="w-full mt-3 p-3 rounded-xl border border-blush/20 bg-white/80 text-sm platypi-regular text-black placeholder:text-black/30 resize-none focus:outline-none focus:ring-2 focus:ring-blush/30 focus:border-blush/40"
            rows={3}
            maxLength={500}
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-black/30 platypi-regular">{text.length}/500</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit(false)}
                disabled={!text.trim() || isSubmitting}
                className="px-4 py-2 rounded-full text-xs platypi-bold text-white bg-gradient-to-r from-amber-400 to-amber-500 shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Complete
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={!text.trim() || isSubmitting}
                className="px-4 py-2 rounded-full text-xs platypi-bold text-white bg-gradient-to-r from-blush to-lavender shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <BookOpen size={14} />
                )}
                Complete + Tehillim 100
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

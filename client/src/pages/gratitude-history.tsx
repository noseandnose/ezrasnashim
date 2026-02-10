import { useLocation } from "wouter";
import { ArrowLeft, NotebookPen, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import BottomNavigation from "@/components/bottom-navigation";
import type { Section } from "@/pages/home";
import type { GratitudeJournal } from "@shared/schema";
import sectionMorningBg from "@assets/Morning_Background_1767032607494.png";
import sectionAfternoonBg from "@assets/Afternoon_Background_1767032607493.png";
import sectionNightBg from "@assets/background_night_1767034895431.png";

const getTimeBasedBackground = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return sectionMorningBg;
  if (hour >= 12 && hour < 18) return sectionAfternoonBg;
  return sectionNightBg;
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function GratitudeHistory() {
  const [, setLocation] = useLocation();
  const { session, isAuthenticated, isLoading: authLoading } = useAuth();
  const [backgroundImage, setBackgroundImage] = useState(getTimeBasedBackground);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setBackgroundImage(getTimeBasedBackground());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: entries = [], isLoading } = useQuery<GratitudeJournal[]>({
    queryKey: ['/api/gratitude'],
    enabled: isAuthenticated && !!session?.access_token,
    queryFn: async () => {
      const res = await fetch('/api/gratitude', {
        headers: { 'Authorization': `Bearer ${session!.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch entries');
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const handleSectionChange = (section: Section) => {
    setLocation(section === 'home' ? '/' : `/${section}`);
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <img src="/icon-192.png" alt="Loading..." className="w-24 h-24 object-contain animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex flex-col"
        style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="flex items-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button onClick={() => setLocation('/profile')} className="p-2 rounded-full bg-white/80 backdrop-blur-sm">
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
          <h1 className="flex-1 text-center platypi-regular text-lg text-black font-bold">Gratitude Journal</h1>
          <div className="w-9" />
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm">
            <NotebookPen className="w-12 h-12 text-black/30 mx-auto mb-3" />
            <p className="platypi-regular text-black/70 mb-4">Sign in to view your gratitude journal entries</p>
            <button
              onClick={() => setLocation('/login')}
              className="px-6 py-2 rounded-full bg-black text-white platypi-regular text-sm"
            >
              Sign In
            </button>
          </div>
        </div>
        <BottomNavigation activeSection="home" onSectionChange={handleSectionChange} />
      </div>
    );
  }

  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div 
      className="min-h-screen flex flex-col pb-20"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="flex items-center p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={() => setLocation('/profile')} className="p-2 rounded-full bg-white/80 backdrop-blur-sm">
          <ArrowLeft className="w-5 h-5 text-black" />
        </button>
        <h1 className="flex-1 text-center platypi-regular text-lg text-black font-bold">Gratitude Journal</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 space-y-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
          </div>
        ) : sortedEntries.length === 0 ? (
          <div className="text-center py-12">
            <NotebookPen className="w-12 h-12 text-black/20 mx-auto mb-3" />
            <p className="platypi-regular text-black/50">No entries yet</p>
            <p className="platypi-regular text-sm text-black/40 mt-1">Start your gratitude practice on the home page</p>
          </div>
        ) : (
          sortedEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl p-4 border border-white/30"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="platypi-regular text-xs text-black/50">{formatDate(entry.date)}</span>
                {entry.completedWithTehillim && (
                  <span className="flex items-center gap-1 text-xs text-black/40 platypi-regular">
                    <BookOpen className="w-3 h-3" />
                    Tehillim 100
                  </span>
                )}
              </div>
              <p className="platypi-regular text-sm text-black leading-relaxed">{entry.text}</p>
            </div>
          ))
        )}
      </div>

      <BottomNavigation activeSection="home" onSectionChange={handleSectionChange} />
    </div>
  );
}
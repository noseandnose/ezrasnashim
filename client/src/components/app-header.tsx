import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useHebrewDate } from "@/hooks/use-hebrew-date";
import { BarChart3, Info } from "lucide-react";
import { useLocation } from "wouter";
import { useModalStore } from "@/lib/types";

export default function AppHeader() {
  const { data: times, isLoading: timesLoading } = useJewishTimes();
  const { data: hebrewDate, isLoading: dateLoading } = useHebrewDate();
  const [, setLocation] = useLocation();
  const { setActiveModal } = useModalStore();

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <header className="bg-gradient-soft p-3 border-0 shadow-none">
      <div className="flex items-center justify-between px-2">
        <button
          onClick={() => setActiveModal('about')}
          className="p-2 rounded-full hover:bg-white/50 transition-colors"
          aria-label="About Ezras Nashim"
        >
          <Info className="h-5 w-5 text-blush" />
        </button>
        <h1 className="font-serif text-xl font-semibold text-black tracking-wide">Ezras Nashim</h1>
        <button
          onClick={() => setLocation("/statistics")}
          className="p-2 rounded-full hover:bg-white/50 transition-colors"
          aria-label="View Statistics"
        >
          <BarChart3 className="h-5 w-5 text-black/70" />
        </button>
      </div>
    </header>
  );
}

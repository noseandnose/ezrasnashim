import { Book, Heart, Play, Shield, BookOpen, Sparkles, Star, Scroll } from "lucide-react";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import type { InspirationalQuote } from "@shared/schema";
import type { Section } from "@/pages/home";

interface TorahSectionProps {
  onSectionChange?: (section: Section) => void;
}

export default function TorahSection({ onSectionChange }: TorahSectionProps) {
  const { openModal } = useModalStore();
  const { torahCompleted } = useDailyCompletionStore();
  
  // Fetch today's inspirational quote
  const today = new Date().toISOString().split('T')[0];
  const { data: quote } = useQuery<InspirationalQuote>({
    queryKey: ['daily-quote', today],
    queryFn: async () => {
      const response = await fetch(`/api/quotes/daily/${today}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 1 hour
  });

  // Fetch today's Pirkei Avot for daily inspiration
  const { data: pirkeiAvot } = useQuery<{text: string; chapter: number}>({
    queryKey: ['pirkei-avot-daily', today],
    queryFn: async () => {
      const response = await fetch(`/api/torah/pirkei-avot/${today}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 1 hour
  });

  const torahItems = [
    {
      id: 'halacha',
      icon: Book,
      title: 'Halacha',
      subtitle: 'Jewish Law & Practice',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10'
    },
    {
      id: 'mussar',
      icon: Heart,
      title: 'Mussar',
      subtitle: 'Character Development',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10'
    },
    {
      id: 'chizuk',
      icon: Play,
      title: 'Chizuk',
      subtitle: '5 minute inspiration',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10'
    },
    {
      id: 'loshon',
      icon: Shield,
      title: 'Loshon Horah',
      subtitle: 'Guard Your Speech',
      gradient: 'bg-white',
      iconBg: 'bg-gradient-feminine',
      iconColor: 'text-white',
      border: 'border-blush/10'
    }
  ];

  return (
    <div className="p-2 space-y-1">
      {/* Welcome Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <h2 className="font-serif text-lg text-warm-gray tracking-wide">Torah Learning</h2>
          {torahCompleted && (
            <Heart className="gradient-heart" size={20} />
          )}
        </div>
      </div>

      {/* Daily Inspiration - Pirkei Avot */}
      {pirkeiAvot && (
        <div className="bg-gradient-to-br from-ivory via-white to-lavender/10 rounded-3xl p-4 shadow-lg mb-3 border border-blush/15">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-gradient-feminine p-1.5 rounded-full">
              <Scroll className="text-white" size={16} />
            </div>
            <h3 className="font-serif text-sm text-warm-gray font-medium">Daily Inspiration</h3>
            <span className="text-xs text-warm-gray/60 font-sans">Pirkei Avot {pirkeiAvot.chapter}</span>
          </div>
          <p className="font-sans text-xs text-warm-gray/90 leading-relaxed text-justify">
            {pirkeiAvot.text}
          </p>
        </div>
      )}

      {/* Inspirational Quote */}
      {quote && (
        <div className="bg-gradient-soft rounded-3xl p-3 shadow-lg mb-3">
          <p className="font-sans text-xs text-warm-gray/80 italic text-center leading-relaxed">
            "{quote.text}"
          </p>
          <p className="font-serif text-xs text-warm-gray/60 text-center mt-2 tracking-wide">- {quote.source}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-1">
        {torahItems.map(({ id, icon: Icon, title, subtitle, gradient, iconBg, iconColor, border }) => (
          <button
            key={id}
            className={`${gradient} rounded-3xl p-3 text-center glow-hover transition-gentle shadow-lg border ${border}`}
            onClick={() => openModal(id)}
          >
            <div className={`${iconBg} p-2 rounded-full mx-auto mb-2 w-fit`}>
              <Icon className={`${iconColor}`} size={18} strokeWidth={1.5} />
            </div>
            <h3 className="font-serif text-xs text-warm-gray mb-1 tracking-wide">{title}</h3>
            <p className="font-sans text-xs text-warm-gray/60 leading-relaxed">{subtitle}</p>
          </button>
        ))}
      </div>

      {/* Bottom padding */}
      <div className="h-16"></div>
    </div>
  );
}

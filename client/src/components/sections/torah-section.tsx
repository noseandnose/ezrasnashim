import { Book, Heart, Play, Shield, BookOpen, Sparkles, Star, Scroll } from "lucide-react";
import { useModalStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import type { InspirationalQuote } from "@shared/schema";

export default function TorahSection() {
  const { openModal } = useModalStore();
  
  // Fetch today's inspirational quote
  const today = new Date().toISOString().split('T')[0];
  const { data: quote } = useQuery<InspirationalQuote>({
    queryKey: ['daily-quote', today],
    queryFn: async () => {
      const response = await fetch(`/api/quotes/daily/${today}`);
      if (!response.ok) return null;
      return response.json();
    }
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
        <h2 className="font-serif text-lg text-warm-gray mb-1 tracking-wide">Daily Torah Learning</h2>
      </div>

      {/* Inspirational Quote */}
      <div className="bg-gradient-soft rounded-3xl p-3 shadow-lg mb-3">
        <p className="font-sans text-xs text-warm-gray/80 italic text-center leading-relaxed">
          {quote ? `"${quote.text}"` : ""}
        </p>
        <p className="font-serif text-xs text-warm-gray/60 text-center mt-2 tracking-wide">{quote ? `- ${quote.source}` : ""}</p>
      </div>

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

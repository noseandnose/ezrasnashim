import { useState, useEffect } from "react";
import { Sparkles, Heart, Star, Crown } from "lucide-react";

interface DailyMotivationProps {
  className?: string;
}

export default function DailyMotivation({ className = "" }: DailyMotivationProps) {
  const [motivation, setMotivation] = useState<{
    message: string;
    icon: JSX.Element;
    color: string;
  } | null>(null);

  useEffect(() => {
    // Generate motivation based on current time and day
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    const motivations = [
      // Morning motivations
      ...(hour < 12 ? [
        {
          message: "Start your day with Torah wisdom",
          icon: <Star className="text-yellow-500" size={16} />,
          color: "bg-yellow-50 border-yellow-200 text-yellow-700"
        },
        {
          message: "Your morning prayers set the tone",
          icon: <Heart className="text-pink-500" size={16} />,
          color: "bg-pink-50 border-pink-200 text-pink-700"
        },
        {
          message: "A new day to give and grow",
          icon: <Sparkles className="text-blue-500" size={16} />,
          color: "bg-blue-50 border-blue-200 text-blue-700"
        }
      ] : []),
      
      // Afternoon motivations
      ...(hour >= 12 && hour < 18 ? [
        {
          message: "Keep your spiritual momentum strong",
          icon: <Crown className="text-purple-500" size={16} />,
          color: "bg-purple-50 border-purple-200 text-purple-700"
        },
        {
          message: "Midday is perfect for reflection",
          icon: <Heart className="text-teal-500" size={16} />,
          color: "bg-teal-50 border-teal-200 text-teal-700"
        }
      ] : []),
      
      // Evening motivations
      ...(hour >= 18 ? [
        {
          message: "End your day with gratitude",
          icon: <Sparkles className="text-orange-500" size={16} />,
          color: "bg-orange-50 border-orange-200 text-orange-700"
        },
        {
          message: "Evening prayers bring peace",
          icon: <Heart className="text-indigo-500" size={16} />,
          color: "bg-indigo-50 border-indigo-200 text-indigo-700"
        }
      ] : []),
      
      // Shabbat specific (Friday evening to Saturday evening)
      ...(dayOfWeek === 5 && hour >= 16 || dayOfWeek === 6 ? [
        {
          message: "Shabbat brings special blessing",
          icon: <Crown className="text-gold-500" size={16} />,
          color: "bg-amber-50 border-amber-200 text-amber-700"
        }
      ] : []),
      
      // General motivations
      {
        message: "Every mitzvah counts",
        icon: <Star className="text-green-500" size={16} />,
        color: "bg-green-50 border-green-200 text-green-700"
      },
      {
        message: "Your spiritual journey matters",
        icon: <Heart className="text-rose-500" size={16} />,
        color: "bg-rose-50 border-rose-200 text-rose-700"
      }
    ];
    
    // Select random motivation
    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];
    setMotivation(randomMotivation);
  }, []);

  if (!motivation) return null;

  return (
    <div className={`p-3 rounded-2xl border transition-all ${motivation.color} ${className}`}>
      <div className="flex items-center space-x-2">
        {motivation.icon}
        <span className="text-sm font-medium">
          {motivation.message}
        </span>
      </div>
    </div>
  );
}
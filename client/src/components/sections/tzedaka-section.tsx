import { Heart, BookOpen, Shield, Plus, HandHeart, Gift, Star, Sparkles, Target, Users, DollarSign, TrendingUp } from "lucide-react";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@shared/schema";
import type { Section } from "@/pages/home";

interface TzedakaSectionProps {
  onSectionChange?: (section: Section) => void;
}

export default function TzedakaSection({ onSectionChange }: TzedakaSectionProps) {
  const { openModal } = useModalStore();
  const { tzedakaCompleted, completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const [, setLocation] = useLocation();

  const handleTzedakaComplete = () => {
    if (tzedakaCompleted) return; // Prevent double execution
    
    completeTask('tzedaka');
    
    // Navigate back to home section to show progress
    if (onSectionChange) {
      onSectionChange('home');
    }
    
    // Check if all tasks are completed and show congratulations
    setTimeout(() => {
      if (checkAndShowCongratulations()) {
        openModal('congratulations');
      }
    }, 200);
  };

  // Fetch active campaign data
  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ['/api/campaigns/active'],
  });

  // Use default values for immediate display
  const campaignTitle = campaign?.title || "Sefer Torah for Ezrat Nashim";
  const currentAmount = campaign?.currentAmount || 85000;
  const goalAmount = campaign?.goalAmount || 150000;
  const progressPercentage = Math.round((currentAmount / goalAmount) * 100);

  const tzedakaOptions = [
    {
      id: "causes",
      icon: Shield,
      title: "Causes",
      description: "Support our partner causes including fertility support, women's abuse prevention, and kollels",
      color: "text-peach",
      bgColor: "bg-peach/10",
    },
    {
      id: "sponsor-day",
      icon: Heart,
      title: "Sponsor a Day",
      description: "Dedicate all Mitzvot done on the app - choose 1 day, 1 week, or 1 month",
      color: "text-sage",
      bgColor: "bg-sage/10",
    },
  ];

  return (
    <div className="p-2 space-y-1">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h2 className="font-serif text-lg text-warm-gray tracking-wide">Daily Tzedaka</h2>
          {tzedakaCompleted && (
            <Heart className="gradient-heart" size={20} />
          )}
        </div>
        <p className="font-sans text-warm-gray/70 text-xs">Supporting our community with love and generosity</p>
      </div>

      {/* Campaign Card with Progress Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-lg border border-blush/10">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gradient-feminine p-3 rounded-full">
            <BookOpen className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-serif text-lg text-warm-gray">{campaignTitle}</h3>
            <p className="font-sans text-sm text-warm-gray/70">Support our community</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="font-sans text-sm text-warm-gray/70">Progress</span>
              <span className="font-serif text-sm text-warm-gray">{progressPercentage}% Complete</span>
            </div>
            <span className="font-serif text-sm text-warm-gray">${currentAmount.toLocaleString()} / ${goalAmount.toLocaleString()}</span>
          </div>
          <div className="w-full bg-blush/20 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-feminine transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        <button 
          onClick={() => openModal('donate')}
          className="w-full mt-4 bg-gradient-feminine text-white rounded-2xl py-3 hover:opacity-90 transition-all duration-300 font-sans"
        >
          Donate Now
        </button>
      </div>

      {/* Tzedaka Options - Rectangle Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => openModal('donate')}
          className="bg-white rounded-3xl p-4 shadow-lg hover:scale-105 transition-all duration-300 border border-blush/10 text-left"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="bg-gradient-feminine p-2 rounded-full">
              <Shield className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif text-sm text-warm-gray mb-1">Support Causes</h3>
              <p className="font-sans text-xs text-warm-gray/70">Fertility support & kollels</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => openModal('sponsor-day')}
          className="bg-white rounded-3xl p-4 shadow-lg hover:scale-105 transition-all duration-300 border border-blush/10 text-left"
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="bg-gradient-feminine p-2 rounded-full">
              <Heart className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif text-sm text-warm-gray mb-1">Sponsor a Day</h3>
              <p className="font-sans text-xs text-warm-gray/70">Dedicate all mitzvot</p>
            </div>
          </div>
        </button>
      </div>

      {/* Gave Tzedaka Elsewhere Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-lg border border-blush/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${tzedakaCompleted ? 'bg-sage' : 'bg-gradient-feminine'}`}>
              <HandHeart className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif text-sm text-warm-gray">Gave Tzedaka elsewhere</h3>
              <p className="font-sans text-xs text-warm-gray/70">Mark as completed</p>
            </div>
          </div>
          <Button
            onClick={handleTzedakaComplete}
            className={`py-2 px-4 rounded-xl font-medium border-0 ${
              tzedakaCompleted 
                ? 'bg-sage text-white' 
                : 'bg-gradient-feminine text-white hover:opacity-90'
            }`}
          >
            {tzedakaCompleted ? 'Completed' : 'Complete'}
          </Button>
        </div>
      </div>

      {/* Community Impact */}
      <div className="bg-gradient-soft rounded-3xl p-3 border border-blush/10">
        <h3 className="font-serif text-sm text-black text-center mb-2">Community Impact</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-serif text-lg text-black">142</div>
            <div className="font-sans text-xs text-black">Days Sponsored</div>
          </div>
          <div>
            <div className="font-serif text-lg text-black">3</div>
            <div className="font-sans text-xs text-black">Campaigns</div>
          </div>
          <div>
            <div className="font-serif text-lg text-black">$24,580</div>
            <div className="font-sans text-xs text-black">Raised</div>
          </div>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-24"></div>
    </div>
  );
}

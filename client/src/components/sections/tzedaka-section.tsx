import { Heart, BookOpen, Shield, Plus, HandHeart, Gift, Star, Sparkles, Target, Users, DollarSign, TrendingUp, HandCoins } from "lucide-react";
import { useModalStore, useDailyCompletionStore, useDonationCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { playCoinSound } from "@/utils/sounds";
import type { Campaign } from "@shared/schema";
import type { Section } from "@/pages/home";

// Community Impact Blog-Style Button Component
function CommunityImpactButton() {
  const today = new Date().toISOString().split('T')[0];
  const { openModal } = useModalStore();
  
  const { data: impactContent, isLoading } = useQuery<{
    id: number;
    title: string;
    description: string;
    imageUrl: string;
  }>({
    queryKey: [`/api/community/impact/${today}`],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/community/impact/${today}`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 60 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-3 border border-blush/10 shadow-lg animate-pulse">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="flex-grow">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!impactContent) {
    return (
      <div className="bg-white rounded-3xl p-3 border border-blush/10 shadow-lg opacity-50">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center">
            <Users className="text-gray-400" size={20} />
          </div>
          <div className="flex-grow">
            <h3 className="platypi-bold text-sm text-black mb-1">Community Impact</h3>
            <p className="platypi-regular text-xs text-black/60">Check back for inspiring stories of where your Tzedaka went.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => openModal('community-impact', 'tzedaka')}
      className="w-full bg-white rounded-3xl p-3 border border-blush/10 shadow-lg hover:shadow-md transition-all duration-300 text-left"
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 flex-shrink-0">
          <img 
            src={impactContent.imageUrl} 
            alt={impactContent.title}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <div className="flex-grow">
          <h3 className="platypi-bold text-sm text-black mb-1 line-clamp-1">{impactContent.title}</h3>
          <p className="platypi-regular text-xs text-black/60 line-clamp-2">{impactContent.description}</p>
        </div>
      </div>
    </button>
  );
}

interface TzedakaSectionProps {
  onSectionChange?: (section: Section) => void;
}

// Individual tzedaka button types
type TzedakaButtonType = 'gave_elsewhere' | 'active_campaign' | 'put_a_coin' | 'sponsor_a_day';

export default function TzedakaSection({ onSectionChange }: TzedakaSectionProps) {
  const { openModal, activeModal } = useModalStore();
  const { tzedakaCompleted, completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { isCompleted: isDonationCompleted, resetDaily, addCompletedDonation } = useDonationCompletionStore();
  const [, setLocation] = useLocation();
  const [showExplosion, setShowExplosion] = useState(false);

  // Individual button completion tracking using localStorage with daily reset
  const getLocalDateString = () => {
    return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
  };

  const isTzedakaButtonCompleted = (buttonType: TzedakaButtonType): boolean => {
    const today = getLocalDateString();
    const completions = JSON.parse(localStorage.getItem('tzedaka_button_completions') || '{}');
    return completions[today]?.[buttonType] === true;
  };

  const markTzedakaButtonCompleted = (buttonType: TzedakaButtonType) => {
    const today = getLocalDateString();
    const completions = JSON.parse(localStorage.getItem('tzedaka_button_completions') || '{}');
    
    if (!completions[today]) {
      completions[today] = {};
    }
    
    completions[today][buttonType] = true;
    
    // Clean up old data (keep only last 2 days)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');
    
    Object.keys(completions).forEach(date => {
      if (date !== today && date !== yesterdayStr) {
        delete completions[date];
      }
    });
    
    localStorage.setItem('tzedaka_button_completions', JSON.stringify(completions));
  };

  // Reset explosion state when modal changes and check daily reset
  useEffect(() => {
    setShowExplosion(false);
    resetDaily(); // Reset donation completion tracking if new day
  }, [activeModal, resetDaily]);

  const handleTzedakaComplete = () => {
    if (tzedakaCompleted) return; // Prevent double execution
    
    // Play coin clink sound effect
    playCoinSound();
    
    setShowExplosion(true);
    // Mark gave-elsewhere as completed immediately (different from donation buttons)
    
    // Wait for animation to complete before proceeding
    setTimeout(() => {
      setShowExplosion(false); // Reset explosion state
      completeTask('tzedaka');
      
      // Navigate back to home section to show progress
      if (onSectionChange) {
        onSectionChange('home');
        // Also scroll to progress section
        setTimeout(() => {
          const progressElement = document.getElementById('daily-progress-garden');
          if (progressElement) {
            progressElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }
        }, 300);
      } else {
        // Fallback: redirect to home with scroll parameter
        window.location.hash = '#/?section=home&scrollToProgress=true';
      }
      
      // Check if all tasks are completed and show congratulations
      setTimeout(() => {
        if (checkAndShowCongratulations()) {
          openModal('congratulations', 'tzedaka');
        }
      }, 200);
    }, 500);
  };

  const handleTzedakaButtonClick = (buttonType: TzedakaButtonType) => {
    // Only prevent "gave_elsewhere" from being clicked again (it's a one-time acknowledgment)
    // Allow donation buttons to be clicked multiple times
    if (buttonType === 'gave_elsewhere' && isTzedakaButtonCompleted(buttonType)) {
      return;
    }
    
    if (buttonType === 'gave_elsewhere') {
      // No money - just confirm and mark complete
      playCoinSound();
      setShowExplosion(true);
      markTzedakaButtonCompleted(buttonType);
      
      // Navigate back to home section and scroll to progress
      setTimeout(() => {
        setShowExplosion(false);
        completeTask('tzedaka');
        
        if (onSectionChange) {
          onSectionChange('home');
          setTimeout(() => {
            const progressElement = document.getElementById('daily-progress-garden');
            if (progressElement) {
              progressElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
            }
          }, 300);
        }
        
        // Check if all tasks are completed and show congratulations
        setTimeout(() => {
          if (checkAndShowCongratulations()) {
            openModal('congratulations', 'tzedaka');
          }
        }, 200);
      }, 500);
    } else {
      // Money buttons - open appropriate modal for Stripe checkout
      let modalId = '';
      switch (buttonType) {
        case 'active_campaign':
          modalId = 'wedding-campaign';
          break;
        case 'put_a_coin':
          modalId = 'donate';
          break;
        case 'sponsor_a_day':
          modalId = 'sponsor-day';
          break;
      }
      openModal(modalId, 'tzedaka');
    }
  };

  const handleButtonClick = (buttonId: string) => {
    // Legacy function for backward compatibility
    openModal(buttonId, 'tzedaka');
  };

  // Fetch active campaign data
  const { data: campaign, isLoading } = useQuery<Campaign>({
    queryKey: ['/api/campaigns/active'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/active`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 60 minutes
  });

  // Only calculate progress when campaign data is loaded
  const progressPercentage = campaign ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100) : 0;

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
      description: "Dedicate all Mitzvas done on the app - choose 1 day, 1 week, or 1 month",
      color: "text-sage",
      bgColor: "bg-sage/10",
    },
  ];

  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Main Tzedaka Section - ONLY CAMPAIGN */}
      <div className="bg-gradient-soft rounded-b-3xl px-3 pt-3 pb-2 shadow-lg -mt-1">
        <button 
          onClick={() => handleTzedakaButtonClick('active_campaign')}
          className={`w-full rounded-2xl px-3 pt-3 pb-2 border border-blush/10 hover:bg-white/90 transition-all duration-300 text-left ${
            isTzedakaButtonCompleted('active_campaign') ? 'bg-sage/20' : 'bg-white/70'
          }`}
        >
        {isLoading ? (
          <div className="animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gray-200 p-3 rounded-full">
                <BookOpen className="text-gray-400" size={20} />
              </div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3"></div>
            </div>
            <div className="w-full mt-4 bg-gray-200 rounded-2xl py-3 h-12"></div>
          </div>
        ) : campaign ? (
          <>
            <div className="flex items-center space-x-3 mb-2 relative">
              <div className="bg-gradient-feminine p-3 rounded-full">
                <Target className="text-white" size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="platypi-bold text-lg text-black platypi-bold">{campaign.title}</h3>
                <p className="platypi-regular text-sm text-black/70">Campaign</p>
              </div>
              <div className="bg-gradient-feminine p-2 rounded-full shadow-lg">
                <HandCoins className="text-white" size={16} />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="platypi-regular text-sm text-black/70">Progress</span>
                  <span className="platypi-bold text-sm text-black">{progressPercentage}% Complete</span>
                </div>
                <span className="platypi-bold text-sm text-black">${campaign.currentAmount.toLocaleString()} / ${campaign.goalAmount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-blush/20 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-feminine transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </>
        ) : null}
        </button>
      </div>
      {/* 4 Tzedaka Action Buttons */}
      <div className="p-2 space-y-2">
        {/* Tax Deductible Information Bar */}
        <div className="bg-gradient-feminine rounded-2xl px-4 py-2 text-center shadow-lg border border-blush/10">
          <p className="platypi-bold text-sm text-white">
            All Donations are US Tax Deductible
          </p>
        </div>
        
        {/* 3 Equal-sized Tzedaka Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {/* Button 1: Gave Tzedaka Elsewhere (no money) */}
          <button
            onClick={() => handleTzedakaButtonClick('gave_elsewhere')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isTzedakaButtonCompleted('gave_elsewhere') ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className="heart-explosion-container relative">
              <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
                isTzedakaButtonCompleted('gave_elsewhere') ? 'bg-sage' : 'bg-gradient-feminine'
              }`}>
                <Gift className="text-white" size={18} strokeWidth={1.5} />
              </div>
              <h3 className="platypi-bold text-xs text-black mb-1">Gave Tzedaka Elsewhere</h3>
              <p className="platypi-regular text-xs text-black/60 leading-relaxed">
                {isTzedakaButtonCompleted('gave_elsewhere') ? 'Completed' : 'Mark as complete'}
              </p>
              <HeartExplosion trigger={showExplosion} />
            </div>
          </button>

          {/* Button 2: Put a Coin in Tzedaka (money) */}
          <button
            onClick={() => handleTzedakaButtonClick('put_a_coin')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isTzedakaButtonCompleted('put_a_coin') ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isTzedakaButtonCompleted('put_a_coin') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <HandCoins className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="platypi-bold text-xs text-black mb-1">Put a Coin</h3>
            <p className="platypi-regular text-xs text-black/60 leading-relaxed">
              {isTzedakaButtonCompleted('put_a_coin') ? 'Completed' : 'General donation'}
            </p>
          </button>

          {/* Button 3: Sponsor a Day (money + extra fields) */}
          <button
            onClick={() => handleTzedakaButtonClick('sponsor_a_day')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              isTzedakaButtonCompleted('sponsor_a_day') ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isTzedakaButtonCompleted('sponsor_a_day') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Star className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="platypi-bold text-xs text-black mb-1">Sponsor a Day</h3>
            <p className="platypi-regular text-xs text-black/60 leading-relaxed">
              {isTzedakaButtonCompleted('sponsor_a_day') ? 'Completed' : 'Dedicate mitzvas'}
            </p>
          </button>
        </div>

        {/* Community Impact */}
        <CommunityImpactButton />

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}

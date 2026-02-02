import { BookOpen, Target, Users, HandCoins } from "lucide-react";
import { useModalStore, useDailyCompletionStore, useDonationCompletionStore } from "@/lib/types";
import { useState, useEffect, memo } from "react";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { playCoinSound } from "@/utils/sounds";
import { useAnalytics } from "@/hooks/use-analytics";
import type { Section } from "@/pages/home";
import { useTzedakaSummary } from "@/hooks/use-tzedaka-summary";
import { triggerMitzvahSync } from "@/hooks/use-mitzvah-sync";
import { getLocalDateString } from "@/lib/dateUtils";

interface CommunityImpact {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

// Community Impact Blog-Style Button Component
function CommunityImpactButton({ impactContent, isLoading }: { impactContent: CommunityImpact | null | undefined; isLoading: boolean }) {
  const { openModal } = useModalStore();

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
      data-modal-type="community-impact"
      data-modal-section="tzedaka"
      data-testid="button-tzedaka-community-impact"
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 flex-shrink-0">
          <img 
            src={impactContent.imageUrl} 
            alt={impactContent.title}
            className="w-full h-full rounded-full object-cover"
            loading="lazy"
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

function TzedakaSectionComponent({ onSectionChange }: TzedakaSectionProps) {
  const { openModal, activeModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { resetDaily } = useDonationCompletionStore();
  const [showExplosion, setShowExplosion] = useState(false);
  const { trackEvent } = useAnalytics();

  // Individual button completion tracking using localStorage with daily reset

  const getTzedakaCompletions = (): Record<string, any> => {
    try {
      return JSON.parse(localStorage.getItem('tzedaka_button_completions') || '{}');
    } catch (e) {
      console.warn('Failed to parse tzedaka_button_completions');
      return {};
    }
  };

  const isTzedakaButtonCompleted = (buttonType: TzedakaButtonType): boolean => {
    const today = getLocalDateString();
    const completions = getTzedakaCompletions();
    // For gave_elsewhere, check if count > 0
    if (buttonType === 'gave_elsewhere') {
      return (completions[today]?.gave_elsewhere_count || 0) > 0;
    }
    return completions[today]?.[buttonType] === true;
  };

  const getGaveElsewhereCount = (): number => {
    const today = getLocalDateString();
    const completions = getTzedakaCompletions();
    return completions[today]?.gave_elsewhere_count || 0;
  };

  const markTzedakaButtonCompleted = (buttonType: TzedakaButtonType) => {
    const today = getLocalDateString();
    const completions = getTzedakaCompletions();
    
    if (!completions[today]) {
      completions[today] = {};
    }
    
    // For gave_elsewhere, increment count instead of setting boolean
    if (buttonType === 'gave_elsewhere') {
      completions[today].gave_elsewhere_count = (completions[today].gave_elsewhere_count || 0) + 1;
    } else {
      completions[today][buttonType] = true;
    }
    
    // Note: No longer pruning old data to preserve cloud-synced history
    // Historical data is needed for streak calculations and profile stats
    
    localStorage.setItem('tzedaka_button_completions', JSON.stringify(completions));
    
    // Trigger cloud sync for authenticated users
    triggerMitzvahSync();
  };

  // Reset explosion state when modal changes and check daily reset
  useEffect(() => {
    setShowExplosion(false);
    resetDaily(); // Reset donation completion tracking if new day
  }, [activeModal, resetDaily]);


  const handleTzedakaButtonClick = (buttonType: TzedakaButtonType) => {
    // Allow "gave_elsewhere" to be clicked multiple times - each counts as a mitzvah
    if (buttonType === 'gave_elsewhere') {
      // No money - just confirm and mark complete
      playCoinSound();
      setShowExplosion(true);
      markTzedakaButtonCompleted(buttonType);
      
      // Track tzedaka completion for stats
      trackEvent('tzedaka_completion', {
        buttonType: 'gave_elsewhere',
        amount: 0,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Navigate back to home section and scroll to progress
      setTimeout(() => {
        setShowExplosion(false);
        completeTask('tzedaka');
        
        // Check if all tasks are completed and show congratulations
        if (checkAndShowCongratulations('tzedaka')) {
          openModal('congratulations', 'tzedaka');
        } else {
          // Only navigate if congratulations wasn't shown
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
        }
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


  // Fetch all Tzedaka content in a single batched request (2 API calls → 1)
  const { data: tzedakaSummary, isLoading } = useTzedakaSummary();
  
  // Extract data from the batched response
  const campaign = tzedakaSummary?.campaign;
  const communityImpact = tzedakaSummary?.communityImpact;

  // Only calculate progress when campaign data is loaded
  const progressPercentage = campaign ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100) : 0;


  return (
    <div className="pb-20 relative overflow-hidden min-h-screen bg-gradient-soft" data-bridge-container>
      {/* Main Tzedaka Section */}
      <div 
        className="rounded-b-3xl px-3 pt-3 pb-2 relative"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          zIndex: 2
        }}
      >
        <button 
          onClick={() => handleTzedakaButtonClick('active_campaign')}
          className="w-full rounded-2xl px-3 pt-3 pb-2 border border-blush/10 hover:bg-white/90 transition-all duration-300 text-left bg-white/85"
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
              <div className="w-12 h-12 aspect-square flex items-center justify-center bg-gradient-feminine rounded-full flex-shrink-0">
                <Target className="text-white" size={24} />
              </div>
              <div className="flex-grow">
                <h3 className="platypi-bold text-lg text-black platypi-bold">{campaign.title}</h3>
                <p className="platypi-regular text-sm text-black/70">Campaign</p>
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
        
        {/* Put a Coin in Tzedaka - Long Bar style */}
        <button
          onClick={() => handleTzedakaButtonClick('put_a_coin')}
          className="w-full h-[88px] rounded-xl text-center hover:scale-[1.02] transition-all duration-300 shadow-lg border-2 bg-white border-blush/30"
          style={{
            animation: isTzedakaButtonCompleted('put_a_coin') 
              ? 'gentle-glow-green 3s ease-in-out infinite' 
              : 'gentle-glow-pink 3s ease-in-out infinite'
          }}
        >
          <div className="flex items-center justify-center space-x-4">
            <div className={`p-2 rounded-full ${
              isTzedakaButtonCompleted('put_a_coin') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <HandCoins className="text-white" size={24} strokeWidth={1.5} />
            </div>
            <div className="text-left">
              <h3 className="platypi-bold text-lg text-black">Put a Coin in Tzedaka</h3>
              <p className="platypi-regular text-sm text-black/60">
                {isTzedakaButtonCompleted('put_a_coin') ? 'Completed' : 'Approved Women Organizations and Kollels'}
              </p>
            </div>
          </div>
        </button>

        {/* Two Buttons Underneath - Apple Glass Style */}
        <div className="grid grid-cols-2 gap-2">
          {/* Left: Sponsor a Day */}
          <button
            onClick={() => handleTzedakaButtonClick('sponsor_a_day')}
            className="w-full h-[88px] rounded-xl p-4 text-center hover:scale-105 transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            <div 
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full mb-1.5"
              style={{
                background: isTzedakaButtonCompleted('sponsor_a_day')
                  ? 'rgba(139, 169, 131, 0.35)'
                  : 'linear-gradient(135deg, rgba(232, 180, 188, 0.35) 0%, rgba(200, 162, 200, 0.35) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }}
            >
              {isTzedakaButtonCompleted('sponsor_a_day') ? (
                <svg className="text-black" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <HandCoins className="text-black" size={12} />
              )}
              <p className="platypi-bold text-xs text-black">Sponsor a Day</p>
            </div>
            <p className="platypi-regular text-xs text-black leading-tight">
              {isTzedakaButtonCompleted('sponsor_a_day') ? 'Completed' : 'Dedicate mitzvas'}
            </p>
          </button>

          {/* Right: Gave Tzedaka Elsewhere */}
          <button
            onClick={() => handleTzedakaButtonClick('gave_elsewhere')}
            className="w-full h-[88px] rounded-xl p-4 text-center hover:scale-105 transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            <div className="heart-explosion-container relative">
              <div 
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full mb-1.5"
                style={{
                  background: isTzedakaButtonCompleted('gave_elsewhere')
                    ? 'rgba(139, 169, 131, 0.35)'
                    : 'linear-gradient(135deg, rgba(232, 180, 188, 0.35) 0%, rgba(200, 162, 200, 0.35) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                }}
              >
                {isTzedakaButtonCompleted('gave_elsewhere') ? (
                  <svg className="text-black" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <HandCoins className="text-black" size={12} />
                )}
                <p className="platypi-bold text-xs text-black">Gave Elsewhere</p>
              </div>
              <p className="platypi-regular text-xs text-black leading-tight">
                {getGaveElsewhereCount() > 0 ? `${getGaveElsewhereCount()}X today` : 'Mark as complete'}
              </p>
              <HeartExplosion trigger={showExplosion} />
            </div>
          </button>
        </div>

        {/* Community Impact */}
        <CommunityImpactButton impactContent={communityImpact} isLoading={isLoading} />

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}

export default memo(TzedakaSectionComponent);

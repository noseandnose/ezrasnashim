import { Heart, BookOpen, Shield, Plus, HandHeart, Gift, Star, Sparkles, Target, Users, DollarSign, TrendingUp, HandCoins } from "lucide-react";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import type { Campaign } from "@shared/schema";
import type { Section } from "@/pages/home";

// Community Impact Section Component
function CommunityImpactSection() {
  const { data: impact, isLoading } = useQuery<{
    totalDaysSponsored: number;
    totalCampaigns: number;
    totalRaised: number;
  }>({
    queryKey: ['/api/analytics/community-impact'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/community-impact`);
      if (!response.ok) throw new Error('Failed to fetch community impact');
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 60 minutes
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-3 border border-blush/10 shadow-lg">
        <h3 className="platypi-bold text-sm text-black text-center mb-2">Community Impact</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="platypi-regular text-xs text-black mt-1">Days Sponsored</div>
          </div>
          <div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="platypi-regular text-xs text-black mt-1">Campaigns</div>
          </div>
          <div>
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="platypi-regular text-xs text-black mt-1">Raised</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-3 border border-blush/10 shadow-lg">
      <h3 className="platypi-bold text-sm text-black text-center mb-2">Community Impact</h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="platypi-semibold text-lg text-black">{impact?.totalDaysSponsored || 0}</div>
          <div className="platypi-regular text-xs text-black">Days Sponsored</div>
        </div>
        <div>
          <div className="platypi-semibold text-lg text-black">{impact?.totalCampaigns || 0}</div>
          <div className="platypi-regular text-xs text-black">Campaigns</div>
        </div>
        <div>
          <div className="platypi-semibold text-lg text-black">${impact?.totalRaised?.toLocaleString() || 0}</div>
          <div className="platypi-regular text-xs text-black">Raised</div>
        </div>
      </div>
    </div>
  );
}

interface TzedakaSectionProps {
  onSectionChange?: (section: Section) => void;
}

export default function TzedakaSection({ onSectionChange }: TzedakaSectionProps) {
  const { openModal, activeModal } = useModalStore();
  const { tzedakaCompleted, completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const [, setLocation] = useLocation();
  const [showExplosion, setShowExplosion] = useState(false);
  const [completedButtons, setCompletedButtons] = useState<Set<string>>(new Set());

  // Reset explosion state when modal changes
  useEffect(() => {
    setShowExplosion(false);
  }, [activeModal]);

  const handleTzedakaComplete = () => {
    if (tzedakaCompleted) return; // Prevent double execution
    
    setShowExplosion(true);
    setCompletedButtons(prev => new Set(prev).add('gave-elsewhere'));
    
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
          openModal('congratulations');
        }
      }, 200);
    }, 500);
  };

  const handleButtonClick = (buttonId: string) => {
    setCompletedButtons(prev => new Set(prev).add(buttonId));
    openModal(buttonId);
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
      description: "Dedicate all Mitzvot done on the app - choose 1 day, 1 week, or 1 month",
      color: "text-sage",
      bgColor: "bg-sage/10",
    },
  ];

  return (
    <div className="overflow-y-auto h-full pb-20">
      {/* Main Tzedaka Section - ONLY CAMPAIGN */}
      <div className="bg-gradient-soft rounded-b-3xl p-3 shadow-lg -mt-1">
        <button 
          onClick={() => openModal('donate')}
          className="w-full bg-white/70 rounded-2xl p-3 border border-blush/10 hover:bg-white/90 transition-all duration-300 text-left"
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
            <div className="flex items-center space-x-3 mb-4 relative">
              <div className="bg-gradient-feminine p-3 rounded-full">
                <BookOpen className="text-white" size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="platypi-bold text-lg text-black font-bold">{campaign.title}</h3>
                <p className="platypi-regular text-sm text-black/70">Support our community</p>
              </div>
              <div className="bg-gradient-feminine p-2 rounded-full shadow-lg">
                <HandCoins className="text-white" size={16} />
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="platypi-regular text-sm text-black/70">Progress</span>
                  <span className="platypi-bold text-sm text-black font-bold">{progressPercentage}% Complete</span>
                </div>
                <span className="platypi-bold text-sm text-black font-bold">${campaign.currentAmount.toLocaleString()} / ${campaign.goalAmount.toLocaleString()}</span>
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
      {/* 3 Tzedaka Action Buttons */}
      <div className="p-2 space-y-2">
        {/* Large Combined Button: Put a coin in the Pushka */}
        <button
          onClick={() => openModal('donate')}
          className="w-full rounded-3xl p-4 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
        >
          <div className="p-3 rounded-full mx-auto mb-3 w-fit bg-gradient-feminine">
            <HandCoins className="text-white" size={24} strokeWidth={1.5} />
          </div>
          <h3 className="platypi-bold text-sm text-black mb-2 font-bold">Put a Coin in Tzedaka</h3>
          <p className="platypi-regular text-xs text-black/60 leading-relaxed">
            Donations go towards Woman in need and Torah Causes
          </p>
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* Button 2: Sponsor a Day */}
          <button
            onClick={() => handleButtonClick('sponsor-day')}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              completedButtons.has('sponsor-day') ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              completedButtons.has('sponsor-day') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Heart className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="platypi-bold text-xs text-black mb-1 font-bold">Sponsor a Day</h3>
            <p className="platypi-regular text-xs text-black/60 leading-relaxed">
              {completedButtons.has('sponsor-day') ? 'Completed' : 'Dedicate all mitzvot'}
            </p>
          </button>

          {/* Button 3: Gave Tzedaka Elsewhere */}
          <button
            onClick={handleTzedakaComplete}
            className={`rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 ${
              tzedakaCompleted || completedButtons.has('gave-elsewhere') ? 'bg-sage/20' : 'bg-white'
            }`}
          >
            <div className="heart-explosion-container relative">
              <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
                tzedakaCompleted || completedButtons.has('gave-elsewhere') ? 'bg-sage' : 'bg-gradient-feminine'
              }`}>
                <HandHeart className="text-white" size={18} strokeWidth={1.5} />
              </div>
              <h3 className="platypi-bold text-xs text-black mb-1 font-bold">Gave Tzedaka Elsewhere</h3>
              <p className="platypi-regular text-xs text-black/60 leading-relaxed">
                {tzedakaCompleted || completedButtons.has('gave-elsewhere') ? 'Completed' : 'Mark as complete'}
              </p>
              <HeartExplosion trigger={showExplosion} />
            </div>
          </button>
        </div>

        {/* Community Impact */}
        <CommunityImpactSection />

        {/* Bottom padding */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}

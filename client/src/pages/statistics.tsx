import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, Heart, ScrollText, TrendingUp, Calendar, ArrowLeft, Sun, Clock, Star, Shield, Sparkles, Clock3, HandCoins, DollarSign, Trophy, RefreshCw, HandHeart, Brain, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import type { Section } from "@/pages/home";
import BottomNavigation from "@/components/bottom-navigation";
import AppHeader from "@/components/app-header";
import { getLocalDateString } from "@/lib/dateUtils";

type TimePeriod = 'today' | 'week' | 'month' | 'alltime';

// Hook to track if page is visible and focused
function usePageVisible() {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return isVisible;
}

interface DailyStats {
  date: string;
  uniqueUsers: number;
  pageViews: number;
  tehillimCompleted: number;
  namesProcessed: number;
  booksCompleted: number;
  totalActs: number;
  meditationsCompleted: number;
  modalCompletions: Record<string, number>;
}

interface PeriodStats {
  totalUsers: number;
  totalPageViews: number;
  totalTehillimCompleted: number;
  totalNamesProcessed: number;
  totalBooksCompleted: number;
  totalActs: number;
  totalMeditationsCompleted: number;
  totalModalCompletions: Record<string, number>;
}

// Calculate the start of the current week (Sunday at 2 AM in local timezone)
function getWeekStartDate(): string {
  const now = new Date();
  const hours = now.getHours();
  
  // Create a date adjusted for 2 AM boundary
  const adjustedDate = new Date(now);
  if (hours < 2) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }
  
  // Find the most recent Sunday
  const dayOfWeek = adjustedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToSubtract = dayOfWeek; // If Sunday (0), subtract 0 days
  const weekStart = new Date(adjustedDate);
  weekStart.setDate(weekStart.getDate() - daysToSubtract);
  
  // Return as YYYY-MM-DD
  return weekStart.toISOString().split('T')[0];
}

interface StatisticsProps {
  initialPeriod?: TimePeriod;
}

export default function Statistics({ initialPeriod = 'today' }: StatisticsProps) {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(initialPeriod);
  const isPageVisible = usePageVisible();
  
  // Calculate today's analytics date once
  const analyticsToday = getLocalDateString(); // Use client's 2 AM boundary calculation
  const weekStartDate = getWeekStartDate(); // Calculate week start (Sunday 2 AM)
  
  // Fetch today's stats - only fetch when 'today' is selected (lazy loading)
  const { data: todayStats, isLoading: todayLoading } = useQuery<DailyStats>({
    queryKey: [`/api/analytics/stats/today?date=${analyticsToday}`],
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: isPageVisible && selectedPeriod === 'today' ? 120000 : false,
    refetchOnWindowFocus: false,
    enabled: selectedPeriod === 'today', // Only fetch when selected
  });

  // Fetch weekly stats - only fetch when 'week' is selected
  const { data: weeklyStats, isLoading: weeklyLoading } = useQuery<PeriodStats>({
    queryKey: [`/api/analytics/stats/week?startDate=${weekStartDate}`],
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: isPageVisible && selectedPeriod === 'week' ? 120000 : false,
    refetchOnWindowFocus: false,
    enabled: selectedPeriod === 'week', // Only fetch when selected
  });

  // Fetch monthly stats - only fetch when 'month' is selected
  const { data: monthlyStats, isLoading: monthlyLoading } = useQuery<PeriodStats>({
    queryKey: ["/api/analytics/stats/month"],
    staleTime: 60000,
    gcTime: 300000,
    refetchInterval: isPageVisible && selectedPeriod === 'month' ? 120000 : false,
    refetchOnWindowFocus: false,
    enabled: selectedPeriod === 'month', // Only fetch when selected
  });

  // Fetch total stats - only fetch when 'alltime' is selected
  const { data: totalStats, isLoading: totalLoading } = useQuery<PeriodStats>({
    queryKey: ["/api/analytics/stats/total"],
    staleTime: 60000,
    gcTime: 300000,
    refetchInterval: isPageVisible && selectedPeriod === 'alltime' ? 120000 : false,
    refetchOnWindowFocus: false,
    enabled: selectedPeriod === 'alltime', // Only fetch when selected
  });

  // Fetch active campaigns (chains) count
  const { data: activeCampaignsData } = useQuery<{ count: number }>({
    queryKey: ["/api/tehillim-chains/stats/active-count"],
    staleTime: 60000,
    gcTime: 300000,
  });
  const activeCampaigns = activeCampaignsData?.count || 0;

  // Get current data based on selected period
  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'today':
        return { data: todayStats, isLoading: todayLoading };
      case 'week':
        return { data: weeklyStats, isLoading: weeklyLoading };
      case 'month':
        return { data: monthlyStats, isLoading: monthlyLoading };
      case 'alltime':
        return { data: totalStats, isLoading: totalLoading };
      default:
        return { data: todayStats, isLoading: todayLoading };
    }
  };

  const currentDataResult = getCurrentData();
  const { data: currentData, isLoading: currentLoading } = currentDataResult;

  // Refresh function for manual refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // TOTAL CACHE CLEAR: Force page reload to guarantee fresh data
    window.location.reload();
  };




  // Handler for bottom navigation - navigate back to home page with section
  const handleSectionChange = (section: Section) => {
    // For all sections, go back to home page and let the home page handle section navigation
    setLocation(`/?section=${section}`);
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) => (
    <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-xs platypi-medium text-warm-gray text-right">{title}</span>
      </div>
      <div className="text-2xl platypi-bold text-black text-center">{value}</div>
    </div>
  );

  const modalTypeNames: Record<string, string> = {
    // Main categories
    torah: "Torah",
    tefilla: "Tefilla", 
    tzedaka: "Tzedaka",
    "shabbat-table": "Shabbat Table",
    congratulations: "All Tasks Complete",
    
    // Prayer subcategories
    "morning-brochas": "Morning Brochas",
    "brochas": "Brochas",
    mincha: "Mincha",
    maariv: "Maariv",
    nishmas: "Nishmas",
    "birkat-hamazon": "Birkat Hamazon",
    "tehillim": "Tehillim",
    "individual-tehillim": "Individual Tehillim",
    "tehillim-chains": "Tehillim Chains",
    "special-tehillim": "Special Tehillim", 
    "nishmas-campaign": "Nishmas Kol Chai",
    "al-hamichiya": "Al Hamichiya",
    "individual-prayer": "Individual Prayer",
    
    // Torah subcategories  
    chizuk: "Chizuk",
    emuna: "Emuna", 
    halacha: "Halacha",
    "featured-content": "Featured Content",
    featured: "Featured",
    "parsha-vort": "Parsha Shiur",
    "pirkei-avot": "Pirkei Avot",
    "gems-of-gratitude": "Gems of Gratitude",
    
    // Life section
    recipe: "Daily Recipe",
    inspiration: "Creative Jewish Living",
    "sponsor-day": "Day Sponsorship",
    refuah: "Refuah Names",
    "womens-prayer": "Women's Prayers",
    "life-class": "Life Class",

    // Other
    donate: "Donations",
    meditation: "Meditations",
    
    // Feature usage (with feature: prefix)
    "feature:marriage-insights": "Marriage Insights",
  };

  const modalTypeIcons: Record<string, any> = {
    // Main categories
    torah: BookOpen,
    tefilla: Heart, 
    tzedaka: HandCoins,
    "shabbat-table": Sparkles,
    congratulations: Star,
    
    // Prayer subcategories
    "morning-brochas": Sun,
    "brochas": Heart,
    mincha: Clock,
    maariv: Star,
    nishmas: Heart,
    
    // Torah subcategories
    "parsha-vort": BookOpen,
    "birkat-hamazon": Clock3,
    "global-tehillim-chain": ScrollText,
    "tehillim-text": ScrollText, // Legacy key for existing data
    "special-tehillim": Star,
    "individual-tehillim": ScrollText,
    "tehillim-chains": Link2,  // Chain icon for tehillim chains
    "nishmas-campaign": Heart,
    "al-hamichiya": Clock3,
    "individual-prayer": Heart,
    "womens-prayer": HandHeart,
    
    // Torah subcategories  
    chizuk: Heart,
    emuna: Shield,
    "gems-of-gratitude": Sparkles,
    halacha: BookOpen,
    "featured-content": Star,
    featured: Star,
    "pirkei-avot": ScrollText,
    
    // Life section
    recipe: Sparkles,
    inspiration: Star,
    "sponsor-day": Trophy,
    refuah: Heart,
    "life-class": BookOpen,
    
    // Other
    donate: HandCoins,
    meditation: Brain,
    
    // Feature usage (with feature: prefix)
    "feature:marriage-insights": Heart,
  };

  // Financial Stats Component
  function FinancialStatsSection({ period, isVisible }: { period: 'today' | 'week' | 'month' | 'alltime'; isVisible: boolean }) {
    const { data: financialStats, isLoading: financialLoading } = useQuery<{
      totalDaysSponsored: number;
      totalCampaigns: number;
      totalRaised: number;
    }>({
      queryKey: [`/api/analytics/community-impact?period=${period}`],
      staleTime: 60000, // 1 minute
      gcTime: 300000, // Keep in memory for 5 minutes
      refetchInterval: isVisible ? 120000 : false, // Only refresh when page is visible
      refetchOnWindowFocus: false,
    });

    return (
      <div>
        <h2 className="text-base platypi-bold text-black mb-3">Financial Impact</h2>
        <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-5 w-5 text-blush" />
              </div>
              <div className="text-lg platypi-bold text-black">
                {financialLoading ? "..." : financialStats?.totalCampaigns?.toLocaleString() || 0}
              </div>
              <div className="text-xs platypi-medium text-warm-gray">Donations</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-sage" />
              </div>
              <div className="text-lg platypi-bold text-black">
                {financialLoading ? "..." : financialStats?.totalDaysSponsored?.toLocaleString() || 0}
              </div>
              <div className="text-xs platypi-medium text-warm-gray">Days Sponsored</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-peach" />
              </div>
              <div className="text-lg platypi-bold text-black">
                ${financialLoading ? "..." : financialStats?.totalRaised?.toLocaleString() || 0}
              </div>
              <div className="text-xs platypi-medium text-warm-gray">Money Raised</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app min-h-screen w-full bg-white relative flex flex-col">
      <AppHeader />
      
      <main className="content-area pb-[calc(var(--footer-total-height)+1rem)]" data-scroll-lock-target>
        {/* Back button and title in content area */}
        <div className="bg-gradient-soft rounded-b-3xl px-4 pt-4 pb-4 mb-4 border-0 shadow-none -mt-2">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setLocation("/")}
              className="p-2 rounded-full hover:bg-white/50 transition-colors"
              aria-label="Back to Home"
            >
              <ArrowLeft className="h-5 w-5 text-black/70" />
            </button>
            <h1 
              className="platypi-semibold text-xl text-black tracking-wide cursor-pointer hover:text-black/80 transition-colors"
              onClick={scrollToTop}
            >
              Analytics Dashboard
            </h1>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-white/50 transition-all duration-200"
              aria-label="Refresh Analytics"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 text-black/70 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          {/* Time Period Selector */}
          <div className="flex bg-white/20 rounded-xl p-1 mb-4">
            <Button
              onClick={() => setSelectedPeriod('today')}
              variant={selectedPeriod === 'today' ? 'default' : 'ghost'}
              className={`flex-1 rounded-lg text-xs h-10 ${
                selectedPeriod === 'today' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-black/70 hover:text-black hover:bg-white/10'
              }`}
            >
              Today
            </Button>
            <Button
              onClick={() => setSelectedPeriod('week')}
              variant={selectedPeriod === 'week' ? 'default' : 'ghost'}
              className={`flex-1 rounded-lg text-xs h-10 ${
                selectedPeriod === 'week' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-black/70 hover:text-black hover:bg-white/10'
              }`}
            >
              This Week
            </Button>
            <Button
              onClick={() => setSelectedPeriod('month')}
              variant={selectedPeriod === 'month' ? 'default' : 'ghost'}
              className={`flex-1 rounded-lg text-xs h-10 ${
                selectedPeriod === 'month' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-black/70 hover:text-black hover:bg-white/10'
              }`}
            >
              This Month
            </Button>
            <Button
              onClick={() => setSelectedPeriod('alltime')}
              variant={selectedPeriod === 'alltime' ? 'default' : 'ghost'}
              className={`flex-1 rounded-lg text-xs h-10 ${
                selectedPeriod === 'alltime' 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-black/70 hover:text-black hover:bg-white/10'
              }`}
            >
              All Time
            </Button>
          </div>

          {/* Period-Specific Stats */}
          <h2 className="text-base platypi-bold text-black mb-3">
            {selectedPeriod === 'today' ? "Today's Activity" : 
             selectedPeriod === 'week' ? "This Week's Activity" :
             selectedPeriod === 'month' ? "This Month's Activity" : 
             "All Time Activity"}
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Mitzvas Completed - with drop shadow animation */}
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10"
                 style={{
                   animation: 'gentle-glow-pink 3s ease-in-out infinite'
                 }}>
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-blush" />
                <span className="text-xs platypi-medium text-warm-gray text-right">Mitzvas Completed</span>
              </div>
              <div className="text-2xl platypi-bold text-black text-center">
                {currentLoading ? "..." : ((currentData as any)?.totalActs || 0).toLocaleString()}
              </div>
            </div>
            <StatCard
              title="Women Visited"
              value={currentLoading ? "..." : (currentData as any)?.totalUsers?.toLocaleString() || (currentData as any)?.uniqueUsers || 0}
              icon={Users}
              color="text-peach"
            />
            <StatCard
              title="Tehillim Said"
              value={currentLoading ? "..." : (() => {
                // Server-side analytics: no dedup needed because analytics only tracks once per completion
                // (global-tehillim-chain for new, tehillim-text for historical)
                const modalCompletions = (currentData as any)?.totalModalCompletions || (currentData as any)?.modalCompletions || {};
                const globalTehillimChain = modalCompletions['global-tehillim-chain'] || 0;
                const globalTehillimText = modalCompletions['tehillim-text'] || 0;
                const chainTehillim = modalCompletions['chain-tehillim'] || 0;
                const specialTehillim = modalCompletions['special-tehillim'] || 0;
                const individualTehillim = Object.keys(modalCompletions).filter(key => key.startsWith('individual-tehillim')).reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
                
                // Include all tehillim types (global, chain campaigns, special, individual)
                const totalTehillim = globalTehillimChain + globalTehillimText + chainTehillim + specialTehillim + individualTehillim;
                return totalTehillim.toLocaleString();
              })()}
              icon={ScrollText}
              color="text-lavender"
            />
            <StatCard
              title="Tehillim Chains"
              value={activeCampaigns.toLocaleString()}
              icon={Heart}
              color="text-sage"
            />
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Feature Usage */}
          <div key={`feature-usage-${selectedPeriod}`}>
            <h2 className="text-base platypi-bold text-black mb-3">Feature Usage</h2>
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10">
              {currentLoading ? (
                <div className="text-center text-black/60">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {(() => {
                    const modalCompletions = (currentData as any)?.totalModalCompletions || (currentData as any)?.modalCompletions || {};
                    
                    // Create a processed entries array with tehillim split into Individual vs Chains
                    const processedEntries: Array<[string, number]> = [];
                    let individualTehillimTotal = 0;
                    let tehillimChainsTotal = 0;
                    let womensPrayerTotal = 0;
                    let brochasTotal = 0;

                    // Process all modal completion entries
                    // Note: Server-side analytics doesn't have dual-write issue - each completion is tracked once
                    // (global-tehillim-chain for new completions, tehillim-text for historical)
                    Object.entries(modalCompletions).forEach(([modalType, count]) => {
                      if (modalType.startsWith('individual-tehillim-') || modalType === 'individual-tehillim') {
                        // Individual Tehillim (from tehillim selector)
                        individualTehillimTotal += (count as number) || 0;
                      } else if (modalType === 'global-tehillim-chain' || modalType === 'tehillim-text' ||
                          modalType === 'chain-tehillim' || modalType.startsWith('chain-tehillim-')) {
                        // Tehillim Chains (global chain and personal chains)
                        tehillimChainsTotal += (count as number) || 0;
                      } else if (modalType === 'tzedaka' || modalType === 'donate') {
                        // Skip tzedaka modals - we'll aggregate them separately with tzedakaActs
                      } else if (modalType.startsWith('womens-prayer-')) {
                        // Aggregate womens prayers
                        womensPrayerTotal += (count as number) || 0;
                      } else if (modalType.startsWith('brocha-')) {
                        // Aggregate individual brocha completions
                        brochasTotal += (count as number) || 0;
                      } else if (modalType.startsWith('meditation-') || modalType === 'meditation') {
                        // Skip individual meditation completions - we'll use the meditationsCompleted field instead
                      } else if (modalTypeNames[modalType] && !['unknown', 'test', ''].includes(modalType.toLowerCase())) {
                        // Include regular modal types that have names
                        processedEntries.push([modalType, count as number]);
                      }
                    });
                    
                    // Add individual tehillim if there are any
                    if (individualTehillimTotal > 0) {
                      processedEntries.push(['individual-tehillim', individualTehillimTotal]);
                    }
                    
                    // Add tehillim chains if there are any
                    if (tehillimChainsTotal > 0) {
                      processedEntries.push(['tehillim-chains', tehillimChainsTotal]);
                    }

                    if (womensPrayerTotal > 0) {
                      processedEntries.push(['womens-prayer', womensPrayerTotal]);
                    }
                    
                    // Add aggregated brochas if there are any
                    if (brochasTotal > 0) {
                      processedEntries.push(['brochas', brochasTotal]);
                    }

                    // Add tzedaka acts from the tzedakaActs field (includes "Gave Elsewhere")
                    const tzedakaActs = selectedPeriod === 'today' 
                      ? (currentData as any)?.tzedakaActs || 0
                      : (currentData as any)?.totalTzedakaActs || 0;
                    
                    // Also check if there's a tzedaka modal completion to add to it
                    // const tzedakaModalCount = modalCompletions['tzedaka'] || modalCompletions['donate'] || 0;
                    // Above is double tracking, since tzedaka acts are all counted in tzedakaActs
                    const totalTzedaka = tzedakaActs;
                    
                    if (totalTzedaka > 0) {
                      processedEntries.push(['tzedaka', totalTzedaka]);
                    }

                    // Add meditation completions from the meditationsCompleted field
                    const meditationCompletions = selectedPeriod === 'today'
                      ? (currentData as any)?.meditationsCompleted || 0
                      : (currentData as any)?.totalMeditationsCompleted || 0;
                    
                    if (meditationCompletions > 0) {
                      processedEntries.push(['meditation', meditationCompletions]);
                    }
                    
                    return processedEntries
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([modalType, count], index) => {
                        const Icon = modalTypeIcons[modalType] || BookOpen;
                        return (
                          <div key={`${selectedPeriod}-${modalType}-${index}`} className="flex justify-between items-center py-1">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-blush" />
                              <span className="text-xs platypi-medium text-warm-gray">
                                {modalTypeNames[modalType]}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-black">{count.toLocaleString()}</span>
                          </div>
                        );
                      });
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Financial Stats */}
          <FinancialStatsSection period={selectedPeriod} isVisible={isPageVisible} />
        </div>
      </main>

      <BottomNavigation 
        activeSection={null} 
        onSectionChange={handleSectionChange} 
      />
    </div>
  );
}
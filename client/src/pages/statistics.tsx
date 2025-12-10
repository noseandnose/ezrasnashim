import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, BookOpen, Heart, ScrollText, TrendingUp, Calendar, ArrowLeft, Sun, Clock, Star, Shield, Sparkles, Clock3, HandCoins, DollarSign, Trophy, RefreshCw, HandHeart, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import type { Section } from "@/pages/home";
import BottomNavigation from "@/components/bottom-navigation";
import AppHeader from "@/components/app-header";
import { getLocalDateString } from "@/lib/dateUtils";

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

type TimePeriod = 'today' | 'week' | 'month' | 'alltime';

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

export default function Statistics() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const queryClient = useQueryClient();
  const isPageVisible = usePageVisible();
  
  // Calculate today's analytics date once
  const analyticsToday = getLocalDateString(); // Use client's 2 AM boundary calculation
  const weekStartDate = getWeekStartDate(); // Calculate week start (Sunday 2 AM)
  
  // Invalidate queries on mount only (not on every period change)
  useEffect(() => {
    // Only invalidate once when component mounts
    queryClient.invalidateQueries({ queryKey: [`/api/analytics/stats/today?date=${analyticsToday}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/analytics/stats/week?startDate=${weekStartDate}`] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats/month"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats/total"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Fetch today's stats - always refetch on mount to get fresh data after chain completions
  const { data: todayStats, isLoading: todayLoading } = useQuery<DailyStats>({
    queryKey: [`/api/analytics/stats/today?date=${analyticsToday}`],
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in memory for 5 minutes
    refetchInterval: isPageVisible && selectedPeriod === 'today' ? 120000 : false, // Only auto-refresh when visible and selected
    refetchOnWindowFocus: false, // Don't refetch on every focus
    refetchOnMount: 'always', // Always refetch when page is visited to show fresh stats
  });

  // Fetch weekly stats - always refetch on mount to get fresh data after chain completions
  const { data: weeklyStats, isLoading: weeklyLoading } = useQuery<PeriodStats>({
    queryKey: [`/api/analytics/stats/week?startDate=${weekStartDate}`],
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 300000, // Keep in memory for 5 minutes
    refetchInterval: isPageVisible && selectedPeriod === 'week' ? 120000 : false,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Always refetch when page is visited to show fresh stats
  });

  // Fetch monthly stats - always refetch on mount to get fresh data after chain completions
  const { data: monthlyStats, isLoading: monthlyLoading } = useQuery<PeriodStats>({
    queryKey: ["/api/analytics/stats/month"],
    staleTime: 60000, // Monthly data can be stale for 1 minute
    gcTime: 300000, // Keep in memory for 5 minutes
    refetchInterval: isPageVisible && selectedPeriod === 'month' ? 120000 : false,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Always refetch when page is visited to show fresh stats
  });

  // Fetch total stats - always refetch on mount to get fresh data after chain completions
  const { data: totalStats, isLoading: totalLoading } = useQuery<PeriodStats>({
    queryKey: ["/api/analytics/stats/total"],
    staleTime: 60000, // Total data can be stale for 1 minute
    gcTime: 300000, // Keep in memory for 5 minutes
    refetchInterval: isPageVisible && selectedPeriod === 'alltime' ? 120000 : false,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always', // Always refetch when page is visited to show fresh stats
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
    
    // Life section
    recipe: "Daily Recipe",
    inspiration: "Creative Jewish Living",
    "sponsor-day": "Day Sponsorship",
    refuah: "Refuah Names",
    "womens-prayer": "Women's Prayers",

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
    "nishmas-campaign": Heart,
    "al-hamichiya": Clock3,
    "individual-prayer": Heart,
    "womens-prayer": HandHeart,
    
    // Torah subcategories  
    chizuk: Heart,
    emuna: Shield,
    halacha: BookOpen,
    "featured-content": Star,
    featured: Star,
    "pirkei-avot": ScrollText,
    
    // Life section
    recipe: Sparkles,
    inspiration: Star,
    "sponsor-day": Trophy,
    refuah: Heart,
    
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
                    
                    // Create a processed entries array with tehillim aggregated
                    const processedEntries: Array<[string, number]> = [];
                    let tehillimTotal = 0;
                    let womensPrayerTotal = 0;
                    let brochasTotal = 0;

                    // Process all modal completion entries
                    Object.entries(modalCompletions).forEach(([modalType, count]) => {
                      if (modalType.startsWith('individual-tehillim-') || modalType === 'individual-tehillim' ||
                          modalType === 'global-tehillim-chain' || modalType === 'tehillim-text' ||
                          modalType === 'chain-tehillim') {
                        // Aggregate all tehillim types into one
                        tehillimTotal += (count as number) || 0;
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
                    
                    // Add aggregated tehillim if there are any
                    if (tehillimTotal > 0) {
                      processedEntries.push(['tehillim', tehillimTotal]);
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
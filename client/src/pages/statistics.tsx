import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, Heart, ScrollText, TrendingUp, Calendar, ArrowLeft, Sun, Clock, Star, Shield, Sparkles, Clock3, HandCoins, DollarSign, Trophy, RefreshCw, HandHeart, Brain, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import type { Section } from "@/pages/home";
import BottomNavigation from "@/components/bottom-navigation";
import AppHeader from "@/components/app-header";
import { getLocalDateString } from "@/lib/dateUtils";
import logoImage from "@assets/A_project_of_(4)_1764762086237.png";
import torahFlower from "@assets/Torah_1767035380484.png";
import tefillaFlower from "@assets/Tefilla_1767035380485.png";
import tzedakaFlower from "@assets/Tzedaka_1767035380485.png";
import lifeFlower from "@assets/Life_1767176917530.png";

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
  simplified?: boolean;
}

export default function Statistics({ initialPeriod = 'today', simplified = false }: StatisticsProps) {
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

  // Fetch total stats - always fetch for progress bar
  const { data: totalStats, isLoading: totalLoading } = useQuery<PeriodStats>({
    queryKey: ["/api/analytics/stats/total"],
    staleTime: 60000,
    gcTime: 300000,
    refetchInterval: isPageVisible ? 120000 : false,
    refetchOnWindowFocus: false,
    enabled: true, // Always fetch for progress bar
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

  // Helper function to calculate Torah completions
  const getTorahTotal = (modalCompletions: Record<string, number>) => {
    const torahKeys = ['chizuk', 'emuna', 'halacha', 'featured', 'featured-content', 'parsha-vort', 'pirkei-avot', 'gems-of-gratitude', 'torah-challenge'];
    return torahKeys.reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
  };

  // Helper function to calculate Tefilla completions
  const getTefillaTotal = (modalCompletions: Record<string, number>) => {
    const tefillaKeys = ['morning-brochas', 'mincha', 'maariv', 'nishmas', 'birkat-hamazon', 'tehillim', 'special-tehillim', 'nishmas-campaign', 'al-hamichiya', 'individual-prayer'];
    let total = tefillaKeys.reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
    // Add individual tehillim
    total += Object.keys(modalCompletions).filter(key => key.startsWith('individual-tehillim')).reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
    // Add tehillim chains
    total += (modalCompletions['global-tehillim-chain'] || 0) + (modalCompletions['tehillim-text'] || 0) + (modalCompletions['chain-tehillim'] || 0);
    // Add brochas
    total += Object.keys(modalCompletions).filter(key => key.startsWith('brocha-')).reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
    // Add women's prayers
    total += Object.keys(modalCompletions).filter(key => key.startsWith('womens-prayer')).reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
    return total;
  };

  // Helper function to calculate Tzedaka completions  
  const getTzedakaTotal = (data: any, isToday: boolean) => {
    const tzedakaActs = isToday ? (data?.tzedakaActs || 0) : (data?.totalTzedakaActs || 0);
    return tzedakaActs;
  };

  // Calculate total mitzvas for progress bar (always from alltime)
  const totalMitzvas = (totalStats as any)?.totalActs || 0;
  const goalMitzvas = 1000000;
  const progressPercent = Math.min((totalMitzvas / goalMitzvas) * 100, 100);

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
    "torah-challenge": "Bitachon Challenge",
    
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
    "feature:gift-of-chatzos": "Gift of Chatzos",
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
    "torah-challenge": Trophy,
    
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
    "feature:gift-of-chatzos": Star,
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

  // Simplified view for office display - just 4 big stats
  if (simplified) {
    return (
      <div className="min-h-screen w-full bg-gradient-soft flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Large prominent purple flowers */}
        <img src={tefillaFlower} alt="" className="absolute top-4 left-2 w-24 h-24 opacity-55 pointer-events-none" style={{ transform: 'rotate(-12deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-8 right-4 w-28 h-28 opacity-50 pointer-events-none" style={{ transform: 'rotate(15deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute bottom-20 left-4 w-26 h-26 opacity-50 pointer-events-none" style={{ transform: 'rotate(25deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute bottom-16 right-2 w-24 h-24 opacity-55 pointer-events-none" style={{ transform: 'rotate(-18deg)' }} />
        
        {/* Medium flowers scattered around */}
        <img src={torahFlower} alt="" className="absolute top-20 left-8 w-16 h-16 opacity-45 pointer-events-none" style={{ transform: 'rotate(-25deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute top-28 right-10 w-14 h-14 opacity-40 pointer-events-none" style={{ transform: 'rotate(30deg)' }} />
        <img src={lifeFlower} alt="" className="absolute top-1/4 left-1 w-18 h-18 opacity-45 pointer-events-none" style={{ transform: 'rotate(8deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-1/4 right-1 w-20 h-20 opacity-45 pointer-events-none" style={{ transform: 'rotate(-22deg)' }} />
        <img src={torahFlower} alt="" className="absolute top-1/3 left-6 w-14 h-14 opacity-40 pointer-events-none" style={{ transform: 'rotate(18deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute top-1/3 right-8 w-16 h-16 opacity-42 pointer-events-none" style={{ transform: 'rotate(-15deg)' }} />
        <img src={lifeFlower} alt="" className="absolute top-2/5 left-2 w-12 h-12 opacity-38 pointer-events-none" style={{ transform: 'rotate(12deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-2/5 right-4 w-18 h-18 opacity-45 pointer-events-none" style={{ transform: 'rotate(-8deg)' }} />
        
        {/* Middle section flowers */}
        <img src={torahFlower} alt="" className="absolute top-1/2 left-0 w-14 h-14 opacity-35 pointer-events-none" style={{ transform: 'rotate(5deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-1/2 right-0 w-20 h-20 opacity-45 pointer-events-none" style={{ transform: 'rotate(-10deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute top-[55%] left-4 w-12 h-12 opacity-38 pointer-events-none" style={{ transform: 'rotate(22deg)' }} />
        <img src={lifeFlower} alt="" className="absolute top-[55%] right-6 w-14 h-14 opacity-40 pointer-events-none" style={{ transform: 'rotate(-20deg)' }} />
        
        {/* Lower section flowers */}
        <img src={tefillaFlower} alt="" className="absolute top-2/3 left-2 w-18 h-18 opacity-42 pointer-events-none" style={{ transform: 'rotate(-14deg)' }} />
        <img src={torahFlower} alt="" className="absolute top-2/3 right-2 w-16 h-16 opacity-40 pointer-events-none" style={{ transform: 'rotate(28deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute top-[70%] left-6 w-14 h-14 opacity-38 pointer-events-none" style={{ transform: 'rotate(10deg)' }} />
        <img src={lifeFlower} alt="" className="absolute top-[70%] right-8 w-12 h-12 opacity-35 pointer-events-none" style={{ transform: 'rotate(-25deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-3/4 left-0 w-16 h-16 opacity-40 pointer-events-none" style={{ transform: 'rotate(20deg)' }} />
        <img src={torahFlower} alt="" className="absolute top-3/4 right-0 w-14 h-14 opacity-38 pointer-events-none" style={{ transform: 'rotate(-12deg)' }} />
        
        {/* Bottom flowers */}
        <img src={tzedakaFlower} alt="" className="absolute bottom-40 left-8 w-12 h-12 opacity-35 pointer-events-none" style={{ transform: 'rotate(15deg)' }} />
        <img src={lifeFlower} alt="" className="absolute bottom-44 right-6 w-14 h-14 opacity-38 pointer-events-none" style={{ transform: 'rotate(-18deg)' }} />
        <img src={torahFlower} alt="" className="absolute bottom-32 left-2 w-16 h-16 opacity-40 pointer-events-none" style={{ transform: 'rotate(-8deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute bottom-36 right-2 w-18 h-18 opacity-42 pointer-events-none" style={{ transform: 'rotate(22deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute bottom-8 left-10 w-14 h-14 opacity-45 pointer-events-none" style={{ transform: 'rotate(30deg)' }} />
        <img src={lifeFlower} alt="" className="absolute bottom-4 right-10 w-12 h-12 opacity-40 pointer-events-none" style={{ transform: 'rotate(-15deg)' }} />
        
        <img 
          src={logoImage} 
          alt="Ezras Nashim" 
          className="w-full max-w-2xl h-auto mb-4 relative z-10"
        />
        
        {/* Progress Bar - Total Mitzvas out of 1,000,000 */}
        <div className="w-full max-w-2xl px-3 md:px-0 mb-6 relative z-10">
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-blush/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm md:text-lg platypi-bold text-black">Journey to 1 Million Mitzvas</span>
              <span className="text-xs md:text-base platypi-medium text-warm-gray">
                {totalLoading ? "..." : totalMitzvas.toLocaleString()} / {goalMitzvas.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-blush/20 rounded-full h-6 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #E8B4BC, #D4A5AF)'
                }}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-sm md:text-base platypi-medium text-warm-gray">
                {progressPercent.toFixed(1)}% complete
              </span>
            </div>
          </div>
        </div>

        <h1 className="platypi-bold text-2xl md:text-3xl text-black mb-4 md:mb-6 text-center relative z-10">All Time Statistics</h1>
        
        <div className="grid grid-cols-2 gap-3 md:gap-6 w-full max-w-2xl px-3 md:px-0 relative z-10">
          {/* Torah */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-blush/10">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <BookOpen className="h-7 w-7 md:h-10 md:w-10 text-sage" />
            </div>
            <div className="text-2xl md:text-5xl platypi-bold text-black text-center mb-1 md:mb-2">
              {currentLoading ? "..." : getTorahTotal((currentData as any)?.totalModalCompletions || {}).toLocaleString()}
            </div>
            <div className="text-xs md:text-lg platypi-medium text-warm-gray text-center">Torah</div>
          </div>
          
          {/* Tefilla */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-blush/10">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <Heart className="h-7 w-7 md:h-10 md:w-10 text-lavender" />
            </div>
            <div className="text-2xl md:text-5xl platypi-bold text-black text-center mb-1 md:mb-2">
              {currentLoading ? "..." : getTefillaTotal((currentData as any)?.totalModalCompletions || {}).toLocaleString()}
            </div>
            <div className="text-xs md:text-lg platypi-medium text-warm-gray text-center">Tefilla</div>
          </div>
          
          {/* Tzedaka */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-blush/10">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <HandCoins className="h-7 w-7 md:h-10 md:w-10 text-peach" />
            </div>
            <div className="text-2xl md:text-5xl platypi-bold text-black text-center mb-1 md:mb-2">
              {currentLoading ? "..." : getTzedakaTotal(currentData, false).toLocaleString()}
            </div>
            <div className="text-xs md:text-lg platypi-medium text-warm-gray text-center">Tzedaka</div>
          </div>
          
          {/* Women Visited */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-blush/10">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <Users className="h-7 w-7 md:h-10 md:w-10 text-blush" />
            </div>
            <div className="text-2xl md:text-5xl platypi-bold text-black text-center mb-1 md:mb-2">
              {currentLoading ? "..." : ((currentData as any)?.totalUsers || 0).toLocaleString()}
            </div>
            <div className="text-xs md:text-lg platypi-medium text-warm-gray text-center">Women Visited</div>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-warm-gray platypi-medium relative z-10">
          Auto-refreshes every 2 minutes
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
          
          {/* Progress Bar - Total Mitzvas out of 1,000,000 */}
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm platypi-bold text-black">Journey to 1 Million Mitzvas</span>
              <span className="text-xs platypi-medium text-warm-gray">
                {totalLoading ? "..." : totalMitzvas.toLocaleString()} / {goalMitzvas.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-blush/20 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #E8B4BC, #D4A5AF)'
                }}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-xs platypi-medium text-warm-gray">
                {progressPercent.toFixed(1)}% complete
              </span>
            </div>
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
            {selectedPeriod !== 'alltime' ? (
              <>
                {/* Day/Week/Month View: Mitzvas, Torah, Tefilla, Tzedaka */}
                <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10"
                     style={{ animation: 'gentle-glow-pink 3s ease-in-out infinite' }}>
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-blush" />
                    <span className="text-xs platypi-medium text-warm-gray text-right">Mitzvas Completed</span>
                  </div>
                  <div className="text-2xl platypi-bold text-black text-center">
                    {currentLoading ? "..." : ((currentData as any)?.totalActs || (currentData as any)?.uniqueUsers || 0).toLocaleString()}
                  </div>
                </div>
                <StatCard
                  title="Torah"
                  value={currentLoading ? "..." : getTorahTotal((currentData as any)?.totalModalCompletions || (currentData as any)?.modalCompletions || {}).toLocaleString()}
                  icon={BookOpen}
                  color="text-sage"
                />
                <StatCard
                  title="Tefilla"
                  value={currentLoading ? "..." : getTefillaTotal((currentData as any)?.totalModalCompletions || (currentData as any)?.modalCompletions || {}).toLocaleString()}
                  icon={Heart}
                  color="text-lavender"
                />
                <StatCard
                  title="Tzedaka"
                  value={currentLoading ? "..." : getTzedakaTotal(currentData, selectedPeriod === 'today').toLocaleString()}
                  icon={HandCoins}
                  color="text-peach"
                />
              </>
            ) : (
              <>
                {/* All Time View: Torah, Tefilla, Tzedaka, Women Visited */}
                <StatCard
                  title="Torah"
                  value={currentLoading ? "..." : getTorahTotal((currentData as any)?.totalModalCompletions || {}).toLocaleString()}
                  icon={BookOpen}
                  color="text-sage"
                />
                <StatCard
                  title="Tefilla"
                  value={currentLoading ? "..." : getTefillaTotal((currentData as any)?.totalModalCompletions || {}).toLocaleString()}
                  icon={Heart}
                  color="text-lavender"
                />
                <StatCard
                  title="Tzedaka"
                  value={currentLoading ? "..." : getTzedakaTotal(currentData, false).toLocaleString()}
                  icon={HandCoins}
                  color="text-peach"
                />
                <StatCard
                  title="Women Visited"
                  value={currentLoading ? "..." : ((currentData as any)?.totalUsers || 0).toLocaleString()}
                  icon={Users}
                  color="text-blush"
                />
              </>
            )}
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
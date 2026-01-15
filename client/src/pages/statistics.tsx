import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, Heart, ScrollText, Calendar, ArrowLeft, Sun, Clock, Star, Shield, Sparkles, Clock3, HandCoins, DollarSign, Trophy, RefreshCw, HandHeart, Brain, Link2, Music, Dumbbell, Gem, Moon, Megaphone, Palette, Gift, Scale, Quote, Utensils } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { getLocalDateString } from "@/lib/dateUtils";
import logoImage from "@assets/A_project_of_(4)_1764762086237.png";
import torahFlower from "@assets/Torah_1767035380484.png";
import tefillaFlower from "@assets/Tefilla_1767035380485.png";
import tzedakaFlower from "@assets/Tzedaka_1767035380485.png";
import lifeFlower from "@assets/Life_1767176917530.png";

type TimePeriod = 'today' | 'week' | 'month' | 'alltime';

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

function getWeekStartDate(): string {
  const now = new Date();
  const hours = now.getHours();
  
  const adjustedDate = new Date(now);
  if (hours < 2) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }
  
  const dayOfWeek = adjustedDate.getDay();
  const daysToSubtract = dayOfWeek;
  const weekStart = new Date(adjustedDate);
  weekStart.setDate(weekStart.getDate() - daysToSubtract);
  
  return weekStart.toISOString().split('T')[0];
}

interface StatisticsProps {
  initialPeriod?: TimePeriod;
  simplified?: boolean;
}

interface SegmentedControlProps {
  value: TimePeriod;
  onChange: (value: TimePeriod) => void;
}

function SegmentedControl({ value, onChange }: SegmentedControlProps) {
  const options: { value: TimePeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'alltime', label: 'All Time' },
  ];

  return (
    <div className="bg-blush/10 rounded-2xl p-1 flex border border-blush/20">
      {options.map((option) => (
        <button
          key={option.value}
          onPointerDown={() => onChange(option.value)}
          className={`flex-1 py-2.5 px-3 rounded-xl text-center transition-all duration-200 ${
            value === option.value
              ? "bg-gradient-feminine text-white shadow-lg"
              : "text-black/70 hover:bg-blush/10"
          }`}
        >
          <span className={`text-sm platypi-semibold`}>
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}

interface CategoryCardProps {
  icon: any;
  label: string;
  value: number | string;
  isLoading: boolean;
}

function CategoryCard({ icon: Icon, label, value, isLoading }: CategoryCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-blush/10 shadow-soft">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="h-4 w-4 text-blush" />
        <span className="text-xs platypi-medium text-warm-gray">{label}</span>
      </div>
      <div className="text-2xl platypi-bold text-black">
        {isLoading ? "..." : value}
      </div>
    </div>
  );
}

interface FeatureUsageRowProps {
  icon: any;
  name: string;
  count: number;
  isTop: boolean;
}

function FeatureUsageRow({ icon: Icon, name, count, isTop }: FeatureUsageRowProps) {
  return (
    <div className="flex justify-between items-center py-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-blush" />
        <span className={`text-sm ${isTop ? 'platypi-bold' : 'platypi-medium'} text-black/80`}>{name}</span>
      </div>
      <span className={`text-sm platypi-bold text-black`}>{count.toLocaleString()}</span>
    </div>
  );
}

export default function Statistics({ initialPeriod = 'today', simplified = false }: StatisticsProps) {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(initialPeriod);
  const isPageVisible = usePageVisible();
  
  const analyticsToday = getLocalDateString();
  const weekStartDate = getWeekStartDate();
  
  const { data: todayStats, isLoading: todayLoading } = useQuery<DailyStats>({
    queryKey: [`/api/analytics/stats/today?date=${analyticsToday}`],
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: isPageVisible && selectedPeriod === 'today' ? 120000 : false,
    refetchOnWindowFocus: false,
    enabled: selectedPeriod === 'today',
  });

  const { data: weeklyStats, isLoading: weeklyLoading } = useQuery<PeriodStats>({
    queryKey: [`/api/analytics/stats/week?startDate=${weekStartDate}`],
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: isPageVisible && selectedPeriod === 'week' ? 120000 : false,
    refetchOnWindowFocus: false,
    enabled: selectedPeriod === 'week',
  });

  const { data: monthlyStats, isLoading: monthlyLoading } = useQuery<PeriodStats>({
    queryKey: ["/api/analytics/stats/month"],
    staleTime: 60000,
    gcTime: 300000,
    refetchInterval: isPageVisible && selectedPeriod === 'month' ? 120000 : false,
    refetchOnWindowFocus: false,
    enabled: selectedPeriod === 'month',
  });

  const { data: totalStats, isLoading: totalLoading } = useQuery<PeriodStats>({
    queryKey: ["/api/analytics/stats/total"],
    staleTime: 60000,
    gcTime: 300000,
    refetchInterval: isPageVisible && selectedPeriod === 'alltime' ? 120000 : false,
    refetchOnWindowFocus: false,
    enabled: selectedPeriod === 'alltime',
  });

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

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const getTorahTotal = (modalCompletions: Record<string, number>) => {
    const torahKeys = ['chizuk', 'emuna', 'halacha', 'featured', 'featured-content', 'parsha-vort', 'pirkei-avot', 'gems-of-gratitude', 'torah-challenge'];
    return torahKeys.reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
  };

  const getTefillaTotal = (modalCompletions: Record<string, number>) => {
    const tefillaKeys = ['morning-brochas', 'mincha', 'maariv', 'shacharis', 'nishmas', 'birkat-hamazon', 'tehillim', 'special-tehillim', 'nishmas-campaign', 'al-hamichiya', 'individual-prayer', 'gift-of-chatzos'];
    let total = tefillaKeys.reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
    total += Object.keys(modalCompletions).filter(key => key.startsWith('individual-tehillim')).reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
    total += (modalCompletions['global-tehillim-chain'] || 0) + (modalCompletions['tehillim-text'] || 0) + (modalCompletions['chain-tehillim'] || 0);
    total += Object.keys(modalCompletions).filter(key => key.startsWith('brocha-')).reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
    total += Object.keys(modalCompletions).filter(key => key.startsWith('womens-prayer')).reduce((sum, key) => sum + (modalCompletions[key] || 0), 0);
    return total;
  };

  const getTzedakaTotal = (data: any, isToday: boolean) => {
    const tzedakaActs = isToday ? (data?.tzedakaActs || 0) : (data?.totalTzedakaActs || 0);
    return tzedakaActs;
  };

  const totalMitzvas = (totalStats as any)?.totalActs || 0;
  const goalMitzvas = 1000000;
  const progressPercent = Math.min((totalMitzvas / goalMitzvas) * 100, 100);

  const modalTypeNames: Record<string, string> = {
    torah: "Torah",
    tefilla: "Tefilla", 
    tzedaka: "Tzedaka",
    "shabbat-table": "Shabbat Table",
    congratulations: "All Tasks Complete",
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
    chizuk: "Chizuk",
    emuna: "Emuna", 
    halacha: "Halacha",
    "featured-content": "Featured Content",
    featured: "Featured",
    "parsha-vort": "Parsha Shiur",
    "pirkei-avot": "Pirkei Avot",
    "gems-of-gratitude": "Gems of Gratitude",
    "torah-challenge": "Bitachon Challenge",
    recipe: "Daily Recipe",
    inspiration: "Creative Jewish Living",
    "sponsor-day": "Day Sponsorship",
    refuah: "Refuah Names",
    "womens-prayer": "Women's Prayers",
    "life-class": "Life Class",
    donate: "Donations",
    meditation: "Meditations",
    "feature:marriage-insights": "Marriage Insights",
    "feature:gift-of-chatzos": "Gift of Chatzos",
  };

  const modalTypeIcons: Record<string, any> = {
    torah: BookOpen,
    tefilla: Heart, 
    tzedaka: HandCoins,
    "shabbat-table": Sparkles,
    congratulations: Star,
    "morning-brochas": Sun,
    "brochas": Heart,
    mincha: Clock,
    maariv: Moon,
    nishmas: Music,
    "parsha-vort": BookOpen,
    "birkat-hamazon": Clock3,
    "global-tehillim-chain": ScrollText,
    "tehillim-text": ScrollText,
    "special-tehillim": Star,
    "individual-tehillim": ScrollText,
    "tehillim-chains": Link2,
    "nishmas-campaign": Heart,
    "al-hamichiya": Clock3,
    "individual-prayer": Heart,
    "womens-prayer": HandHeart,
    chizuk: Dumbbell,
    emuna: Shield,
    "gems-of-gratitude": Sparkles,
    halacha: Scale,
    "featured-content": Megaphone,
    featured: Megaphone,
    "pirkei-avot": Quote,
    "torah-challenge": Trophy,
    recipe: Utensils,
    inspiration: Palette,
    "sponsor-day": Trophy,
    refuah: Heart,
    "life-class": BookOpen,
    donate: HandCoins,
    meditation: Brain,
    "feature:marriage-insights": Gem,
    "feature:gift-of-chatzos": Gift,
  };

  const getProcessedFeatureUsage = () => {
    const modalCompletions = (currentData as any)?.totalModalCompletions || (currentData as any)?.modalCompletions || {};
    
    const processedEntries: Array<[string, number]> = [];
    let individualTehillimTotal = 0;
    let tehillimChainsTotal = 0;
    let womensPrayerTotal = 0;
    let brochasTotal = 0;

    Object.entries(modalCompletions).forEach(([modalType, count]) => {
      if (modalType.startsWith('individual-tehillim-') || modalType === 'individual-tehillim') {
        individualTehillimTotal += (count as number) || 0;
      } else if (modalType === 'global-tehillim-chain' || modalType === 'tehillim-text' ||
          modalType === 'chain-tehillim' || modalType.startsWith('chain-tehillim-')) {
        tehillimChainsTotal += (count as number) || 0;
      } else if (modalType === 'tzedaka' || modalType === 'donate') {
      } else if (modalType.startsWith('womens-prayer-')) {
        womensPrayerTotal += (count as number) || 0;
      } else if (modalType.startsWith('brocha-')) {
        brochasTotal += (count as number) || 0;
      } else if (modalType.startsWith('meditation-') || modalType === 'meditation') {
      } else if (modalTypeNames[modalType] && !['unknown', 'test', ''].includes(modalType.toLowerCase())) {
        processedEntries.push([modalType, count as number]);
      }
    });
    
    if (individualTehillimTotal > 0) {
      processedEntries.push(['individual-tehillim', individualTehillimTotal]);
    }
    
    if (tehillimChainsTotal > 0) {
      processedEntries.push(['tehillim-chains', tehillimChainsTotal]);
    }

    if (womensPrayerTotal > 0) {
      processedEntries.push(['womens-prayer', womensPrayerTotal]);
    }
    
    if (brochasTotal > 0) {
      processedEntries.push(['brochas', brochasTotal]);
    }

    const tzedakaActs = selectedPeriod === 'today' 
      ? (currentData as any)?.tzedakaActs || 0
      : (currentData as any)?.totalTzedakaActs || 0;
    
    const totalTzedaka = tzedakaActs;
    
    if (totalTzedaka > 0) {
      processedEntries.push(['tzedaka', totalTzedaka]);
    }

    const meditationCompletions = selectedPeriod === 'today'
      ? (currentData as any)?.meditationsCompleted || 0
      : (currentData as any)?.totalMeditationsCompleted || 0;
    
    if (meditationCompletions > 0) {
      processedEntries.push(['meditation', meditationCompletions]);
    }
    
    return processedEntries.sort(([, a], [, b]) => (b as number) - (a as number));
  };

  // Available for future use
  const _getMostUsedFeature = () => {
    const entries = getProcessedFeatureUsage();
    if (entries.length === 0) return null;
    const [topType] = entries[0];
    return modalTypeNames[topType] || topType;
  };
  void _getMostUsedFeature;

  function FinancialStatsSection({ period, isVisible }: { period: 'today' | 'week' | 'month' | 'alltime'; isVisible: boolean }) {
    const { data: financialStats, isLoading: financialLoading } = useQuery<{
      totalDaysSponsored: number;
      totalCampaigns: number;
      totalRaised: number;
    }>({
      queryKey: [`/api/analytics/community-impact?period=${period}`],
      staleTime: 60000,
      gcTime: 300000,
      refetchInterval: isVisible ? 120000 : false,
      refetchOnWindowFocus: false,
    });

    return (
      <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10">
        <h3 className="text-base platypi-bold text-black mb-3">Financial Impact</h3>
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
    );
  }

  if (simplified) {
    return (
      <div className="min-h-screen w-full bg-gradient-soft flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <img src={tefillaFlower} alt="" className="absolute top-4 left-2 w-24 h-24 opacity-20 pointer-events-none" style={{ transform: 'rotate(-12deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-8 right-4 w-28 h-28 opacity-15 pointer-events-none" style={{ transform: 'rotate(15deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute bottom-20 left-4 w-26 h-26 opacity-15 pointer-events-none" style={{ transform: 'rotate(25deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute bottom-16 right-2 w-24 h-24 opacity-20 pointer-events-none" style={{ transform: 'rotate(-18deg)' }} />
        
        <img src={torahFlower} alt="" className="absolute top-20 left-8 w-16 h-16 opacity-15 pointer-events-none" style={{ transform: 'rotate(-25deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute top-28 right-10 w-14 h-14 opacity-12 pointer-events-none" style={{ transform: 'rotate(30deg)' }} />
        <img src={lifeFlower} alt="" className="absolute top-1/4 left-1 w-18 h-18 opacity-15 pointer-events-none" style={{ transform: 'rotate(8deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-1/4 right-1 w-20 h-20 opacity-15 pointer-events-none" style={{ transform: 'rotate(-22deg)' }} />
        <img src={torahFlower} alt="" className="absolute top-1/3 left-6 w-14 h-14 opacity-12 pointer-events-none" style={{ transform: 'rotate(18deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute top-1/3 right-8 w-16 h-16 opacity-12 pointer-events-none" style={{ transform: 'rotate(-15deg)' }} />
        <img src={lifeFlower} alt="" className="absolute top-2/5 left-2 w-12 h-12 opacity-10 pointer-events-none" style={{ transform: 'rotate(12deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-2/5 right-4 w-18 h-18 opacity-15 pointer-events-none" style={{ transform: 'rotate(-8deg)' }} />
        
        <img src={torahFlower} alt="" className="absolute top-1/2 left-0 w-14 h-14 opacity-10 pointer-events-none" style={{ transform: 'rotate(5deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-1/2 right-0 w-20 h-20 opacity-15 pointer-events-none" style={{ transform: 'rotate(-10deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute top-[55%] left-4 w-12 h-12 opacity-10 pointer-events-none" style={{ transform: 'rotate(22deg)' }} />
        <img src={lifeFlower} alt="" className="absolute top-[55%] right-6 w-14 h-14 opacity-12 pointer-events-none" style={{ transform: 'rotate(-20deg)' }} />
        
        <img src={tefillaFlower} alt="" className="absolute top-2/3 left-2 w-18 h-18 opacity-12 pointer-events-none" style={{ transform: 'rotate(-14deg)' }} />
        <img src={torahFlower} alt="" className="absolute top-2/3 right-2 w-16 h-16 opacity-12 pointer-events-none" style={{ transform: 'rotate(28deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute top-[70%] left-6 w-14 h-14 opacity-10 pointer-events-none" style={{ transform: 'rotate(10deg)' }} />
        <img src={lifeFlower} alt="" className="absolute top-[70%] right-8 w-12 h-12 opacity-10 pointer-events-none" style={{ transform: 'rotate(-25deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute top-3/4 left-0 w-16 h-16 opacity-12 pointer-events-none" style={{ transform: 'rotate(20deg)' }} />
        <img src={torahFlower} alt="" className="absolute top-3/4 right-0 w-14 h-14 opacity-10 pointer-events-none" style={{ transform: 'rotate(-12deg)' }} />
        
        <img src={tzedakaFlower} alt="" className="absolute bottom-40 left-8 w-12 h-12 opacity-10 pointer-events-none" style={{ transform: 'rotate(15deg)' }} />
        <img src={lifeFlower} alt="" className="absolute bottom-44 right-6 w-14 h-14 opacity-10 pointer-events-none" style={{ transform: 'rotate(-18deg)' }} />
        <img src={torahFlower} alt="" className="absolute bottom-32 left-2 w-16 h-16 opacity-12 pointer-events-none" style={{ transform: 'rotate(-8deg)' }} />
        <img src={tefillaFlower} alt="" className="absolute bottom-36 right-2 w-18 h-18 opacity-12 pointer-events-none" style={{ transform: 'rotate(22deg)' }} />
        <img src={tzedakaFlower} alt="" className="absolute bottom-8 left-10 w-14 h-14 opacity-15 pointer-events-none" style={{ transform: 'rotate(30deg)' }} />
        <img src={lifeFlower} alt="" className="absolute bottom-4 right-10 w-12 h-12 opacity-12 pointer-events-none" style={{ transform: 'rotate(-15deg)' }} />
        
        <img 
          src={logoImage} 
          alt="Ezras Nashim" 
          className="w-full max-w-2xl h-auto mb-4 relative z-10"
        />
        
        <div className="w-full max-w-2xl px-3 md:px-0 mb-6 relative z-10">
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-blush/10 complete-button-pulse">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm md:text-lg platypi-bold text-black">Journey to 1 Million Mitzvas</span>
              <span className="text-xs md:text-base platypi-medium text-warm-gray">
                {totalLoading ? "..." : totalMitzvas.toLocaleString()} / {goalMitzvas.toLocaleString()}
              </span>
            </div>
            <div 
              className="w-full rounded-full h-8 overflow-hidden relative"
              style={{ background: 'linear-gradient(90deg, #E8B4BC, #C4A5D4)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-500 flex items-center justify-center"
                style={{ 
                  width: `${Math.max(progressPercent, 15)}%`,
                  background: 'linear-gradient(90deg, hsl(120, 25%, 65%), hsl(120, 25%, 70%))'
                }}
              >
                <span className="text-sm md:text-base platypi-bold text-white drop-shadow-sm">
                  {progressPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <h1 className="platypi-bold text-2xl md:text-3xl text-black mb-4 md:mb-6 text-center relative z-10">All Time Statistics</h1>
        
        <div className="grid grid-cols-2 gap-3 md:gap-6 w-full max-w-2xl px-3 md:px-0 relative z-10">
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-blush/10">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <div className="bg-gradient-feminine px-3 md:px-5 py-1.5 md:py-2.5 rounded-full flex items-center gap-1.5 md:gap-2">
                <BookOpen className="h-4 w-4 md:h-6 md:w-6 text-white" />
                <span className="text-xs md:text-base platypi-bold text-white">Torah</span>
              </div>
            </div>
            <div className="text-2xl md:text-5xl platypi-bold text-black text-center">
              {currentLoading ? "..." : getTorahTotal((currentData as any)?.totalModalCompletions || {}).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-blush/10">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <div className="bg-gradient-feminine px-3 md:px-5 py-1.5 md:py-2.5 rounded-full flex items-center gap-1.5 md:gap-2">
                <Heart className="h-4 w-4 md:h-6 md:w-6 text-white" />
                <span className="text-xs md:text-base platypi-bold text-white">Tefilla</span>
              </div>
            </div>
            <div className="text-2xl md:text-5xl platypi-bold text-black text-center">
              {currentLoading ? "..." : getTefillaTotal((currentData as any)?.totalModalCompletions || {}).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-blush/10">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <div className="bg-gradient-feminine px-3 md:px-5 py-1.5 md:py-2.5 rounded-full flex items-center gap-1.5 md:gap-2">
                <HandCoins className="h-4 w-4 md:h-6 md:w-6 text-white" />
                <span className="text-xs md:text-base platypi-bold text-white">Tzedaka</span>
              </div>
            </div>
            <div className="text-2xl md:text-5xl platypi-bold text-black text-center">
              {currentLoading ? "..." : getTzedakaTotal(currentData, false).toLocaleString()}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg border border-blush/10">
            <div className="flex items-center justify-center mb-2 md:mb-4">
              <div className="bg-gradient-feminine px-3 md:px-5 py-1.5 md:py-2.5 rounded-full flex items-center gap-1.5 md:gap-2">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-white" />
                <span className="text-xs md:text-base platypi-bold text-white">Women</span>
              </div>
            </div>
            <div className="text-2xl md:text-5xl platypi-bold text-black text-center">
              {currentLoading ? "..." : ((currentData as any)?.totalUsers || 0).toLocaleString()}
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-sm text-warm-gray platypi-medium relative z-10">
          Auto-refreshes every 2 minutes
        </div>
      </div>
    );
  }

  const totalActs = (currentData as any)?.totalActs || (currentData as any)?.uniqueUsers || 0;
  const featureUsageData = getProcessedFeatureUsage();
  
  // These are available for future use but currently unused
  void totalActs;
  void featureUsageData;

  return (
    <div className="min-h-screen bg-[#FDF8F8]">
      <div 
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blush/10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onPointerDown={() => setLocation("/")}
            className="p-2 -ml-2 touch-manipulation"
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-6 w-6 text-black" />
          </button>
          <h1 
            className="platypi-bold text-xl text-black cursor-pointer"
            onPointerDown={scrollToTop}
          >
            Analytics
          </h1>
          <button
            onPointerDown={handleRefresh}
            className="p-2 -mr-2 touch-manipulation"
            aria-label="Refresh Analytics"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 text-black/70 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <main className="px-4 pb-24">
        <div className="py-4">
          <SegmentedControl value={selectedPeriod} onChange={setSelectedPeriod} />
        </div>

        <div className="text-center py-6">
          <p className="text-5xl platypi-bold text-black mb-1">
            {currentLoading ? "..." : totalActs.toLocaleString()}
          </p>
          <p className="text-sm platypi-medium text-warm-gray mb-3">Mitzvas</p>
          <div className="inline-flex items-center gap-1.5 bg-blush/10 px-3 py-1.5 rounded-full border border-blush/20">
              <Sparkles className="h-3.5 w-3.5 text-blush" />
              <span className="text-xs platypi-medium text-black/70">Women Visited: {((currentData as any)?.totalUsers || (currentData as any)?.uniqueUsers || 0).toLocaleString()}</span>
            </div>
        </div>

        {selectedPeriod === 'alltime' && (
          <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10 mb-5 complete-button-pulse">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm platypi-bold text-black">Journey to 1 Million Mitzvas</span>
              <span className="text-xs platypi-medium text-warm-gray">
                {totalLoading ? "..." : totalMitzvas.toLocaleString()} / {goalMitzvas.toLocaleString()}
              </span>
            </div>
            <div 
              className="w-full rounded-full h-6 overflow-hidden relative"
              style={{ background: 'linear-gradient(90deg, #E8B4BC, #C4A5D4)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-500 flex items-center justify-center"
                style={{ 
                  width: `${Math.max(progressPercent, 15)}%`,
                  background: 'linear-gradient(90deg, hsl(120, 25%, 65%), hsl(120, 25%, 70%))'
                }}
              >
                <span className="text-xs platypi-bold text-white drop-shadow-sm">
                  {progressPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-5">
          <CategoryCard
            icon={BookOpen}
            label="Torah"
            value={getTorahTotal((currentData as any)?.totalModalCompletions || (currentData as any)?.modalCompletions || {}).toLocaleString()}
            isLoading={currentLoading}
          />
          <CategoryCard
            icon={Heart}
            label="Tefilla"
            value={getTefillaTotal((currentData as any)?.totalModalCompletions || (currentData as any)?.modalCompletions || {}).toLocaleString()}
            isLoading={currentLoading}
          />
          <CategoryCard
            icon={HandCoins}
            label="Tzedaka"
            value={getTzedakaTotal(currentData, selectedPeriod === 'today').toLocaleString()}
            isLoading={currentLoading}
          />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-soft border border-blush/10 mb-5">
          <h3 className="text-base platypi-bold text-black mb-2">Feature Usage</h3>
          {currentLoading ? (
            <div className="text-center text-warm-gray py-4">Loading...</div>
          ) : featureUsageData.length === 0 ? (
            <div className="text-center text-warm-gray py-4">No data available</div>
          ) : (
            <div className="divide-y divide-blush/10">
              {featureUsageData.map(([modalType, count], index) => {
                const Icon = modalTypeIcons[modalType] || BookOpen;
                return (
                  <FeatureUsageRow
                    key={`${selectedPeriod}-${modalType}-${index}`}
                    icon={Icon}
                    name={modalTypeNames[modalType] || modalType}
                    count={count}
                    isTop={index === 0}
                  />
                );
              })}
            </div>
          )}
        </div>

        <FinancialStatsSection period={selectedPeriod} isVisible={isPageVisible} />
      </main>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, BookOpen, Heart, ScrollText, TrendingUp, Calendar, ArrowLeft, Sun, Clock, Star, Shield, Sparkles, Clock3, HandCoins, DollarSign, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import BottomNavigation from "@/components/bottom-navigation";
import type { Section } from "@/pages/home";

interface DailyStats {
  date: string;
  uniqueUsers: number;
  pageViews: number;
  tehillimCompleted: number;
  namesProcessed: number;
  booksCompleted: number;
  totalActs: number;
  modalCompletions: Record<string, number>;
}

interface PeriodStats {
  totalUsers: number;
  totalPageViews: number;
  totalTehillimCompleted: number;
  totalNamesProcessed: number;
  totalBooksCompleted: number;
  totalActs: number;
  totalModalCompletions: Record<string, number>;
}

type TimePeriod = 'today' | 'month' | 'alltime';

export default function Statistics() {
  const [, setLocation] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');

  // Fetch today's stats
  const { data: todayStats, isLoading: todayLoading } = useQuery<DailyStats>({
    queryKey: ["/api/analytics/stats/today"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch monthly stats
  const { data: monthlyStats, isLoading: monthlyLoading } = useQuery<PeriodStats>({
    queryKey: ["/api/analytics/stats/month"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch total stats
  const { data: totalStats, isLoading: totalLoading } = useQuery<PeriodStats>({
    queryKey: ["/api/analytics/stats/total"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Get current data based on selected period
  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'today':
        return { data: todayStats, isLoading: todayLoading };
      case 'month':
        return { data: monthlyStats, isLoading: monthlyLoading };
      case 'alltime':
        return { data: totalStats, isLoading: totalLoading };
      default:
        return { data: todayStats, isLoading: todayLoading };
    }
  };

  const { data: currentData, isLoading: currentLoading } = getCurrentData();



  // Handler for bottom navigation - navigate back to home page with section
  const handleSectionChange = (section: Section) => {
    // For all sections, go back to home page and let the home page handle section navigation
    setLocation(`/?section=${section}`);
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
    mincha: "Mincha",
    maariv: "Maariv",
    nishmas: "Nishmas",
    "birkat-hamazon": "Birkat Hamazon",
    "tehillim-text": "Tehillim",
    "special-tehillim": "Special Tehillim",
    
    // Torah subcategories  
    chizuk: "Chizuk",
    emuna: "Emuna",
    halacha: "Halacha",
    "featured-content": "Featured Content",
    
    // Other
    donate: "Donations",
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
    mincha: Clock,
    maariv: Star,
    nishmas: Heart,
    "birkat-hamazon": Clock3,
    "tehillim-text": ScrollText,
    "special-tehillim": Star,
    
    // Torah subcategories  
    chizuk: Heart,
    emuna: Shield,
    halacha: BookOpen,
    "featured-content": Star,
    
    // Other
    donate: HandCoins,
  };

  // Financial Stats Component
  function FinancialStatsSection() {
    const { data: financialStats, isLoading: financialLoading } = useQuery<{
      totalDaysSponsored: number;
      totalCampaigns: number;
      totalRaised: number;
    }>({
      queryKey: ["/api/analytics/community-impact"],
      refetchInterval: 60000, // Refresh every minute
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
              <div className="text-xs platypi-medium text-warm-gray">Campaigns</div>
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
    <div className="mobile-app min-h-screen max-w-md mx-auto bg-white shadow-2xl relative flex flex-col">
      {/* Header */}
      <header className="bg-gradient-soft p-3 border-0 shadow-none flex-shrink-0">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => setLocation("/")}
            className="p-2 rounded-full hover:bg-white/50 transition-colors"
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-5 w-5 text-black/70" />
          </button>
          <h1 className="platypi-semibold text-xl text-black tracking-wide">Analytics Dashboard</h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
      </header>
      
      {/* Time Period Selector - Connected to Top */}
      <div className="bg-gradient-soft -mt-3 rounded-b-3xl px-4 pt-6 pb-6 border-0 shadow-none flex-shrink-0">
        <div className="flex bg-white/20 rounded-xl p-1 mb-4">
          <Button
            onClick={() => setSelectedPeriod('today')}
            variant={selectedPeriod === 'today' ? 'default' : 'ghost'}
            className={`flex-1 rounded-lg text-sm h-10 ${
              selectedPeriod === 'today' 
                ? 'bg-white text-black shadow-sm' 
                : 'text-black/70 hover:text-black hover:bg-white/10'
            }`}
          >
            Today
          </Button>
          <Button
            onClick={() => setSelectedPeriod('month')}
            variant={selectedPeriod === 'month' ? 'default' : 'ghost'}
            className={`flex-1 rounded-lg text-sm h-10 ${
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
            className={`flex-1 rounded-lg text-sm h-10 ${
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
           selectedPeriod === 'month' ? "This Month's Activity" : 
           "All Time Activity"}
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Mitzvas Completed"
            value={currentLoading ? "..." : (currentData as any)?.totalActs?.toLocaleString() || (currentData as any)?.totalActs || 0}
            icon={TrendingUp}
            color="text-blush"
          />
          <StatCard
            title="Active Women"
            value={currentLoading ? "..." : (currentData as any)?.totalUsers?.toLocaleString() || (currentData as any)?.uniqueUsers || 0}
            icon={Users}
            color="text-peach"
          />
          <StatCard
            title="Tehillim Said"
            value={currentLoading ? "..." : (currentData as any)?.totalTehillimCompleted?.toLocaleString() || (currentData as any)?.tehillimCompleted || 0}
            icon={ScrollText}
            color="text-lavender"
          />
          <StatCard
            title="People Davened For"
            value={currentLoading ? "..." : (currentData as any)?.totalNamesProcessed?.toLocaleString() || (currentData as any)?.namesProcessed || 0}
            icon={Heart}
            color="text-sage"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-24">
        <div className="space-y-6">
          {/* Feature Usage */}
          <div>
            <h2 className="text-base platypi-bold text-black mb-3">Feature Usage</h2>
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10">
              {currentLoading ? (
                <div className="text-center text-black/60">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries((currentData as any)?.totalModalCompletions || (currentData as any)?.modalCompletions || {})
                    .filter(([modalType]) => 
                      // Remove unknown, test, and other unwanted entries
                      !['unknown', 'test', ''].includes(modalType.toLowerCase()) &&
                      modalTypeNames[modalType] // Only show items we have names for
                    )
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([modalType, count]) => {
                      const Icon = modalTypeIcons[modalType] || BookOpen;
                      return (
                        <div key={modalType} className="flex justify-between items-center py-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-blush" />
                            <span className="text-xs platypi-medium text-warm-gray">
                              {modalTypeNames[modalType]}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-black">{(count as number).toLocaleString()}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Financial Stats */}
          <FinancialStatsSection />
        </div>
      </main>

      <BottomNavigation 
        activeSection={null} 
        onSectionChange={handleSectionChange} 
      />
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, BookOpen, Heart, ScrollText, TrendingUp, Calendar, ArrowLeft, Sun, Clock, Star, Shield, Sparkles, Clock3, HandCoins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
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

interface TotalStats {
  totalUsers: number;
  totalPageViews: number;
  totalTehillimCompleted: number;
  totalNamesProcessed: number;
  totalBooksCompleted: number;
  totalActs: number;
  totalModalCompletions: Record<string, number>;
}

export default function Statistics() {
  const [, setLocation] = useLocation();

  // Fetch today's stats
  const { data: todayStats, isLoading: todayLoading } = useQuery<DailyStats>({
    queryKey: ["/api/analytics/stats/today"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch total stats
  const { data: totalStats, isLoading: totalLoading } = useQuery<TotalStats>({
    queryKey: ["/api/analytics/stats/total"],
    refetchInterval: 60000, // Refresh every minute
  });



  // Handler for bottom navigation - navigate back to home page with section
  const handleSectionChange = (section: Section) => {
    // For all sections, go back to home page and let the home page handle section navigation
    setLocation(`/?section=${section}`);
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) => (
    <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${color}`} />
        <span className="text-xs font-medium text-warm-gray">{title}</span>
      </div>
      <div className="text-2xl font-serif font-bold text-black">{value}</div>
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

  return (
    <div className="mobile-app min-h-screen max-w-md mx-auto bg-white shadow-2xl relative">
      {/* Header */}
      <header className="bg-gradient-soft p-3 border-0 shadow-none">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => setLocation("/")}
            className="p-2 rounded-full hover:bg-white/50 transition-colors"
            aria-label="Back to Home"
          >
            <ArrowLeft className="h-5 w-5 text-black/70" />
          </button>
          <h1 className="font-serif text-xl font-semibold text-black tracking-wide">Analytics Dashboard</h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
      </header>
      
      <main className="content-area overflow-y-auto overflow-x-hidden p-4 pb-20">
        <div className="space-y-6">
          {/* Today's Stats */}
          <div>
            <h2 className="text-base font-serif font-bold text-black mb-3">Today's Activity</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Total Acts"
                value={todayLoading ? "..." : todayStats?.totalActs || 0}
                icon={TrendingUp}
                color="text-blush"
              />
              <StatCard
                title="Active Users"
                value={todayLoading ? "..." : todayStats?.uniqueUsers || 0}
                icon={Users}
                color="text-peach"
              />
              <StatCard
                title="Tehillim Said"
                value={todayLoading ? "..." : todayStats?.tehillimCompleted || 0}
                icon={ScrollText}
                color="text-lavender"
              />
              <StatCard
                title="Torah Learnt"
                value={todayLoading ? "..." : (todayStats?.modalCompletions ? 
                  Object.entries(todayStats.modalCompletions)
                    .filter(([key]) => ['chizuk', 'emuna', 'halacha', 'featured-content'].includes(key))
                    .reduce((sum, [, count]) => sum + count, 0) : 0)}
                icon={BookOpen}
                color="text-sage"
              />
            </div>
            
            {/* Book Completions - Special Achievement */}
            {todayStats?.booksCompleted ? (
              <div className="mt-3">
                <div className="bg-gradient-to-r from-blush/20 to-peach/20 rounded-2xl p-4 border border-blush/20">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="h-6 w-6 text-blush" />
                    <span className="text-sm font-medium text-warm-gray">Complete Tehillim Books Today</span>
                  </div>
                  <div className="text-3xl font-serif font-bold text-black">{todayStats.booksCompleted}</div>
                  <p className="text-xs text-warm-gray mt-1">Amazing achievement! 🎉</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Total Stats */}
          <div>
            <h2 className="text-base font-serif font-bold text-black mb-3">All Time Totals</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                title="Total Acts"
                value={totalLoading ? "..." : totalStats?.totalActs?.toLocaleString() || 0}
                icon={TrendingUp}
                color="text-blush"
              />
            </div>

            {/* Million Acts Goal */}
            <div className="mt-3">
              <div className="bg-gradient-to-r from-gold/20 to-blush/20 rounded-2xl p-4 border border-gold/20">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="h-6 w-6 text-gold" />
                  <span className="text-sm font-medium text-warm-gray">1 Million Acts Goal Progress</span>
                </div>
                <div className="text-3xl font-serif font-bold text-black">
                  {totalLoading ? "..." : ((totalStats?.totalActs || 0) / 1000000 * 100).toFixed(2)}%
                </div>
                <p className="text-xs text-warm-gray mt-1">
                  {totalLoading ? "..." : `${(totalStats?.totalActs || 0).toLocaleString()} / 1,000,000 acts completed`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <StatCard
                title="Active Users"
                value={totalLoading ? "..." : totalStats?.totalUsers.toLocaleString() || 0}
                icon={Users}
                color="text-peach"
              />
              <StatCard
                title="Tehillim Said"
                value={totalLoading ? "..." : totalStats?.totalTehillimCompleted.toLocaleString() || 0}
                icon={ScrollText}
                color="text-lavender"
              />
              <StatCard
                title="Torah Learnt"
                value={totalLoading ? "..." : (totalStats?.totalModalCompletions ? 
                  Object.entries(totalStats.totalModalCompletions)
                    .filter(([key]) => ['chizuk', 'emuna', 'halacha', 'featured-content'].includes(key))
                    .reduce((sum, [, count]) => sum + count, 0).toLocaleString() : 0)}
                icon={BookOpen}
                color="text-sage"
              />
            </div>
            
            {/* Total Book Completions */}
            <div className="mt-3">
              <div className="bg-gradient-to-r from-blush/10 to-peach/10 rounded-2xl p-4 border border-blush/10">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="h-6 w-6 text-blush" />
                  <span className="text-sm font-medium text-warm-gray">Complete Tehillim Books Ever</span>
                </div>
                <div className="text-3xl font-serif font-bold text-black">
                  {totalLoading ? "..." : (totalStats?.totalBooksCompleted?.toLocaleString() || "0")}
                </div>
                <p className="text-xs text-warm-gray mt-1">Full books of 150 perakim completed</p>
              </div>
            </div>
          </div>

          {/* Modal Completions */}
          <div>
            <h2 className="text-base font-serif font-bold text-black mb-3">Feature Usage</h2>
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10">
              {totalLoading ? (
                <div className="text-center text-black/60">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(totalStats?.totalModalCompletions || {})
                    .filter(([modalType]) => 
                      // Remove unknown, test, and other unwanted entries
                      !['unknown', 'test', ''].includes(modalType.toLowerCase()) &&
                      modalTypeNames[modalType] // Only show items we have names for
                    )
                    .sort(([, a], [, b]) => b - a)
                    .map(([modalType, count]) => {
                      const Icon = modalTypeIcons[modalType] || BookOpen;
                      return (
                        <div key={modalType} className="flex justify-between items-center py-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-blush" />
                            <span className="text-xs font-medium text-warm-gray">
                              {modalTypeNames[modalType]}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-black">{count.toLocaleString()}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>


        </div>
      </main>

      <BottomNavigation 
        activeSection={null} 
        onSectionChange={handleSectionChange} 
      />
    </div>
  );
}
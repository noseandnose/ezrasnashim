import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, BookOpen, Heart, ScrollText, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface DailyStats {
  date: string;
  uniqueUsers: number;
  pageViews: number;
  tehillimCompleted: number;
  namesProcessed: number;
  modalCompletions: Record<string, number>;
}

interface TotalStats {
  totalUsers: number;
  totalPageViews: number;
  totalTehillimCompleted: number;
  totalNamesProcessed: number;
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

  // Fetch daily stats for chart
  const { data: dailyStats } = useQuery<DailyStats[]>({
    queryKey: ["/api/analytics/stats/daily"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

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
    torah: "Torah",
    tefilla: "Tefilla",
    tzedaka: "Tzedaka",
    "shabbat-table": "Shabbat Table",
    congratulations: "All Tasks Complete",
    "morning-brochas": "Morning Brochas",
    mincha: "Mincha",
    nishmas: "Nishmas",
    "tehillim-text": "Tehillim",
    "special-tehillim": "Special Tehillim",
    donate: "Donations",
  };

  return (
    <div className="min-h-screen bg-sand-light pb-20">
      {/* Header */}
      <div className="gradient-soft-glow rounded-b-3xl px-4 pt-4 pb-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-warm-gray hover:text-black p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-serif font-bold text-black">Analytics Dashboard</h1>
          <div className="w-5" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6 max-w-md mx-auto">
        {/* Today's Stats */}
        <div>
          <h2 className="text-base font-serif font-bold text-black mb-3">Today's Activity</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Active Users"
              value={todayLoading ? "..." : todayStats?.uniqueUsers || 0}
              icon={Users}
              color="text-blush"
            />
            <StatCard
              title="Page Views"
              value={todayLoading ? "..." : todayStats?.pageViews || 0}
              icon={TrendingUp}
              color="text-sage"
            />
            <StatCard
              title="Tehillim Completed"
              value={todayLoading ? "..." : todayStats?.tehillimCompleted || 0}
              icon={ScrollText}
              color="text-peach"
            />
            <StatCard
              title="Names Prayed For"
              value={todayLoading ? "..." : todayStats?.namesProcessed || 0}
              icon={Heart}
              color="text-lavender"
            />
          </div>
        </div>

        {/* Total Stats */}
        <div>
          <h2 className="text-base font-serif font-bold text-black mb-3">All Time Totals</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              title="Total Users"
              value={totalLoading ? "..." : totalStats?.totalUsers.toLocaleString() || 0}
              icon={Users}
              color="text-blush"
            />
            <StatCard
              title="Total Page Views"
              value={totalLoading ? "..." : totalStats?.totalPageViews.toLocaleString() || 0}
              icon={TrendingUp}
              color="text-sage"
            />
            <StatCard
              title="Total Tehillim"
              value={totalLoading ? "..." : totalStats?.totalTehillimCompleted.toLocaleString() || 0}
              icon={ScrollText}
              color="text-peach"
            />
            <StatCard
              title="Total Names"
              value={totalLoading ? "..." : totalStats?.totalNamesProcessed.toLocaleString() || 0}
              icon={Heart}
              color="text-lavender"
            />
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
                    .sort(([, a], [, b]) => b - a)
                    .map(([modalType, count]) => (
                      <div key={modalType} className="flex justify-between items-center py-1">
                        <span className="text-xs font-medium text-warm-gray">
                          {modalTypeNames[modalType] || modalType}
                        </span>
                        <span className="text-xs font-bold text-black">{count.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              )}
          </div>
        </div>

        {/* Daily Trend */}
        {dailyStats && dailyStats.length > 0 && (
          <div>
            <h2 className="text-base font-serif font-bold text-black mb-3">Recent Activity (Last 7 Days)</h2>
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-blush/10">
                <div className="space-y-2">
                  {dailyStats.slice(0, 7).map((day) => (
                    <div key={day.date} className="flex justify-between items-center py-1">
                      <span className="text-xs text-warm-gray">
                        {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-black">
                          <span className="font-bold">{day.uniqueUsers}</span> users
                        </span>
                        <span className="text-black">
                          <span className="font-bold">{day.tehillimCompleted}</span> tehillim
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
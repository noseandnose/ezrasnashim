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
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-black/70">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-black">{value}</div>
      </CardContent>
    </Card>
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
      <div className="bg-gradient-soft p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-black/60 hover:text-black"
          >
            ← Back
          </Button>
          <h1 className="text-xl font-serif font-bold text-black">Analytics Dashboard</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Today's Stats */}
        <div>
          <h2 className="text-lg font-serif font-bold text-black mb-3">Today's Activity</h2>
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
          <h2 className="text-lg font-serif font-bold text-black mb-3">All Time Totals</h2>
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
          <h2 className="text-lg font-serif font-bold text-black mb-3">Feature Usage</h2>
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              {totalLoading ? (
                <div className="text-center text-black/60">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(totalStats?.totalModalCompletions || {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([modalType, count]) => (
                      <div key={modalType} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-black">
                          {modalTypeNames[modalType] || modalType}
                        </span>
                        <span className="text-sm font-bold text-black">{count.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Trend */}
        {dailyStats && dailyStats.length > 0 && (
          <div>
            <h2 className="text-lg font-serif font-bold text-black mb-3">Recent Activity (Last 7 Days)</h2>
            <Card className="bg-white shadow-md">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {dailyStats.slice(0, 7).map((day) => (
                    <div key={day.date} className="flex justify-between items-center">
                      <span className="text-sm text-black/70">
                        {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-black">
                          <span className="font-medium">{day.uniqueUsers}</span> users
                        </span>
                        <span className="text-black">
                          <span className="font-medium">{day.tehillimCompleted}</span> tehillim
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
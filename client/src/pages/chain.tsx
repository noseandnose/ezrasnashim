import { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Share2, ChevronLeft, ChevronDown, Heart, Briefcase, Baby, Home, Star, Shield, Sparkles, HeartPulse, Settings, Bell } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatTextContent } from "@/lib/text-formatter";
import { AttributionSection } from "@/components/ui/attribution-section";
import { useLocationStore } from "@/hooks/use-jewish-times";
import { useModalCompletionStore } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import type { TehillimChain } from "@shared/schema";

interface ChainStats {
  totalCompleted: number;
  booksCompleted: number;
  currentlyReading: number;
  available: number;
}

interface ChainWithMeta extends TehillimChain {
  stats: ChainStats;
  nextPsalm: number | null;
  hasActiveReading?: boolean;
}

const toTitleCase = (str: string) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const getReasonIcon = (reason: string) => {
  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes('refuah') || lowerReason.includes('health')) return HeartPulse;
  if (lowerReason.includes('shidduch') || lowerReason.includes('match')) return Heart;
  if (lowerReason.includes('parnassa') || lowerReason.includes('livelihood')) return Briefcase;
  if (lowerReason.includes('children') || lowerReason.includes('child')) return Baby;
  if (lowerReason.includes('shalom') || lowerReason.includes('peace')) return Home;
  if (lowerReason.includes('success')) return Star;
  if (lowerReason.includes('protection')) return Shield;
  return Sparkles;
};

// Koren URL based on user location
const useKorenUrl = () => {
  const { coordinates } = useLocationStore();
  const isInIsrael = coordinates && 
    coordinates.lat >= 29.5 && coordinates.lat <= 33.5 && 
    coordinates.lng >= 34.0 && coordinates.lng <= 36.0;
  
  return isInIsrael 
    ? "https://korenpub.co.il/collections/siddurim/products/koren-shalem-siddurhardcoverstandardashkenaz"
    : "https://korenpub.com/collections/siddurim/products/koren-shalem-siddur-ashkenaz-1";
};

interface TehillimContent {
  hebrewText: string;
  englishText: string;
  psalmNumber: number;
  tehillimId: number;
  partNumber: number;
  displayTitle: string;
  hebrewNumber?: string;
}

export default function ChainPage() {
  const [, params] = useRoute("/c/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug || "";
  
  const [showHebrew, setShowHebrew] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [currentPsalm, setCurrentPsalm] = useState<number | null>(null);
  
  // Track loading state for find another button
  const [isFindingAnother, setIsFindingAnother] = useState(false);
  
  // Reminder dialog state
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  
  // Description expansion state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Koren URL for attribution
  const korenUrl = useKorenUrl();

  const deviceId = (() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = 'device-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
      localStorage.setItem('deviceId', id);
    }
    return id;
  })();

  // Single query fetches chain + stats + next psalm (eliminates waterfall)
  const { data: chainData, isLoading: chainLoading, error: chainError } = useQuery<ChainWithMeta>({
    queryKey: ['/api/tehillim-chains', slug, deviceId],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}?deviceId=${deviceId}`);
      if (!response.ok) throw new Error('Chain not found');
      return response.json();
    },
    enabled: !!slug,
  });

  // Extract chain and stats from combined response
  const chain = chainData;
  const initialStats = chainData?.stats;

  // Local state for stats - updated immediately on completion
  const [localStats, setLocalStats] = useState<ChainStats | null>(null);

  // Sync local stats when chain data loads
  useEffect(() => {
    if (initialStats && !localStats) {
      setLocalStats(initialStats);
    }
  }, [initialStats, localStats]);

  // Periodic stats refresh (every 10 seconds for real-time feedback)
  useEffect(() => {
    if (!slug || !chainData) return;
    
    const refreshStats = async () => {
      try {
        // Add cache-busting timestamp to prevent browser caching
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/stats?t=${Date.now()}`);
        if (response.ok) {
          const stats = await response.json();
          setLocalStats(stats);
        }
      } catch (error) {
        // Silently fail - not critical
      }
    };
    
    const interval = setInterval(refreshStats, 10000);
    return () => clearInterval(interval);
  }, [slug, chainData]);

  // Use local stats (most up-to-date) or initial stats as fallback
  const displayStats = localStats || initialStats;

  const { data: psalmContent, isLoading: psalmLoading } = useQuery<TehillimContent>({
    queryKey: ['/api/tehillim', currentPsalm],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/${currentPsalm}`);
      if (!response.ok) throw new Error('Failed to fetch psalm');
      return response.json();
    },
    enabled: !!currentPsalm,
    staleTime: 10 * 60 * 1000,
  });

  const markModalComplete = useModalCompletionStore((state) => state.markModalComplete);

  const completeReadingMutation = useMutation({
    mutationFn: async (psalmNumber: number) => {
      // Wait for the completion to finish before proceeding
      const completeResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, psalmNumber }),
      });
      
      // Throw on failure so onError handles it
      if (!completeResponse.ok) {
        throw new Error('Failed to save completion');
      }
      
      // Server returns { reading, stats } - use authoritative stats
      const completeData = await completeResponse.json();
      
      // Get next psalm
      const nextResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/random-available?deviceId=${deviceId}&excludePsalm=${psalmNumber}`);
      const nextData = nextResponse.ok ? await nextResponse.json() : null;
      return { nextPsalm: nextData?.psalmNumber || null, stats: completeData.stats, completedPsalm: psalmNumber };
    },
    onSuccess: (data) => {
      // Mark modal complete for flower tracking
      if (data.completedPsalm) {
        markModalComplete(`chain-tehillim-${data.completedPsalm}`);
        
        // Force immediate refetch of stats (not just invalidate which only marks stale)
        // refetchQueries forces network fetch regardless of staleTime
        queryClient.refetchQueries({ queryKey: ['/api/tehillim-chains/stats/total'] });
        queryClient.refetchQueries({ queryKey: ['/api/tehillim-chains/stats/global'] });
        // Analytics queries - match any query key containing analytics paths
        queryClient.refetchQueries({ predicate: (query) => {
          return query.queryKey.some((segment) => 
            typeof segment === 'string' && (
              segment.includes('/api/analytics/stats/') ||
              segment.includes('/api/analytics/community-impact')
            )
          );
        }});
      }
      
      // Update local stats immediately with authoritative data from server
      if (data.stats) {
        setLocalStats(data.stats);
      }
      
      // Load next psalm silently (no popup)
      if (data.nextPsalm) {
        setCurrentPsalm(data.nextPsalm);
      } else {
        setCurrentPsalm(null);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not save completion. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get a random psalm
  const getRandomPsalm = useCallback(async (excludePsalm?: number | null) => {
    try {
      let url = `${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/random-available?deviceId=${deviceId}`;
      if (excludePsalm) {
        url += `&excludePsalm=${excludePsalm}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: "All Tehillim Complete!",
            description: "Amazing! The entire Sefer Tehillim has been completed.",
          });
          return;
        }
        throw new Error('Failed to get psalm');
      }
      const data = await response.json();
      if (data.psalmNumber && typeof data.psalmNumber === 'number') {
        setCurrentPsalm(data.psalmNumber);
      } else {
        // No valid psalm returned, but request succeeded - likely all complete
        toast({
          title: "All Tehillim Complete!",
          description: "Amazing! The entire Sefer Tehillim has been completed.",
        });
      }
    } catch (error) {
      console.error('getRandomPsalm error:', error);
      toast({
        title: "Error",
        description: "Could not find an available psalm. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFindingAnother(false);
    }
  }, [slug, deviceId]);

  // Reset when slug changes
  useEffect(() => {
    setIsFindingAnother(false);
    setCurrentPsalm(null);
  }, [slug]);

  // Load initial psalm from chain data
  useEffect(() => {
    if (isFindingAnother) return;
    
    if (chainData?.nextPsalm && !currentPsalm) {
      setCurrentPsalm(chainData.nextPsalm);
    } else if (chainData && chainData.nextPsalm === null && !currentPsalm && !isFindingAnother) {
      toast({
        title: "All Tehillim Complete!",
        description: "Amazing! The entire Sefer Tehillim has been completed.",
      });
    }
  }, [chainData, currentPsalm, isFindingAnother]);

  const handleShare = async () => {
    const url = `${window.location.origin}/c/${slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tehillim Chain: ${chain?.name}`,
          text: `Join me in saying Tehillim for ${chain?.name} - ${toTitleCase(chain?.reason || '')}`,
          url,
        });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      }
    }
    
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with others." });
    } catch (clipboardError) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast({ title: "Link copied!", description: "Share it with others." });
      } catch {
        toast({ title: "Share this link", description: url });
      }
      document.body.removeChild(textArea);
    }
  };

  const handleGoogleCalendar = () => {
    if (!chain) return;
    
    const chainUrl = `${window.location.origin}/c/${slug}`;
    const eventTitle = `Daven for ${chain.name}`;
    
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
    
    // Format in local time (not UTC) for Google Calendar
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      const s = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${h}${m}${s}`;
    };
    
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/r/eventedit');
    googleCalendarUrl.searchParams.set('text', eventTitle);
    googleCalendarUrl.searchParams.set('location', chainUrl);
    googleCalendarUrl.searchParams.set('dates', `${formatLocalDate(startDate)}/${formatLocalDate(endDate)}`);
    googleCalendarUrl.searchParams.set('recur', 'RRULE:FREQ=WEEKLY;BYDAY=SU,MO,TU,WE,TH,FR');
    googleCalendarUrl.searchParams.set('details', `Time to say Tehillim for ${chain.name}\n\nOpen your Tehillim chain: ${chainUrl}`);
    
    const calendarUrl = googleCalendarUrl.toString();
    const newWindow = window.open(calendarUrl, '_blank');
    
    // If window.open fails (blocked by WebView), fallback to same-window navigation
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.assign(calendarUrl);
    }
    
    setShowReminderDialog(false);
    toast({ title: "Calendar opened!", description: "Save the event to get daily reminders." });
  };

  const handleAppleCalendar = () => {
    if (!chain) return;
    
    // Use backend endpoint for ICS file - works better in WebViews and mobile apps
    const icsUrl = `/api/tehillim-chains/${slug}/reminder.ics?time=${encodeURIComponent(reminderTime)}`;
    
    // Navigate to the ICS file - this triggers a download/calendar open in most environments
    window.location.assign(icsUrl);
    
    setShowReminderDialog(false);
    toast({ title: "Calendar file downloading!", description: "Open the file to add the reminder to your calendar." });
  };

  const handleComplete = () => {
    if (currentPsalm) {
      completeReadingMutation.mutate(currentPsalm);
    }
  };

  const handleFindAnother = () => {
    if (isFindingAnother) return;
    setIsFindingAnother(true);
    getRandomPsalm(currentPsalm);
  };

  if (chainLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="animate-spin w-8 h-8 border-4 border-blush border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (chainError || !chain) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 p-6">
        <h1 className="platypi-bold text-2xl text-black mb-2">Chain Not Found</h1>
        <p className="platypi-regular text-black/60 text-center mb-6">
          This Tehillim chain doesn't exist or may have been removed.
        </p>
        <button
          onClick={() => setLocation('/')}
          className="bg-gradient-feminine text-white rounded-full px-6 py-3 platypi-medium"
          data-testid="button-go-home"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-50 overflow-hidden">
      {/* Header with Tehillim name */}
      <div className="flex items-center p-4 border-b border-blush/10 bg-white safe-area-top">
        <button
          onClick={() => setLocation('/')}
          className="p-2 rounded-full hover:bg-blush/10 transition-colors flex-shrink-0"
          data-testid="button-back"
        >
          <ChevronLeft size={24} className="text-black" />
        </button>
        
        <div className="flex-1 min-w-0 text-center px-2">
          <h1 className="platypi-bold text-lg text-black truncate">
            {psalmContent?.displayTitle || (currentPsalm ? `Tehillim ${currentPsalm}` : chain.name)}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowReminderDialog(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-feminine hover:scale-105 transition-all shadow-sm"
            data-testid="button-reminder"
            title="Set daily reminder"
          >
            <Bell size={16} strokeWidth={2.5} className="text-white" />
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-feminine text-white hover:scale-105 transition-all shadow-sm"
            data-testid="button-share"
          >
            <Share2 size={16} />
            <span className="text-sm platypi-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Tehillim Chain section with border */}
          <div 
            className={`py-3 px-4 border border-blush/20 rounded-xl bg-white relative ${chain.description ? 'cursor-pointer' : ''}`}
            onClick={() => chain.description && setIsDescriptionExpanded(!isDescriptionExpanded)}
            data-testid="chain-header"
          >
            <div className="flex items-center justify-between">
              <div className="text-left flex-1">
                <p className="platypi-medium text-sm text-black/60">Tehillim Chain for</p>
                <p className="platypi-bold text-base text-black">{chain.name}</p>
              </div>
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blush/10">
                  {(() => {
                    const ReasonIcon = getReasonIcon(chain.reason);
                    return <ReasonIcon size={20} className="text-blush" />;
                  })()}
                </div>
                <p className="platypi-regular text-[10px] text-black/50 whitespace-nowrap">{toTitleCase(chain.reason)}</p>
              </div>
            </div>
            {chain.description && isDescriptionExpanded && (
              <div className="mt-3 pt-3 border-t border-blush/10">
                <p className="platypi-regular text-sm text-black/80 leading-relaxed whitespace-pre-line">{chain.description}</p>
              </div>
            )}
            {chain.description && (
              <div 
                className={`absolute bottom-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-gradient-feminine shadow-sm transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`}
              >
                <ChevronDown size={12} className="text-white" />
              </div>
            )}
          </div>

          {/* Progress bar - uses totalCompleted directly for consistency */}
          {(() => {
            // Use totalCompleted directly instead of deriving from available to avoid inconsistency
            const completed = displayStats?.totalCompleted || 0;
            const percentage = Math.round((completed / 171) * 100);
            const showCountInside = percentage >= 75;
            const booksCount = displayStats?.booksCompleted || 0;
            const booksText = booksCount > 0 ? ` (${booksCount} ${booksCount === 1 ? 'Book' : 'Books'} Completed)` : '';
            return (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="platypi-bold text-black/60">Sefer Completion Progress</span>
                  <span className="platypi-bold text-black">{percentage}%</span>
                </div>
                <div className="h-5 bg-gradient-feminine rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-sage rounded-full transition-all duration-500 flex items-center"
                    style={{ width: `${percentage}%` }}
                  >
                    {showCountInside && (
                      <span className="platypi-bold text-[10px] text-white ml-auto mr-2 whitespace-nowrap">{completed}/171{booksText}</span>
                    )}
                  </div>
                  {!showCountInside && completed > 0 && (
                    <span 
                      className="absolute top-1/2 -translate-y-1/2 platypi-bold text-[10px] text-black/70 whitespace-nowrap"
                      style={{ left: `calc(${percentage}% + 6px)` }}
                    >
                      {completed}/171{booksText}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Tehillim text in white rounded box */}
          <div className="bg-white rounded-2xl p-6 border border-blush/10 relative">
            {psalmContent ? (
              <div
                className={`leading-relaxed text-black pb-4 ${showHebrew ? 'text-right vc-koren-hebrew' : 'text-left koren-siddur-english'} ${psalmLoading || isFindingAnother ? 'opacity-50' : ''}`}
                style={{ fontSize: showHebrew ? `${fontSize + 1}px` : `${fontSize}px` }}
                dir={showHebrew ? 'rtl' : 'ltr'}
                dangerouslySetInnerHTML={{
                  __html: formatTextContent(showHebrew ? psalmContent.hebrewText : psalmContent.englishText)
                }}
              />
            ) : (
              <div className="flex items-center justify-center min-h-[200px]">
                <p className="platypi-regular text-black/60">Loading tehillim...</p>
              </div>
            )}
            
          </div>

          {/* Koren Attribution */}
          <AttributionSection
            label="All tefilla texts courtesy of Koren Publishers Jerusalem and Rabbi Sacks Legacy"
            logoUrl="https://res.cloudinary.com/dsqq7a7ab/image/upload/v1764147872/1_gbfqps.png"
            aboutText="Koren Publishers Jerusalem is the leading publisher of Jewish religious texts, known for its beautiful typography and scholarly editions. Founded by Eliyahu Koren, the company has set the standard for Hebrew-language religious publishing with its distinctive Koren typeface and acclaimed editions of the Siddur, Tanakh, and Talmud."
            websiteUrl={korenUrl}
            websiteLabel="Visit Koren Publishers"
          />

          {/* Buttons */}
          <div className="flex space-x-3 pt-2 pb-2">
            <button
              onClick={handleFindAnother}
              disabled={!currentPsalm || isFindingAnother}
              className="flex-1 py-4 rounded-2xl border border-amber-200/50 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 platypi-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-amber-200 hover:to-yellow-200 hover:scale-105 transition-all"
              data-testid="button-find-another"
            >
              {isFindingAnother ? 'Loading...' : 'Find me another'}
            </button>
            <button
              onClick={handleComplete}
              disabled={!currentPsalm || completeReadingMutation.isPending}
              className="flex-1 py-4 rounded-2xl bg-gradient-feminine text-white platypi-medium disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform complete-button-pulse"
              data-testid="button-complete"
            >
              {completeReadingMutation.isPending ? "Completing..." : "Complete"}
            </button>
          </div>
          
          {/* Do Other Mitsvahs Button */}
          <div className="pb-4">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-sage via-sage/90 to-lavender text-white platypi-medium shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-300"
              data-testid="button-do-other-mitsvahs"
            >
              ✨ Do Other Mitsvahs ✨
            </button>
          </div>
        </div>
      </div>
      
      {/* Fixed settings button at bottom left */}
      <div 
        className="fixed left-6"
        style={{ 
          bottom: 'calc(1.5rem + var(--viewport-bottom-offset, 0px))',
          zIndex: 2147483646
        }}
      >
        <SettingsButton
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          showHebrew={showHebrew}
          onLanguageChange={(lang) => setShowHebrew(lang === 'hebrew')}
        />
      </div>

      {/* Daily Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="platypi-bold text-xl text-center">Set Daily Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <p className="platypi-regular text-black/70 text-center text-sm">
              Get a daily reminder to daven for {chain?.name}
            </p>
            
            <div className="space-y-2">
              <label className="platypi-medium text-sm text-black/80 block text-center">
                Choose your reminder time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full p-3 border border-blush/20 rounded-xl text-center platypi-regular text-lg focus:outline-none focus:ring-2 focus:ring-blush/30"
              />
            </div>
            
            <p className="platypi-regular text-xs text-black/50 text-center">
              Repeats Sunday through Friday (excluding Shabbat)
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleGoogleCalendar}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium hover:scale-105 transition-all"
              >
                Add to Google Calendar
              </Button>
              <Button
                onClick={handleAppleCalendar}
                variant="outline"
                className="w-full border-blush/30 text-black py-3 rounded-xl platypi-medium hover:scale-105 hover:bg-blush/5 transition-all"
              >
                Add to Apple Calendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Settings button component - fixed position at bottom left
function SettingsButton({ 
  fontSize, 
  onFontSizeChange, 
  showHebrew, 
  onLanguageChange 
}: { 
  fontSize: number; 
  onFontSizeChange: (size: number) => void; 
  showHebrew: boolean; 
  onLanguageChange: (lang: 'hebrew' | 'english') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-feminine text-white rounded-full p-2.5 shadow-lg hover:scale-110 transition-all duration-200"
        aria-label="Open settings"
      >
        <Settings className="w-5 h-5" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-12 left-0 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 min-w-[200px]">
            <div className="space-y-4">
              {/* Language Selector */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 text-center">Language</p>
                <div className="flex bg-gradient-feminine rounded-2xl p-1">
                  <button
                    onClick={() => {
                      onLanguageChange('hebrew');
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-1 ${
                      showHebrew 
                        ? 'bg-white text-black shadow-sm' 
                        : 'text-white hover:text-gray-100'
                    }`}
                  >
                    עברית
                  </button>
                  <button
                    onClick={() => {
                      onLanguageChange('english');
                      setIsOpen(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-1 ${
                      !showHebrew 
                        ? 'bg-white text-black shadow-sm' 
                        : 'text-white hover:text-gray-100'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Font Size Controls */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 text-center">Font Size</p>
                <div className="flex items-center justify-center gap-2 bg-gradient-feminine rounded-2xl p-2">
                  <button
                    onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
                    aria-label="Decrease font size"
                  >
                    A-
                  </button>
                  <span className="text-sm text-white font-medium px-2">
                    {fontSize}px
                  </span>
                  <button
                    onClick={() => onFontSizeChange(Math.min(28, fontSize + 2))}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
                    aria-label="Increase font size"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 text-center">Tap outside to close</p>
          </div>
        </>
      )}
    </div>
  );
}

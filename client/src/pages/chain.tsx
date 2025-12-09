import { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Share2, ChevronLeft, Heart, Briefcase, Baby, Home, Star, Shield, Sparkles, HeartPulse, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatTextContent } from "@/lib/text-formatter";
import { AttributionSection } from "@/components/ui/attribution-section";
import { useLocationStore } from "@/hooks/use-jewish-times";
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

// Format reason code to display text
const formatReason = (reason: string): string => {
  const reasonMap: Record<string, string> = {
    'refuah': 'Refuah Shleima',
    'refuah shleima': 'Refuah Shleima',
    'shidduch': 'Shidduch',
    'parnassa': 'Parnassa',
    'children': 'Children',
    'shalom-bayis': 'Shalom Bayis',
    'shalom bayis': 'Shalom Bayis',
    'success': 'Success',
    'protection': 'Protection',
    'general': 'General Tefillos',
    'general tefillos': 'General Tefillos',
  };
  const mapped = reasonMap[reason.toLowerCase()];
  if (mapped) return mapped;
  // Fallback: capitalize first letter of each word
  return reason.split(/[\s-]+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
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
  const queryClient = useQueryClient();
  
  const [showHebrew, setShowHebrew] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [currentPsalm, setCurrentPsalm] = useState<number | null>(null);
  
  // Track loading state for find another button
  const [isFindingAnother, setIsFindingAnother] = useState(false);
  
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
  const stats = chainData?.stats;

  // Separate stats query for periodic refresh only (not blocking initial load)
  const { data: refreshedStats } = useQuery<ChainStats>({
    queryKey: ['/api/tehillim-chains', slug, 'stats'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!slug && !!chainData,
    refetchInterval: 30000,
    staleTime: 0,
  });

  // Use refreshed stats if available, otherwise use initial stats
  const displayStats = refreshedStats || stats;

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

  const completeReadingMutation = useMutation({
    mutationFn: async (psalmNumber: number) => {
      // Fire and forget the completion - don't wait for it
      fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, psalmNumber }),
      }).catch(() => {});
      
      // Immediately get next psalm
      const nextResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/random-available?deviceId=${deviceId}&excludePsalm=${psalmNumber}`);
      const nextData = nextResponse.ok ? await nextResponse.json() : null;
      return { nextPsalm: nextData?.psalmNumber || null };
    },
    onMutate: () => {
      // Optimistically update both stats sources
      queryClient.setQueryData(['/api/tehillim-chains', slug, 'stats'], (old: ChainStats | undefined) => {
        if (!old) return old;
        return {
          ...old,
          totalCompleted: (old.totalCompleted || 0) + 1,
          available: Math.max(0, (old.available || 171) - 1),
        };
      });
      // Also update the main chain data stats
      queryClient.setQueryData(['/api/tehillim-chains', slug, deviceId], (old: ChainWithMeta | undefined) => {
        if (!old?.stats) return old;
        return {
          ...old,
          stats: {
            ...old.stats,
            totalCompleted: (old.stats.totalCompleted || 0) + 1,
            available: Math.max(0, (old.stats.available || 171) - 1),
          },
        };
      });
    },
    onSuccess: async (data) => {
      // Load next psalm silently (no popup)
      if (data.nextPsalm) {
        setCurrentPsalm(data.nextPsalm);
      } else {
        setCurrentPsalm(null);
      }
      
      // Background refresh stats after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/tehillim-chains', slug, 'stats'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tehillim-chains/stats/total'] });
      }, 2000);
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
      setCurrentPsalm(data.psalmNumber);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not find an available psalm.",
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
          text: `Join me in saying Tehillim for ${chain?.name} - ${chain?.reason}`,
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

  // Stats: show Completed, Books (if any), Available (remove Reading)
  const showBooksCompleted = (displayStats?.booksCompleted || 0) > 0;

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
        
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-feminine text-white hover:scale-105 transition-all shadow-sm flex-shrink-0"
          data-testid="button-share"
        >
          <Share2 size={16} />
          <span className="text-sm platypi-medium">Share</span>
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Community message */}
          <p className="platypi-regular text-sm text-black/70 text-center">
            Sefer Tehillim completed together, One chapter at a time.
          </p>

          {/* Progress bar */}
          {(() => {
            const completed = 171 - (displayStats?.available || 171);
            const percentage = Math.round((completed / 171) * 100);
            return (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="platypi-regular text-black/60">Progress</span>
                  <span className="platypi-bold text-black">{percentage}%</span>
                </div>
                <div className="h-3 bg-gradient-feminine rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sage rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {showBooksCompleted && (
                  <p className="platypi-regular text-[10px] text-black/50 text-center">
                    {displayStats?.booksCompleted} complete {displayStats?.booksCompleted === 1 ? 'book' : 'books'}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Davening for section with border */}
          <div className="text-center py-3 px-4 border border-blush/20 rounded-xl bg-white">
            <p className="platypi-medium text-base text-black flex items-center justify-center gap-2 flex-wrap">
              <span>Davening for: <span className="platypi-bold">{chain.name}</span></span>
              <span className="flex items-center gap-1">
                <span className="text-black/50">(</span>
                {(() => {
                  const ReasonIcon = getReasonIcon(chain.reason);
                  return <ReasonIcon size={14} className="text-blush" />;
                })()}
                <span className="platypi-regular text-black/70">{formatReason(chain.reason)}</span>
                <span className="text-black/50">)</span>
              </span>
            </p>
          </div>

          {/* Tehillim text in white rounded box */}
          <div className="bg-white rounded-2xl p-6 border border-blush/10 relative">
            {psalmContent ? (
              <div
                className={`leading-relaxed text-black pb-16 ${showHebrew ? 'text-right vc-koren-hebrew' : 'text-left koren-siddur-english'} ${psalmLoading || isFindingAnother ? 'opacity-50' : ''}`}
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
          <div className="flex space-x-3 pt-2 pb-4">
            <button
              onClick={handleFindAnother}
              disabled={!currentPsalm || isFindingAnother}
              className="flex-1 py-4 rounded-2xl border-2 border-blush/30 bg-white text-black platypi-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blush/5 hover:scale-105 transition-transform"
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

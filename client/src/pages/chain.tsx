import { useEffect, useState, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Share2, ChevronLeft, Heart, Briefcase, Baby, Home, Star, Shield, Sparkles, HeartPulse } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FloatingSettings } from "@/components/ui/floating-settings";
import { formatTextContent } from "@/lib/text-formatter";
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
  const [isReading, setIsReading] = useState(false);
  
  // Prevent duplicate psalm loading (React strict mode / double renders)
  const isLoadingPsalmRef = useRef(false);
  // Prevent auto-load useEffect from interfering when manually finding another psalm
  const isFindingAnotherRef = useRef(false);
  const [isFindingAnother, setIsFindingAnother] = useState(false);

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
    staleTime: 0, // Always refetch when requested
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

  const startReadingMutation = useMutation({
    mutationFn: async (psalmNumber: number) => {
      return apiRequest('POST', `${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/start-reading`, {
        deviceId,
        psalmNumber,
      });
    },
    onSuccess: () => {
      // Refetch stats to update currentlyReading count
      queryClient.refetchQueries({ queryKey: ['/api/tehillim-chains', slug, 'stats'] });
    },
  });

  const completeReadingMutation = useMutation({
    mutationFn: async (psalmNumber: number) => {
      return apiRequest('POST', `${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/complete`, {
        deviceId,
        psalmNumber,
      });
    },
    onSuccess: async () => {
      toast({
        title: "Tehillim Completed!",
        description: "May all your tefillas be answered.",
      });
      
      // Refetch stats and load next psalm in parallel for speed
      try {
        const [, nextPsalmResponse] = await Promise.all([
          Promise.all([
            queryClient.refetchQueries({ queryKey: ['/api/tehillim-chains', slug, 'stats'] }),
            queryClient.refetchQueries({ queryKey: ['/api/tehillim-chains/stats/total'] }),
          ]),
          fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/next-available?deviceId=${deviceId}`)
        ]);
        
        // Process next psalm response
        if (nextPsalmResponse.ok) {
          const data = await nextPsalmResponse.json();
          setCurrentPsalm(data.psalmNumber);
          setIsReading(true);
          startReadingMutation.mutate(data.psalmNumber);
        } else {
          // No more psalms available
          setIsReading(false);
          setCurrentPsalm(null);
        }
      } catch {
        // Network error - reset state gracefully
        setIsReading(false);
        setCurrentPsalm(null);
      }
    },
  });

  // Get a random psalm (used for "Find me another" button)
  const getRandomPsalm = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/random-available?deviceId=${deviceId}`
      );
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
      setIsReading(true);
      startReadingMutation.mutate(data.psalmNumber);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not find an available psalm.",
        variant: "destructive",
      });
    } finally {
      // Reset the finding another flag after the operation completes
      isFindingAnotherRef.current = false;
      setIsFindingAnother(false);
    }
  }, [slug, deviceId, startReadingMutation]);

  // Reset loading refs when slug changes (navigating to different chain)
  useEffect(() => {
    isLoadingPsalmRef.current = false;
    isFindingAnotherRef.current = false;
    setIsFindingAnother(false);
    setCurrentPsalm(null);
    setIsReading(false);
  }, [slug]);

  // Use nextPsalm from initial response for instant loading
  useEffect(() => {
    // Skip if user is manually finding another psalm (prevents race condition)
    if (isFindingAnotherRef.current) {
      return;
    }
    
    if (chainData?.nextPsalm && !currentPsalm && !isReading) {
      setCurrentPsalm(chainData.nextPsalm);
      setIsReading(true);
      // Only start a new reading if user doesn't already have an active one
      if (!chainData.hasActiveReading) {
        startReadingMutation.mutate(chainData.nextPsalm);
      }
      isLoadingPsalmRef.current = false;
    } else if (chainData && chainData.nextPsalm === null && !currentPsalm && !isFindingAnotherRef.current) {
      // All psalms completed
      toast({
        title: "All Tehillim Complete!",
        description: "Amazing! The entire Sefer Tehillim has been completed.",
      });
    }
  }, [chainData, currentPsalm, isReading, startReadingMutation]);

  const handleShare = async () => {
    const url = `${window.location.origin}/c/${slug}`;
    
    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tehillim Chain: ${chain?.name}`,
          text: `Join me in saying Tehillim for ${chain?.name} - ${chain?.reason}`,
          url,
        });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return; // User cancelled share
        }
        // Fall through to clipboard fallback
      }
    }
    
    // Clipboard fallback with error handling
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with others." });
    } catch (clipboardError) {
      // Final fallback: create temporary textarea
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
        toast({ 
          title: "Share this link", 
          description: url,
        });
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
    // Prevent double-clicks and race conditions
    if (isFindingAnother || isFindingAnotherRef.current) {
      return;
    }
    
    // Set flag BEFORE resetting state to prevent useEffect from interfering
    isFindingAnotherRef.current = true;
    setIsFindingAnother(true);
    
    setIsReading(false);
    setCurrentPsalm(null);
    getRandomPsalm();
  };

  if (chainLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-soft flex items-center justify-center z-50">
        <div className="animate-spin w-8 h-8 border-4 border-blush border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (chainError || !chain) {
    return (
      <div className="fixed inset-0 bg-gradient-soft flex flex-col items-center justify-center z-50 p-6">
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

  // Count visible stats to determine centering
  const showBooksCompleted = (displayStats?.booksCompleted || 0) > 0;
  const visibleStats = showBooksCompleted ? 4 : 3;

  return (
    <div className="fixed inset-0 bg-gradient-soft flex flex-col z-50 overflow-hidden">
      <div className="flex items-center p-4 border-b border-blush/10 bg-white/80 backdrop-blur-sm safe-area-top">
        <button
          onClick={() => setLocation('/')}
          className="p-2 rounded-full hover:bg-blush/10 transition-colors flex-shrink-0"
          data-testid="button-back"
        >
          <ChevronLeft size={24} className="text-black" />
        </button>
        
        <div className="flex-1 min-w-0 text-center px-2">
          <h1 className="platypi-bold text-lg text-black truncate">{chain.name}</h1>
        </div>
        
        <button
          onClick={handleShare}
          className="p-2 rounded-full hover:bg-blush/10 transition-colors flex-shrink-0"
          data-testid="button-share"
        >
          <Share2 size={20} className="text-blush" />
        </button>
      </div>

      <div className="p-4 bg-white/50 border-b border-blush/10">
        <div className="flex items-center justify-center gap-2 mb-3">
          {(() => {
            const ReasonIcon = getReasonIcon(chain.reason);
            return <ReasonIcon size={16} className="text-blush" />;
          })()}
          <p className="platypi-regular text-sm text-black/70">{chain.reason}</p>
        </div>
        
        <div className={`grid gap-2 ${visibleStats === 3 ? 'grid-cols-3 max-w-xs mx-auto' : 'grid-cols-4'}`}>
          <div className="bg-white rounded-xl px-2 py-1.5 text-center border border-blush/10">
            <p className="platypi-bold text-sm text-black">{displayStats?.totalCompleted || 0}</p>
            <p className="platypi-regular text-[10px] text-black/60">Completed</p>
          </div>
          {showBooksCompleted && (
            <div className="bg-white rounded-xl px-2 py-1.5 text-center border border-blush/10">
              <p className="platypi-bold text-sm text-black">{displayStats?.booksCompleted || 0}</p>
              <p className="platypi-regular text-[10px] text-black/60">Books</p>
            </div>
          )}
          <div className="bg-white rounded-xl px-2 py-1.5 text-center border border-blush/10">
            <p className="platypi-bold text-sm text-black">{displayStats?.currentlyReading || 0}</p>
            <p className="platypi-regular text-[10px] text-black/60">Reading</p>
          </div>
          <div className="bg-white rounded-xl px-2 py-1.5 text-center border border-blush/10">
            <p className="platypi-bold text-sm text-black">{displayStats?.available || 150}</p>
            <p className="platypi-regular text-[10px] text-black/60">Available</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-3 bg-white border-b border-blush/10">
        <span className="platypi-medium text-sm text-black">
          {psalmContent?.displayTitle || (currentPsalm ? `Psalm ${currentPsalm}` : 'Loading...')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto bg-white relative">
        <div className="p-4 pb-20">
          {psalmLoading ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
            </div>
          ) : psalmContent ? (
            <div
              className={`leading-relaxed text-black ${showHebrew ? 'text-right vc-koren-hebrew' : 'text-left koren-siddur-english'}`}
              style={{ fontSize: showHebrew ? `${fontSize + 1}px` : `${fontSize}px` }}
              dir={showHebrew ? 'rtl' : 'ltr'}
              dangerouslySetInnerHTML={{
                __html: formatTextContent(showHebrew ? psalmContent.hebrewText : psalmContent.englishText)
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        
        <FloatingSettings
          showLanguageControls={true}
          language={showHebrew ? 'hebrew' : 'english'}
          onLanguageChange={(lang) => setShowHebrew(lang === 'hebrew')}
          showFontControls={true}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          bottomOffset="6rem"
        />
      </div>

      <div className="p-4 bg-white border-t border-blush/10 safe-area-bottom">
        <div className="flex space-x-3">
          <button
            onClick={handleFindAnother}
            disabled={!currentPsalm || isFindingAnother}
            className="flex-1 py-4 rounded-2xl border-2 border-blush/30 bg-white text-black platypi-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blush/5 transition-colors"
            data-testid="button-find-another"
          >
            {isFindingAnother ? 'Loading...' : 'Find me another'}
          </button>
          <button
            onClick={handleComplete}
            disabled={!currentPsalm || completeReadingMutation.isPending}
            className="flex-1 py-4 rounded-2xl bg-gradient-feminine text-white platypi-medium disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-complete"
          >
            {completeReadingMutation.isPending ? "Completing..." : "Complete"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Share2, BookOpen, Users, CheckCircle2, Clock, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TehillimChain } from "@shared/schema";

interface ChainStats {
  totalCompleted: number;
  booksCompleted: number;
  currentlyReading: number;
  available: number;
}

interface TehillimContent {
  hebrewText: string;
  englishText: string;
  psalmNumber: number;
}

export default function ChainPage() {
  const [, params] = useRoute("/c/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug || "";
  const queryClient = useQueryClient();
  
  const [showHebrew, setShowHebrew] = useState(true);
  const [currentPsalm, setCurrentPsalm] = useState<number | null>(null);
  const [isReading, setIsReading] = useState(false);

  const deviceId = (() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = 'device-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
      localStorage.setItem('deviceId', id);
    }
    return id;
  })();

  const { data: chain, isLoading: chainLoading, error: chainError } = useQuery<TehillimChain>({
    queryKey: ['/api/tehillim-chains', slug],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}`);
      if (!response.ok) throw new Error('Chain not found');
      return response.json();
    },
    enabled: !!slug,
  });

  const { data: stats } = useQuery<ChainStats>({
    queryKey: ['/api/tehillim-chains', slug, 'stats'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!slug && !!chain,
    refetchInterval: 30000,
  });

  const { data: psalmContent } = useQuery<TehillimContent>({
    queryKey: ['/api/tehillim-chains', slug, 'psalm', currentPsalm],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tehillim/${currentPsalm}`);
      if (!response.ok) throw new Error('Failed to fetch psalm');
      return response.json();
    },
    enabled: !!currentPsalm && isReading,
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
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim-chains', slug, 'stats'] });
    },
  });

  const completeReadingMutation = useMutation({
    mutationFn: async (psalmNumber: number) => {
      return apiRequest('POST', `${import.meta.env.VITE_API_URL}/api/tehillim-chains/${slug}/complete`, {
        deviceId,
        psalmNumber,
      });
    },
    onSuccess: () => {
      toast({
        title: "Tehillim Completed!",
        description: "May your prayers be answered.",
      });
      setIsReading(false);
      setCurrentPsalm(null);
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim-chains', slug, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim-chains/stats/total'] });
    },
  });

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
    }
  }, [slug, deviceId, startReadingMutation]);

  useEffect(() => {
    if (chain && !currentPsalm && !isReading) {
      getRandomPsalm();
    }
  }, [chain, currentPsalm, isReading, getRandomPsalm]);

  const handleShare = async () => {
    const url = `${window.location.origin}/c/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tehillim Chain: ${chain?.name}`,
          text: `Join me in saying Tehillim for ${chain?.name} - ${chain?.reason}`,
          url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(url);
          toast({ title: "Link copied!", description: "Share it with others." });
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Share it with others." });
    }
  };

  const handleComplete = () => {
    if (currentPsalm) {
      completeReadingMutation.mutate(currentPsalm);
    }
  };

  const handleFindAnother = () => {
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
        <Button
          onClick={() => setLocation('/')}
          className="bg-gradient-feminine text-white rounded-full px-6"
        >
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-soft flex flex-col z-50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-blush/10 bg-white/80 backdrop-blur-sm safe-area-top">
        <button
          onClick={() => setLocation('/')}
          className="p-2 rounded-full hover:bg-blush/10 transition-colors"
          data-testid="button-back"
        >
          <ChevronLeft size={24} className="text-black" />
        </button>
        
        <div className="flex-1 text-center">
          <h1 className="platypi-bold text-lg text-black truncate px-2">{chain.name}</h1>
        </div>
        
        <button
          onClick={handleShare}
          className="p-2 rounded-full hover:bg-blush/10 transition-colors"
          data-testid="button-share"
        >
          <Share2 size={20} className="text-blush" />
        </button>
      </div>

      <div className="p-4 bg-white/50 border-b border-blush/10">
        <p className="platypi-regular text-sm text-black/70 text-center mb-3">{chain.reason}</p>
        
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-xl p-2 text-center border border-blush/10">
            <BookOpen size={16} className="text-blush mx-auto mb-1" />
            <p className="platypi-bold text-sm text-black">{stats?.totalCompleted || 0}</p>
            <p className="platypi-regular text-[10px] text-black/60">Said</p>
          </div>
          {(stats?.booksCompleted || 0) > 0 && (
            <div className="bg-white rounded-xl p-2 text-center border border-blush/10">
              <CheckCircle2 size={16} className="text-sage mx-auto mb-1" />
              <p className="platypi-bold text-sm text-black">{stats?.booksCompleted || 0}</p>
              <p className="platypi-regular text-[10px] text-black/60">Books</p>
            </div>
          )}
          <div className="bg-white rounded-xl p-2 text-center border border-blush/10">
            <Users size={16} className="text-lavender mx-auto mb-1" />
            <p className="platypi-bold text-sm text-black">{stats?.currentlyReading || 0}</p>
            <p className="platypi-regular text-[10px] text-black/60">Reading</p>
          </div>
          <div className="bg-white rounded-xl p-2 text-center border border-blush/10">
            <Clock size={16} className="text-gold mx-auto mb-1" />
            <p className="platypi-bold text-sm text-black">{stats?.available || 150}</p>
            <p className="platypi-regular text-[10px] text-black/60">Available</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-white/30">
        <span className="platypi-medium text-sm text-black">
          {currentPsalm ? `Psalm ${currentPsalm}` : 'Loading...'}
        </span>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHebrew(true)}
            className={`text-xs px-3 py-1 h-7 rounded-full ${showHebrew ? 'bg-blush text-white border-blush' : 'bg-white border-blush/30 text-black'}`}
            data-testid="button-hebrew"
          >
            עברית
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHebrew(false)}
            className={`text-xs px-3 py-1 h-7 rounded-full ${!showHebrew ? 'bg-blush text-white border-blush' : 'bg-white border-blush/30 text-black'}`}
            data-testid="button-english"
          >
            English
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {psalmContent ? (
          <div
            className={`text-lg leading-relaxed ${showHebrew ? 'text-right koren-siddur' : 'text-left platypi-regular'}`}
            dir={showHebrew ? 'rtl' : 'ltr'}
          >
            {showHebrew ? psalmContent.hebrewText : psalmContent.englishText}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-6 h-6 border-2 border-blush border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-blush/10 safe-area-bottom">
        <div className="flex space-x-3">
          <Button
            onClick={handleFindAnother}
            variant="outline"
            className="flex-1 py-6 rounded-2xl bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200 platypi-medium"
            disabled={!currentPsalm}
            data-testid="button-find-another"
          >
            Find me another
          </Button>
          <Button
            onClick={handleComplete}
            className="flex-1 py-6 rounded-2xl bg-sage hover:bg-sage/90 text-white platypi-medium"
            disabled={!currentPsalm || completeReadingMutation.isPending}
            data-testid="button-complete"
          >
            {completeReadingMutation.isPending ? "Completing..." : "Complete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

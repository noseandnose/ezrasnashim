import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete, useAnalytics } from "@/hooks/use-analytics";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { formatTextContent } from "@/lib/text-formatter";
import { useHomeSummary } from "@/hooks/use-home-summary";
import { Users, Sparkles, Target, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axiosClient from "@/lib/axiosClient";
import { apiRequest } from "@/lib/queryClient";

interface TehillimText {
  text: string;
  perek: number;
  language: string;
}

export default function CommunityChallengeModal() {
  const { activeModal, closeModal } = useModalStore();
  const { completeTask } = useDailyCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { trackEvent } = useAnalytics();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasCompletedThisSession, setHasCompletedThisSession] = useState(false);
  const [localCount, setLocalCount] = useState<number | null>(null);
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [fontSize, setFontSize] = useState(18);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isOpen = activeModal === 'community-challenge';

  const { data: homeSummary, refetch: refetchHomeSummary } = useHomeSummary();
  const challenge = homeSummary?.todaysSpecial;

  const isChallenge = !!challenge?.challengeType;
  const challengeId = challenge?.id;
  const pillarType = challenge?.pillarType as 'torah' | 'tefilla' | undefined;
  const modalName = challenge?.modalName || 'community-challenge';
  
  const serverCount = challenge?.currentCount || 0;
  const currentCount = localCount !== null ? localCount : serverCount;
  const targetCount = challenge?.targetCount || 100;
  const progressPercent = Math.min((currentCount / targetCount) * 100, 100);
  const isGoalReached = currentCount >= targetCount;

  const { data: tehillimText, isLoading: tehillimLoading } = useQuery<TehillimText>({
    queryKey: ['/api/tehillim/text', challenge?.challengeContentId, language],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/tehillim/text/${challenge?.challengeContentId}`, {
        params: { language }
      });
      return response.data;
    },
    enabled: isOpen && challenge?.challengeType === 'tehillim' && !!challenge?.challengeContentId,
    staleTime: 60 * 60 * 1000,
  });

  const { data: nishmasText, isLoading: nishmasLoading } = useQuery<{ hebrewText: string; englishText: string }>({
    queryKey: ['/api/tefilla/nishmas'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/tefilla/nishmas');
      return response.data;
    },
    enabled: isOpen && challenge?.challengeType === 'nishmas',
    staleTime: 60 * 60 * 1000,
  });

  const { data: halachaContent, isLoading: halachaLoading } = useQuery<any>({
    queryKey: ['/api/torah/halacha'],
    queryFn: async () => {
      const response = await axiosClient.get('/api/torah/halacha');
      return response.data;
    },
    enabled: isOpen && challenge?.challengeType === 'halacha',
    staleTime: 60 * 60 * 1000,
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!challengeId) throw new Error("No challenge ID");
      return apiRequest('POST', `/api/challenge/${challengeId}/complete`);
    },
    onSuccess: () => {
      refetchHomeSummary();
      queryClient.invalidateQueries({ queryKey: ['/api/home-summary'] });
    }
  });

  const handleComplete = useCallback(async () => {
    if (isCompleting || !challenge) return;
    setIsCompleting(true);
    
    setLocalCount(prev => (prev !== null ? prev : serverCount) + 1);
    
    try {
      if (isChallenge) {
        await completeMutation.mutateAsync();
      }
      
      if (modalName) {
        trackModalComplete(modalName);
      }
      
      if (pillarType) {
        completeTask(pillarType);
      }
      
      if (challenge.challengeType === 'tehillim' && challenge.challengeContentId) {
        trackEvent("tehillim_complete", { 
          psalmNumber: challenge.challengeContentId,
          source: 'community-challenge'
        });
        
        const refreshEvent = new CustomEvent('tehillimCompleted');
        window.dispatchEvent(refreshEvent);
      }
      
      setShowHeartExplosion(true);
      setHasCompletedThisSession(true);
      
      queryClient.invalidateQueries({ queryKey: ['/api/home-summary'] });
      
      setTimeout(() => {
        setShowHeartExplosion(false);
        setIsCompleting(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to complete challenge:', error);
      setLocalCount(prev => prev !== null ? prev - 1 : serverCount);
      setIsCompleting(false);
    }
  }, [isCompleting, challenge, isChallenge, completeMutation, modalName, trackModalComplete, pillarType, completeTask, trackEvent, serverCount, queryClient]);

  const isLoading = tehillimLoading || nishmasLoading || halachaLoading;

  const handleShare = async () => {
    const title = challenge?.title || "Community Challenge";
    const text = `Join me in the ${title}! Let's reach ${targetCount.toLocaleString()} together. We're at ${currentCount.toLocaleString()} so far!`;
    const url = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast({
          title: "Copied to clipboard",
          description: "Share link copied! Send it to a friend.",
        });
      } catch (err) {
        console.error('Copy failed:', err);
      }
    }
  };

  const renderContent = () => {
    if (!challenge) return null;

    if (challenge.challengeType === 'tehillim' && tehillimText) {
      return (
        <div className="bg-white rounded-2xl p-6 border border-blush/10">
          <h3 className="platypi-bold text-lg text-black text-center mb-4">
            Tehillim {tehillimText.perek}
          </h3>
          <div 
            className={`leading-relaxed text-black whitespace-pre-line ${
              language === 'hebrew' ? 'vc-koren-hebrew text-right' : 'platypi-regular text-left'
            }`}
            style={{ fontSize: `${fontSize}px` }}
            dir={language === 'hebrew' ? 'rtl' : 'ltr'}
            dangerouslySetInnerHTML={{ __html: formatTextContent(tehillimText.text) }}
          />
        </div>
      );
    }

    if (challenge.challengeType === 'nishmas' && nishmasText) {
      const text = language === 'hebrew' ? nishmasText.hebrewText : nishmasText.englishText;
      return (
        <div className="bg-white rounded-2xl p-6 border border-blush/10">
          <h3 className="platypi-bold text-lg text-black text-center mb-4">
            Nishmas Kol Chai
          </h3>
          <div 
            className={`leading-relaxed text-black whitespace-pre-line ${
              language === 'hebrew' ? 'vc-koren-hebrew text-right' : 'platypi-regular text-left'
            }`}
            style={{ fontSize: `${fontSize}px` }}
            dir={language === 'hebrew' ? 'rtl' : 'ltr'}
            dangerouslySetInnerHTML={{ __html: formatTextContent(text) }}
          />
        </div>
      );
    }

    if (challenge.challengeType === 'halacha' && halachaContent) {
      return (
        <div className="bg-white rounded-2xl p-6 border border-blush/10">
          {halachaContent.title && (
            <h3 className="platypi-bold text-lg text-black text-center mb-4">
              {halachaContent.title}
            </h3>
          )}
          <div 
            className="platypi-regular leading-relaxed text-black whitespace-pre-line"
            style={{ fontSize: `${fontSize}px` }}
            dangerouslySetInnerHTML={{ __html: formatTextContent(halachaContent.content) }}
          />
        </div>
      );
    }

    if (challenge.challengeType === 'custom' || !challenge.challengeType) {
      const text = language === 'hebrew' && challenge.contentHebrew 
        ? challenge.contentHebrew 
        : challenge.contentEnglish || challenge.contentHebrew;
      
      if (!text) return null;
      
      return (
        <div className="bg-white rounded-2xl p-6 border border-blush/10">
          <div 
            className={`leading-relaxed text-black whitespace-pre-line ${
              language === 'hebrew' && challenge.contentHebrew ? 'vc-koren-hebrew text-right' : 'platypi-regular text-left'
            }`}
            style={{ fontSize: `${fontSize}px` }}
            dir={language === 'hebrew' && challenge.contentHebrew ? 'rtl' : 'ltr'}
            dangerouslySetInnerHTML={{ __html: formatTextContent(text) }}
          />
        </div>
      );
    }

    return null;
  };

  const showLanguageToggle = 
    (challenge?.challengeType === 'tehillim') || 
    (challenge?.challengeType === 'nishmas') ||
    (challenge?.contentHebrew && challenge?.contentEnglish);

  const shareButton = isChallenge ? (
    <button
      onClick={handleShare}
      className="px-4 py-2 flex items-center gap-2 rounded-full bg-gradient-to-r from-blush to-lavender hover:from-blush/90 hover:to-lavender/90 active:scale-95 transition-all shadow-md"
      aria-label="Share challenge"
      type="button"
    >
      <Share2 size={16} className="text-white" />
      <span className="platypi-medium text-sm text-white font-medium">Share</span>
    </button>
  ) : undefined;

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={closeModal}
      title={challenge?.title || "Community Challenge"}
      showFontControls={true}
      fontSize={fontSize}
      onFontSizeChange={setFontSize}
      showLanguageControls={!!showLanguageToggle}
      language={language}
      onLanguageChange={setLanguage}
      headerAction={shareButton}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blush mx-auto"></div>
          <p className="text-sm text-black/60 mt-2">Loading challenge content...</p>
        </div>
      ) : challenge ? (
        <div className="space-y-4">
          {challenge.subtitle && (
            <p className="text-center text-black/70 platypi-regular">
              {challenge.subtitle}
            </p>
          )}

          {isChallenge && (
            <div className="bg-gradient-to-r from-blush/20 to-lavender/20 rounded-2xl p-4 border border-blush/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="text-blush" size={18} />
                  <span className="platypi-medium text-sm text-black">Community Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="text-sage" size={16} />
                  <span className="platypi-bold text-sm text-black">
                    {currentCount.toLocaleString()} / {targetCount.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="h-4 rounded-full overflow-hidden border border-blush/30 relative">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-blush to-lavender"
                />
                <div 
                  className="absolute inset-y-0 left-0 bg-sage rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              
              {isGoalReached && (
                <div className="flex items-center justify-center gap-2 mt-3 text-sage">
                  <Sparkles size={16} />
                  <span className="platypi-bold text-sm">Goal Reached! Keep going!</span>
                  <Sparkles size={16} />
                </div>
              )}
            </div>
          )}

          {(challenge as any)?.challengeMessage && (
            <div className="bg-gradient-to-r from-blush/10 to-lavender/10 rounded-xl p-4 border border-blush/20">
              <p className="platypi-regular text-center text-black/80 text-sm leading-relaxed">
                {(challenge as any).challengeMessage}
              </p>
            </div>
          )}

          {renderContent()}

          {challenge.url && challenge.linkTitle && (
            <a
              href={challenge.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center bg-gradient-feminine text-white rounded-xl px-4 py-2 platypi-medium text-sm hover:scale-105 transition-all"
            >
              {challenge.linkTitle}
            </a>
          )}

          <div className="heart-explosion-container">
            <Button 
              onClick={handleComplete}
              disabled={isCompleting}
              className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 transition-all duration-300 ${
                hasCompletedThisSession 
                  ? 'bg-sage text-white hover:bg-sage/90' 
                  : 'bg-gradient-feminine text-white hover:scale-105'
              }`}
            >
              {isCompleting ? 'Completing...' : hasCompletedThisSession ? 'Complete Again' : 'Complete'}
            </Button>
            <HeartExplosion trigger={showHeartExplosion} />
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-black/60 platypi-regular">No challenge available today.</p>
        </div>
      )}
    </FullscreenModal>
  );
}

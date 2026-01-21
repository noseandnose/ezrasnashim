import { Button } from "@/components/ui/button";
import { useModalStore, useDailyCompletionStore, useModalCompletionStore } from "@/lib/types";
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HeartExplosion } from "@/components/ui/heart-explosion";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";
import { formatTextContent } from "@/lib/text-formatter";
import { useHomeSummary } from "@/hooks/use-home-summary";
import { Users, Sparkles, Target } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { apiRequest } from "@/lib/queryClient";

interface TehillimText {
  id: number;
  psalm_number: number;
  hebrew_text: string;
  english_text: string;
}

export default function CommunityChallengeModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { markModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [showHeartExplosion, setShowHeartExplosion] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [language, setLanguage] = useState<'hebrew' | 'english'>('hebrew');
  const [fontSize, setFontSize] = useState(18);
  const queryClient = useQueryClient();

  const isOpen = activeModal === 'community-challenge';

  const { data: homeSummary, refetch: refetchHomeSummary } = useHomeSummary();
  const challenge = homeSummary?.todaysSpecial;

  const isChallenge = !!challenge?.challengeType;
  const challengeId = challenge?.id;
  const pillarType = challenge?.pillarType as 'torah' | 'tefilla' | undefined;
  const modalName = challenge?.modalName || 'community-challenge';
  
  const currentCount = challenge?.currentCount || 0;
  const targetCount = challenge?.targetCount || 100;
  const progressPercent = Math.min((currentCount / targetCount) * 100, 100);
  const isGoalReached = currentCount >= targetCount;

  const { data: tehillimText, isLoading: tehillimLoading } = useQuery<TehillimText>({
    queryKey: ['/api/tehillim/text', challenge?.challengeContentId, language],
    queryFn: async () => {
      const response = await axiosClient.get(`/api/tehillim/text/${challenge?.challengeContentId}?language=${language}`);
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
    
    try {
      if (isChallenge) {
        await completeMutation.mutateAsync();
      }
      
      if (modalName) {
        trackModalComplete(modalName);
        markModalComplete(modalName);
      }
      
      if (pillarType) {
        completeTask(pillarType);
      }
      
      setShowHeartExplosion(true);
      
      setTimeout(() => {
        setShowHeartExplosion(false);
        setIsCompleting(false);
        
        if (pillarType && checkAndShowCongratulations(pillarType)) {
          openModal('congratulations', pillarType);
        } else {
          closeModal();
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to complete challenge:', error);
      setIsCompleting(false);
    }
  }, [isCompleting, challenge, isChallenge, completeMutation, modalName, trackModalComplete, markModalComplete, pillarType, completeTask, checkAndShowCongratulations, openModal, closeModal]);

  const isLoading = tehillimLoading || nishmasLoading || halachaLoading;

  const renderContent = () => {
    if (!challenge) return null;

    if (challenge.challengeType === 'tehillim' && tehillimText) {
      const text = language === 'hebrew' ? tehillimText.hebrew_text : tehillimText.english_text;
      return (
        <div className="bg-white rounded-2xl p-6 border border-blush/10">
          <h3 className="platypi-bold text-lg text-black text-center mb-4">
            Tehillim {tehillimText.psalm_number}
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

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={closeModal}
      title={challenge?.title || "Community Challenge"}
      showFontControls={true}
      fontSize={fontSize}
      onFontSizeChange={setFontSize}
      showLanguageControls={showLanguageToggle}
      language={language}
      onLanguageChange={setLanguage}
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
              
              <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-feminine rounded-full transition-all duration-500"
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
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium mt-4 border-0 hover:scale-105 transition-transform"
            >
              {isCompleting ? 'Completing...' : 'Completed'}
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

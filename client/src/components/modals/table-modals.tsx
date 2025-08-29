import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getLocalDateString } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { useModalStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Volume2, Maximize2 } from "lucide-react";
import AudioPlayer from "@/components/audio-player";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { formatTextContent } from "@/lib/text-formatter";
import { formatThankYouMessage } from "@/lib/link-formatter";
import { LazyImage } from "@/components/ui/lazy-image";
import { FullscreenModal } from "@/components/ui/fullscreen-modal";

export default function TableModals() {
  const { activeModal, closeModal } = useModalStore();
  const { markModalComplete, isModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenContent, setFullscreenContent] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode;
    contentType?: string;
  }>({ isOpen: false, title: '', content: null });
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleComplete = (modalId: string) => {
    trackModalComplete(modalId);
    markModalComplete(modalId);
    closeModal();
    
    // Navigate to home and scroll to progress to show flower growth
    window.location.hash = '#/?section=home&scrollToProgress=true';
  };
  

  // Function to format time display (convert minutes > 59 to hours and minutes)
  const formatTimeDisplay = (timeString: string) => {
    if (!timeString) return timeString;
    
    // Check if the string contains only numbers (indicating minutes)
    const minutesMatch = timeString.match(/^(\d+)$/);
    if (minutesMatch) {
      const totalMinutes = parseInt(minutesMatch[1]);
      if (totalMinutes > 59) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
      }
      return `${totalMinutes}m`;
    }
    
    // Check if string ends with "min" or "mins" and extract number
    const minMatch = timeString.match(/^(\d+)\s*mins?$/i);
    if (minMatch) {
      const totalMinutes = parseInt(minMatch[1]);
      if (totalMinutes > 59) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
      }
      return `${totalMinutes}m`;
    }
    
    // Return original string if no conversion needed
    return timeString;
  };

  // Auto-redirect table modals to fullscreen
  useEffect(() => {
    const fullscreenTableModals = ['recipe', 'inspiration'];
    
    if (activeModal && fullscreenTableModals.includes(activeModal)) {
      let title = '';
      let contentType = '';
      
      switch (activeModal) {
        case 'recipe':
          title = 'Daily Recipe';
          contentType = 'recipe';
          break;
        case 'inspiration':
          title = 'Creative Jewish Living';
          contentType = 'inspiration';
          break;
      }
      
      // Small delay to ensure content is loaded
      setTimeout(() => {
        setFullscreenContent({
          isOpen: true,
          title,
          contentType,
          content: null // Content will be rendered by fullscreen modal
        });
      }, 50);
    }
  }, [activeModal, setFullscreenContent]);

  // Listen for direct fullscreen opening from buttons
  useEffect(() => {
    const handleDirectFullscreen = (event: CustomEvent) => {
      const { modalKey } = event.detail;
      
      if (['recipe', 'inspiration'].includes(modalKey)) {
        let title = '';
        
        switch (modalKey) {
          case 'recipe':
            title = 'Daily Recipe';
            break;
          case 'inspiration':
            title = 'Creative Jewish Living';
            break;
        }
        
        // Open directly in fullscreen without modal flash
        setFullscreenContent({
          isOpen: true,
          title,
          contentType: modalKey,
          content: null
        });
      }
    };

    window.addEventListener('openDirectFullscreen', handleDirectFullscreen as EventListener);
    
    return () => {
      window.removeEventListener('openDirectFullscreen', handleDirectFullscreen as EventListener);
    };
  }, [setFullscreenContent]);

  const { data: recipeContent } = useQuery<{title?: string; description?: string; ingredients?: string[]; instructions?: string[]; cookingTime?: string; servings?: number; imageUrl?: string; prepTime?: string; cookTime?: string; difficulty?: string; thankYouMessage?: string}>({
    queryKey: ['/api/table/recipe'],
    enabled: activeModal === 'recipe'
  });

  interface InspirationContent {
    id: number;
    date: string;
    title: string;
    content: string;
    mediaType1?: string;
    mediaUrl1?: string;
    mediaType2?: string;
    mediaUrl2?: string;
    mediaType3?: string;
    mediaUrl3?: string;
    mediaType4?: string;
    mediaUrl4?: string;
    mediaType5?: string;
    mediaUrl5?: string;
  }

  const { data: inspirationContent } = useQuery<InspirationContent>({
    queryKey: [`/api/table/inspiration/${getLocalDateString()}`],
    enabled: activeModal === 'inspiration'
  });

  interface ParshaContent {
    id: number;
    week: string;
    title: string;
    content: string;
    duration?: string;
    audioUrl?: string;
  }

  const { data: parshaContent } = useQuery<ParshaContent>({
    queryKey: ['/api/table/vort'],
    enabled: activeModal === 'parsha'
  });

  return (
    <>
      {/* Recipe Modal - Only show if not using fullscreen */}
      <Dialog open={activeModal === 'recipe' && !fullscreenContent.isOpen} onOpenChange={() => closeModal(true)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">
              {recipeContent?.title || "Daily Recipe"}
            </DialogTitle>
          </div>
          
          {recipeContent ? (
            <div className="space-y-4 text-sm text-gray-700">
              {/* Recipe Image */}
              {recipeContent.imageUrl && (
                <div className="w-full rounded-lg overflow-hidden mb-4 bg-gray-50 flex items-center justify-center">
                  <LazyImage 
                    src={recipeContent.imageUrl} 
                    alt={recipeContent.title || "Recipe"} 
                    className="w-full h-80 object-contain"
                    onError={() => {
                      // Image failed to load, could hide the container
                    }}
                  />
                </div>
              )}
              
              {/* Recipe Description */}
              {recipeContent.description && (
                <div>
                  <p dangerouslySetInnerHTML={{ __html: formatTextContent(recipeContent.description) }} />
                </div>
              )}
              
              {/* Cooking Info */}
              {(recipeContent.prepTime || recipeContent.cookTime || recipeContent.servings || recipeContent.difficulty) && (
                <div className="bg-blush/10 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    {recipeContent.prepTime && (
                      <div>
                        <span className="platypi-semibold">Prep Time: </span>
                        <span>{formatTimeDisplay(recipeContent.prepTime)}</span>
                      </div>
                    )}
                    {recipeContent.cookTime && (
                      <div>
                        <span className="platypi-semibold">Cook Time: </span>
                        <span>{formatTimeDisplay(recipeContent.cookTime)}</span>
                      </div>
                    )}
                    {recipeContent.servings && (
                      <div>
                        <span className="platypi-semibold">Servings: </span>
                        <span>{recipeContent.servings}</span>
                      </div>
                    )}
                    {recipeContent.difficulty && (
                      <div>
                        <span className="platypi-semibold">Difficulty: </span>
                        <span>{recipeContent.difficulty}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Ingredients */}
              {recipeContent.ingredients && (
                <div>
                  <h3 className="platypi-semibold mb-2">Ingredients:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {(() => {
                      // Handle ingredients as plain text with bullet points
                      if (typeof recipeContent.ingredients === 'string') {
                        // Split by newlines and filter out empty lines
                        const lines = (recipeContent.ingredients as string)
                          .split('\n')
                          .map((line: string) => line.trim())
                          .filter((line: string) => line && line !== '*');
                        
                        return lines.map((ingredient: string, index: number) => {
                          // Remove leading asterisk or bullet point if present
                          const cleaned = ingredient.replace(/^\*\s*/, '').trim();
                          return cleaned ? (
                            <li key={index} dangerouslySetInnerHTML={{ __html: formatTextContent(cleaned) }} />
                          ) : null;
                        });
                      }
                      
                      // If it's already an array
                      if (Array.isArray(recipeContent.ingredients)) {
                        return recipeContent.ingredients.map((ingredient: any, index: number) => (
                          <li key={index} dangerouslySetInnerHTML={{ __html: formatTextContent(String(ingredient)) }} />
                        ));
                      }
                      
                      return null;
                    })()}
                  </ul>
                </div>
              )}
              
              {/* Instructions */}
              {recipeContent.instructions && (
                <div>
                  <h3 className="platypi-semibold mb-2">Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {(() => {
                      // Handle instructions as plain text with numbered steps
                      if (typeof recipeContent.instructions === 'string') {
                        // Split by numbered steps: look for patterns like "1.", "2.", etc. at start of line or after newline
                        const steps = (recipeContent.instructions as string)
                          .split(/\n?\d+\.\s*/)
                          .map((step: string) => step.trim())
                          .filter((step: string) => step); // Remove empty strings
                        
                        return steps.map((instruction: string, index: number) => {
                          // The instruction is already cleaned (numbers removed by split)
                          return (
                            <li key={index} dangerouslySetInnerHTML={{ __html: formatTextContent(instruction) }} />
                          );
                        });
                      }
                      
                      // If it's already an array
                      if (Array.isArray(recipeContent.instructions)) {
                        return recipeContent.instructions.map((instruction: any, index: number) => (
                          <li key={index} dangerouslySetInnerHTML={{ __html: formatTextContent(String(instruction)) }} />
                        ));
                      }
                      
                      return null;
                    })()}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recipe available</p>
            </div>
          )}

          {/* Dynamic Thank You Message */}
          {recipeContent?.thankYouMessage ? (
            <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-4 border border-blue-200">
              <div 
                className="text-sm platypi-medium text-black"
                dangerouslySetInnerHTML={{ __html: formatThankYouMessage(recipeContent.thankYouMessage) }}
              />
            </div>
          ) : (
            <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-4 border border-blue-200">
              <span className="text-sm platypi-medium text-black">
                Thank you to{' '}
                <a 
                  href="https://www.kosher.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Kosher.com
                </a>
                {' '}for providing this Recipe
              </span>
            </div>
          )}

          <Button 
            onClick={() => handleComplete('recipe')}
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 mt-4"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* Table Inspiration Modal - Only show if not using fullscreen */}
      <Dialog open={activeModal === 'inspiration' && !fullscreenContent.isOpen} onOpenChange={() => closeModal(true)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto" aria-describedby="inspiration-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Creative Jewish Living</DialogTitle>
          </div>
          <div id="inspiration-description" className="sr-only">Creative Jewish living ideas and inspiration</div>
          
          {inspirationContent ? (
            <>
              {/* Media Gallery - Images, Audio, and Video with Navigation */}
              {(() => {
                const mediaItems = [
                  { url: inspirationContent.mediaUrl1, type: inspirationContent.mediaType1 },
                  { url: inspirationContent.mediaUrl2, type: inspirationContent.mediaType2 },
                  { url: inspirationContent.mediaUrl3, type: inspirationContent.mediaType3 },
                  { url: inspirationContent.mediaUrl4, type: inspirationContent.mediaType4 },
                  { url: inspirationContent.mediaUrl5, type: inspirationContent.mediaType5 }
                ].filter(item => item.url && item.type);
                
                if (mediaItems.length === 0) return null;
                
                const nextMedia = () => {
                  setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
                };
                
                const prevMedia = () => {
                  setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
                };

                // Touch handlers for swipe navigation
                const handleTouchStart = (e: React.TouchEvent) => {
                  touchStartX.current = e.targetTouches[0].clientX;
                };

                const handleTouchMove = (e: React.TouchEvent) => {
                  touchEndX.current = e.targetTouches[0].clientX;
                };

                const handleTouchEnd = () => {
                  if (!touchStartX.current || !touchEndX.current) return;
                  
                  const distance = touchStartX.current - touchEndX.current;
                  const isLeftSwipe = distance > 50;
                  const isRightSwipe = distance < -50;

                  if (isLeftSwipe && mediaItems.length > 1) {
                    nextMedia();
                  }
                  if (isRightSwipe && mediaItems.length > 1) {
                    prevMedia();
                  }
                  
                  touchStartX.current = null;
                  touchEndX.current = null;
                };
                
                const currentMedia = mediaItems[currentMediaIndex];
                
                const renderMedia = () => {
                  if (!currentMedia) return null;
                  
                  switch (currentMedia.type) {
                    case 'image':
                      return (
                        <div className="relative w-full h-full bg-gray-50 flex items-center justify-center">
                          <img 
                            src={currentMedia.url} 
                            alt={`Creative Jewish Living ${currentMediaIndex + 1}`}
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={() => setFullscreenImage(currentMedia.url || null)}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition-colors"
                            title="View fullscreen"
                          >
                            <Maximize2 size={16} />
                          </button>
                        </div>
                      );
                    case 'audio':
                      return (
                        <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-50 flex flex-col items-center justify-center">
                          <Volume2 size={48} className="text-rose-400 mb-4" />
                          <div className="w-full px-4">
                            <AudioPlayer 
                              audioUrl={currentMedia.url || ''} 
                              title="Creative Jewish Living Audio"
                              duration="0:00"
                            />
                          </div>
                        </div>
                      );
                    case 'video':
                      const VideoPlayer = () => {
                        const [videoError, setVideoError] = useState(false);
                        const [isLoading, setIsLoading] = useState(true);
                        
                        const handleVideoError = () => {
                          // Video failed to load
                          setVideoError(true);
                          setIsLoading(false);
                        };
                        
                        const handleCanPlay = () => {
                          // Video can play
                          setIsLoading(false);
                        };
                        
                        const getVideoType = (url: string) => {
                          if (url.includes('.mp4')) return 'video/mp4';
                          if (url.includes('.mov')) return 'video/quicktime';
                          if (url.includes('.webm')) return 'video/webm';
                          return 'video/mp4'; // default
                        };
                        
                        // Optimize video URLs for faster loading
                        const getOptimizedVideoUrl = (url: string) => {
                          if (!url) return '';
                          
                          // For Supabase URLs, add quality and format parameters for faster loading
                          if (url.includes('supabase')) {
                            const baseUrl = url.split('?')[0];
                            return `${baseUrl}?quality=auto&format=mp4`;
                          }
                          
                          // For .mov files, use proxy
                          if (url.includes('.mov')) {
                            return `/api/media-proxy/cloudinary/${url.split('/').slice(4).join('/')}`;
                          }
                          
                          return url;
                        };

                        const videoUrl = getOptimizedVideoUrl(currentMedia.url || '');
                        
                        return (
                          <div className="w-full h-full relative">
                            {isLoading && !videoError && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="animate-spin w-8 h-8 border-4 border-blush border-t-transparent rounded-full"></div>
                              </div>
                            )}
                            
                            {videoError ? (
                              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                                <div className="text-gray-500 text-center">
                                  <p className="mb-2">Video unavailable</p>
                                  <button 
                                    onClick={() => currentMedia.url && window.open(currentMedia.url, '_blank')}
                                    className="text-blush underline text-sm"
                                  >
                                    Open in new tab
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <video 
                                src={videoUrl}
                                controls
                                className="w-full h-full object-contain bg-gray-50"
                                preload="none"
                                poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Cpolygon points='40,30 70,50 40,70' fill='%23d1d5db'/%3E%3C/svg%3E"
                                onError={handleVideoError}
                                onLoadedData={handleCanPlay}
                                onLoadStart={() => setIsLoading(true)}
                                playsInline
                                muted
                              >
                                <source src={videoUrl} type={getVideoType(videoUrl)} />
                                Your browser does not support the video tag.
                              </video>
                            )}
                          </div>
                        );
                      };
                      
                      return <VideoPlayer />;
                    default:
                      return null;
                  }
                };
                
                return (
                  <div className="mb-4 relative">
                    <div 
                      className="w-full h-80 bg-gray-100 rounded-lg overflow-hidden relative touch-pan-y"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {renderMedia()}
                      
                      {mediaItems.length > 1 && (
                        <>
                          <button
                            onClick={prevMedia}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 transition-transform hover:scale-110"
                            style={{
                              filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8)) drop-shadow(0 0 1px rgba(255,255,255,1))',
                              color: '#000',
                              fontWeight: 'bold'
                            }}
                          >
                            <ChevronLeft size={24} strokeWidth={3} />
                          </button>
                          <button
                            onClick={nextMedia}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 transition-transform hover:scale-110"
                            style={{
                              filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8)) drop-shadow(0 0 1px rgba(255,255,255,1))',
                              color: '#000',
                              fontWeight: 'bold'
                            }}
                          >
                            <ChevronRight size={24} strokeWidth={3} />
                          </button>
                          
                          {/* Media counter dots with type indicators */}
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                            {mediaItems.map((item, index) => (
                              <div
                                key={index}
                                className={`w-2 h-2 rounded-full ${
                                  index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                                title={`${item.type} ${index + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Title from Database */}
              <div className="mb-3">
                <h3 className="text-lg platypi-semibold text-gray-800">{inspirationContent.title}</h3>
              </div>
              
              {/* Content Text */}
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <p dangerouslySetInnerHTML={{ __html: formatTextContent(inspirationContent.content) }} />
                </div>
              </div>

              {/* Thank You Attribution - Moved BEFORE Done button */}
              <div className="bg-blue-50 p-3 rounded-xl mt-4 text-center">
                <p className="text-sm text-blue-800">
                  Thank you to{' '}
                  <a 
                    href="https://www.instagram.com/yidwithakid/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline platypi-medium"
                  >
                    YidWithAKid
                  </a>
                  {' '}for providing this.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-full h-48 bg-gradient-to-br from-pink-50 to-orange-50 rounded-xl flex items-center justify-center border border-gray-200 mb-4">
                <div className="text-center text-gray-600">
                  <svg className="mx-auto mb-2 w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm">No inspiration content available</p>
                  <p className="text-xs">Please add content to the database</p>
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={() => handleComplete('inspiration')}
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 mt-4"
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Parsha Shiur Modal */}
      <Dialog open={activeModal === 'parsha'} onOpenChange={() => closeModal(true)}>
        <DialogContent>
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Parsha Shiur</DialogTitle>
          </div>
          <p className="text-sm text-gray-600 mb-4 text-center">
            {parshaContent?.title || "This Week's Torah Portion"}
          </p>
          
          <AudioPlayer 
            title={parshaContent?.title || "Parsha Shiur"}
            duration={parshaContent?.duration || "0:00"}
            audioUrl={parshaContent?.audioUrl || ""}
          />

          <Button 
            onClick={() => handleComplete('parsha')}
            className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 mt-4"
          >
            Completed Parsha
          </Button>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Modal */}
      <FullscreenModal
        isOpen={fullscreenContent.isOpen}
        onClose={() => {
          setFullscreenContent({ isOpen: false, title: '', content: null });
          // Also close any open fullscreen image
          setFullscreenImage(null);
          // Close the underlying modal as well
          closeModal();
          // Navigate back to the Life page (table section)
          window.dispatchEvent(new CustomEvent('navigateToSection', { 
            detail: { section: 'table' } 
          }));
        }}
        title={fullscreenContent.title}
        showFontControls={false}
        showLanguageControls={false}
      >
        {fullscreenContent.contentType === 'recipe' ? (
          recipeContent && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-blush/10">
                {recipeContent.title && (
                  <h3 className="platypi-bold text-lg text-black text-center mb-4">
                    {recipeContent.title}
                  </h3>
                )}
                
                {/* Recipe Image */}
                {recipeContent.imageUrl && (
                  <div className="w-full rounded-lg overflow-hidden mb-4 bg-gray-50 flex items-center justify-center">
                    <LazyImage 
                      src={recipeContent.imageUrl} 
                      alt={recipeContent.title || "Recipe"} 
                      className="w-full h-80 object-contain"
                    />
                  </div>
                )}
                
                {/* Recipe Description */}
                {recipeContent.description && (
                  <div className="mb-4">
                    <p className="platypi-regular leading-relaxed text-black whitespace-pre-line" dangerouslySetInnerHTML={{ __html: formatTextContent(recipeContent.description) }} />
                  </div>
                )}
                
                {/* Cooking Info */}
                {(recipeContent.prepTime || recipeContent.cookTime || recipeContent.servings || recipeContent.difficulty) && (
                  <div className="bg-blush/10 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {recipeContent.prepTime && (
                        <div>
                          <span className="platypi-semibold text-black">Prep Time: </span>
                          <span className="platypi-regular text-black">{formatTimeDisplay(recipeContent.prepTime)}</span>
                        </div>
                      )}
                      {recipeContent.cookTime && (
                        <div>
                          <span className="platypi-semibold text-black">Cook Time: </span>
                          <span className="platypi-regular text-black">{formatTimeDisplay(recipeContent.cookTime)}</span>
                        </div>
                      )}
                      {recipeContent.servings && (
                        <div>
                          <span className="platypi-semibold text-black">Servings: </span>
                          <span className="platypi-regular text-black">{recipeContent.servings}</span>
                        </div>
                      )}
                      {recipeContent.difficulty && (
                        <div>
                          <span className="platypi-semibold text-black">Difficulty: </span>
                          <span className="platypi-regular text-black">{recipeContent.difficulty}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Ingredients */}
                {recipeContent.ingredients && (
                  <div className="mb-6">
                    <h4 className="platypi-bold text-black text-base mb-3">Ingredients</h4>
                    <ul className="space-y-2">
                      {(() => {
                        // Handle ingredients as plain text with bullet points
                        if (typeof recipeContent.ingredients === 'string') {
                          // Split by newlines and filter out empty lines
                          const lines = (recipeContent.ingredients as string)
                            .split('\n')
                            .map((line: string) => line.trim())
                            .filter((line: string) => line && line !== '*');
                          
                          return lines.map((ingredient: string, index: number) => {
                            // Remove leading asterisk or bullet point if present
                            const cleaned = ingredient.replace(/^\*\s*/, '').trim();
                            return cleaned ? (
                              <li key={index} className="flex items-start">
                                <span className="text-rose-400 mr-2 mt-1.5">•</span>
                                <span className="platypi-regular text-black text-sm flex-1" dangerouslySetInnerHTML={{ __html: formatTextContent(cleaned) }} />
                              </li>
                            ) : null;
                          });
                        }
                        
                        // If it's already an array
                        if (Array.isArray(recipeContent.ingredients)) {
                          return recipeContent.ingredients.map((ingredient: any, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-rose-400 mr-2 mt-1.5">•</span>
                              <span className="platypi-regular text-black text-sm flex-1" dangerouslySetInnerHTML={{ __html: formatTextContent(String(ingredient)) }} />
                            </li>
                          ));
                        }
                        
                        return null;
                      })()}
                    </ul>
                  </div>
                )}
                
                {/* Instructions */}
                {recipeContent.instructions && (
                  <div className="mb-6">
                    <h4 className="platypi-bold text-black text-base mb-3">Instructions</h4>
                    <ol className="space-y-3">
                      {(() => {
                        // Handle instructions as plain text with numbered steps
                        if (typeof recipeContent.instructions === 'string') {
                          // Split by numbered steps: look for patterns like "1.", "2.", etc. at start of line or after newline
                          const steps = (recipeContent.instructions as string)
                            .split(/\n?\d+\.\s*/)
                            .map((step: string) => step.trim())
                            .filter((step: string) => step); // Remove empty strings
                          
                          return steps.map((instruction: string, index: number) => {
                            // The instruction is already cleaned (numbers removed by split)
                            return (
                              <li key={index} className="flex items-start">
                                <span className="platypi-bold text-rose-400 mr-3 mt-0.5 min-w-[1.5rem]">{index + 1}.</span>
                                <span className="platypi-regular text-black text-sm flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatTextContent(instruction) }} />
                              </li>
                            );
                          });
                        }
                        
                        // If it's already an array
                        if (Array.isArray(recipeContent.instructions)) {
                          return recipeContent.instructions.map((instruction: any, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="platypi-bold text-rose-400 mr-3 mt-0.5 min-w-[1.5rem]">{index + 1}.</span>
                              <span className="platypi-regular text-black text-sm flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatTextContent(String(instruction)) }} />
                            </li>
                          ));
                        }
                        
                        return null;
                      })()}
                    </ol>
                  </div>
                )}
              </div>
              
              {/* Thank You Section for Recipe */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-900 platypi-medium">
                  {recipeContent.thankYouMessage ? (
                    <span dangerouslySetInnerHTML={{ __html: formatThankYouMessage(recipeContent.thankYouMessage) }} />
                  ) : (
                    <>
                      Recipe provided with permission by{' '}
                      <a 
                        href="https://kosher.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        Kosher.com
                      </a>
                      . Visit Kosher.com for thousands more delicious kosher recipes!
                    </>
                  )}
                </p>
              </div>
              
              <div className="heart-explosion-container">
                <Button 
                  onClick={isModalComplete('recipe') ? undefined : () => {
                    handleComplete('recipe');
                    setFullscreenContent({ isOpen: false, title: '', content: null });
                    // Also close any open fullscreen image
                    setFullscreenImage(null);
                  }}
                  disabled={isModalComplete('recipe')}
                  className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                    isModalComplete('recipe') 
                      ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                      : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
                  }`}
                >
                  {isModalComplete('recipe') ? 'Completed Today' : 'Done'}
                </Button>
              </div>
            </div>
          )
        ) : fullscreenContent.contentType === 'inspiration' ? (
          inspirationContent && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-blush/10">
                {inspirationContent.title && (
                  <h3 className="platypi-bold text-lg text-black text-center mb-4">
                    {inspirationContent.title}
                  </h3>
                )}
                
                {/* Media Gallery - Moved to top */}
                {(() => {
                  const mediaItems = [
                    { url: inspirationContent.mediaUrl1, type: inspirationContent.mediaType1 },
                    { url: inspirationContent.mediaUrl2, type: inspirationContent.mediaType2 },
                    { url: inspirationContent.mediaUrl3, type: inspirationContent.mediaType3 },
                    { url: inspirationContent.mediaUrl4, type: inspirationContent.mediaType4 },
                    { url: inspirationContent.mediaUrl5, type: inspirationContent.mediaType5 }
                  ].filter(item => item.url && item.type);
                  
                  if (mediaItems.length > 0) {
                    return (
                      <div className="mb-6">
                        <div 
                          className="relative bg-gray-100 rounded-lg overflow-hidden touch-pan-y"
                          onTouchStart={(e) => {
                            touchStartX.current = e.targetTouches[0].clientX;
                          }}
                          onTouchMove={(e) => {
                            touchEndX.current = e.targetTouches[0].clientX;
                          }}
                          onTouchEnd={(e) => {
                            if (!touchStartX.current || !touchEndX.current) return;
                            
                            const distance = touchStartX.current - touchEndX.current;
                            const isLeftSwipe = distance > 50;
                            const isRightSwipe = distance < -50;
          
                            if (isLeftSwipe && mediaItems.length > 1) {
                              e.preventDefault();
                              e.stopPropagation();
                              setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
                            }
                            if (isRightSwipe && mediaItems.length > 1) {
                              e.preventDefault();
                              e.stopPropagation();
                              setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
                            }
                            
                            // Reset values
                            touchStartX.current = null;
                            touchEndX.current = null;
                          }}
                        >
                          {mediaItems[currentMediaIndex]?.type === 'image' ? (
                            <div
                              className="cursor-pointer bg-gray-50 flex items-center justify-center w-full h-80"
                              onClick={() => setFullscreenImage(mediaItems[currentMediaIndex].url!)}
                            >
                              <LazyImage
                                src={mediaItems[currentMediaIndex].url!}
                                alt="Inspiration content"
                                className="w-full h-80 object-contain"
                              />
                            </div>
                          ) : mediaItems[currentMediaIndex]?.type === 'video' ? (
                            <video 
                              controls 
                              className="w-full h-80 object-contain bg-gray-50"
                              src={mediaItems[currentMediaIndex].url}
                            />
                          ) : null}
                          
                          {mediaItems.length > 1 && (
                            <>
                              <button
                                onClick={() => setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length)}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 transition-transform hover:scale-110"
                                style={{
                                  filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8)) drop-shadow(0 0 1px rgba(255,255,255,1))',
                                  color: '#000',
                                  fontWeight: 'bold'
                                }}
                              >
                                <ChevronLeft size={24} strokeWidth={3} />
                              </button>
                              <button
                                onClick={() => setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 transition-transform hover:scale-110"
                                style={{
                                  filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.8)) drop-shadow(0 0 1px rgba(255,255,255,1))',
                                  color: '#000',
                                  fontWeight: 'bold'
                                }}
                              >
                                <ChevronRight size={24} strokeWidth={3} />
                              </button>
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                {mediaItems.map((_, index) => (
                                  <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full ${
                                      index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                                    }`}
                                    title={`Media ${index + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {inspirationContent.content && (
                  <div 
                    className="platypi-regular leading-relaxed text-black whitespace-pre-line mb-4"
                    dangerouslySetInnerHTML={{ __html: formatTextContent(inspirationContent.content) }}
                  />
                )}
              </div>
              
              {/* Thank You Section for Creative Jewish Living */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm text-blue-900 platypi-medium">
                  Thank you to{' '}
                  <a 
                    href="https://www.instagram.com/yidwithakid/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    YidWithAKid
                  </a>
                  {' '}for providing this Table inspiration
                </p>
              </div>
              
              <div className="heart-explosion-container">
                <Button 
                  onClick={isModalComplete('inspiration') ? undefined : () => {
                    handleComplete('inspiration');
                    setFullscreenContent({ isOpen: false, title: '', content: null });
                    // Also close any open fullscreen image
                    setFullscreenImage(null);
                  }}
                  disabled={isModalComplete('inspiration')}
                  className={`w-full py-3 rounded-xl platypi-medium mt-4 border-0 ${
                    isModalComplete('inspiration') 
                      ? 'bg-sage text-white cursor-not-allowed opacity-70' 
                      : 'bg-gradient-feminine text-white hover:scale-105 transition-transform'
                  }`}
                >
                  {isModalComplete('inspiration') ? 'Completed Today' : 'Done'}
                </Button>
              </div>
            </div>
          )
        ) : (
          fullscreenContent.content
        )}
      </FullscreenModal>
    </>
  );
}
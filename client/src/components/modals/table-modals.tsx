import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore, useModalCompletionStore } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, Volume2 } from "lucide-react";
import AudioPlayer from "@/components/audio-player";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import { formatTextContent } from "@/lib/text-formatter";

export default function TableModals() {
  const { activeModal, closeModal } = useModalStore();
  const { markModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const handleComplete = (modalId: string) => {
    trackModalComplete(modalId);
    markModalComplete(modalId);
    closeModal();
    
    // Navigate to home and scroll to progress to show flower growth
    window.location.hash = '#/?section=home&scrollToProgress=true';
  };
  
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const { data: recipeContent } = useQuery<{title?: string; description?: string; ingredients?: string[]; instructions?: string[]; cookingTime?: string; servings?: number}>({
    queryKey: ['/api/table/recipe'],
    enabled: activeModal === 'recipe'
  });

  const { data: inspirationContent } = useQuery<Record<string, any>>({
    queryKey: [`/api/table/inspiration/${new Date().toISOString().split('T')[0]}`],
    enabled: activeModal === 'inspiration'
  });

  const { data: parshaContent } = useQuery<Record<string, any>>({
    queryKey: ['/api/table/vort'],
    enabled: activeModal === 'parsha'
  });

  return (
    <>
      {/* Recipe Modal */}
      <Dialog open={activeModal === 'recipe'} onOpenChange={() => closeModal(true)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">
              {recipeContent?.title || "Daily Recipe"}
            </DialogTitle>
          </div>
          
          {recipeContent ? (
            <div className="space-y-4 text-sm text-gray-700">
              {/* Recipe Description */}
              {recipeContent.description && (
                <div>
                  <p dangerouslySetInnerHTML={{ __html: formatTextContent(recipeContent.description) }} />
                </div>
              )}
              
              {/* Cooking Info */}
              {(recipeContent.cookingTime || recipeContent.servings) && (
                <div className="bg-blush/10 p-3 rounded-lg">
                  <div className="flex gap-4">
                    {recipeContent.cookingTime && (
                      <div>
                        <span className="platypi-semibold">Cooking Time: </span>
                        <span>{recipeContent.cookingTime}</span>
                      </div>
                    )}
                    {recipeContent.servings && (
                      <div>
                        <span className="platypi-semibold">Servings: </span>
                        <span>{recipeContent.servings}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Ingredients */}
              {recipeContent.ingredients && recipeContent.ingredients.length > 0 && (
                <div>
                  <h3 className="platypi-semibold mb-2">Ingredients:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {recipeContent.ingredients.map((ingredient, index) => (
                      <li key={index} dangerouslySetInnerHTML={{ __html: formatTextContent(ingredient) }} />
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Instructions */}
              {recipeContent.instructions && recipeContent.instructions.length > 0 && (
                <div>
                  <h3 className="platypi-semibold mb-2">Instructions:</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    {recipeContent.instructions.map((instruction, index) => (
                      <li key={index} dangerouslySetInnerHTML={{ __html: formatTextContent(instruction) }} />
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recipe available</p>
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

      {/* Table Inspiration Modal */}
      <Dialog open={activeModal === 'inspiration'} onOpenChange={() => closeModal(true)}>
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
                
                const currentMedia = mediaItems[currentMediaIndex];
                
                const renderMedia = () => {
                  if (!currentMedia) return null;
                  
                  switch (currentMedia.type) {
                    case 'image':
                      return (
                        <img 
                          src={currentMedia.url} 
                          alt={`Creative Jewish Living ${currentMediaIndex + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={nextMedia}
                        />
                      );
                    case 'audio':
                      return (
                        <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-50 flex flex-col items-center justify-center">
                          <Volume2 size={48} className="text-rose-400 mb-4" />
                          <div className="w-full px-4">
                            <AudioPlayer 
                              audioUrl={currentMedia.url} 
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
                        
                        const handleVideoError = (e: any) => {
                          console.error('Video failed to load:', currentMedia.url, e);
                          setVideoError(true);
                          setIsLoading(false);
                        };
                        
                        const handleCanPlay = () => {
                          console.log('Video can play:', currentMedia.url);
                          setIsLoading(false);
                        };
                        
                        const getVideoType = (url: string) => {
                          if (url.includes('.mp4')) return 'video/mp4';
                          if (url.includes('.mov')) return 'video/quicktime';
                          if (url.includes('.webm')) return 'video/webm';
                          return 'video/mp4'; // default
                        };
                        
                        // Try direct URL first, fallback to proxy for .mov files
                        const videoUrl = currentMedia.url.includes('.mov') ? 
                          `/api/media-proxy/cloudinary/${currentMedia.url.split('/').slice(4).join('/')}` : 
                          currentMedia.url;
                        
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
                                    onClick={() => window.open(currentMedia.url, '_blank')}
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
                                className="w-full h-full object-cover"
                                preload="metadata"
                                onError={handleVideoError}
                                onLoadStart={() => console.log('Video loading:', videoUrl)}
                                onCanPlay={handleCanPlay}
                                crossOrigin="anonymous"
                                playsInline
                              >
                                <source src={currentMedia.url} type={getVideoType(currentMedia.url)} />
                                {currentMedia.url.includes('.mov') && (
                                  <source src={videoUrl} type="video/mp4" />
                                )}
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
                    <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden relative">
                      {renderMedia()}
                      
                      {mediaItems.length > 1 && (
                        <>
                          <button
                            onClick={prevMedia}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={nextMedia}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                          >
                            <ChevronRight size={20} />
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
          
          {/* Thank You Attribution */}
          <div className="bg-blue-50 p-3 rounded-xl mt-1 text-center">
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
        </DialogContent>
      </Dialog>

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
    </>
  );
}
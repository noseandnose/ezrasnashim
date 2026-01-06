import { useState } from "react";
import { Utensils, Flame, Star, Heart, MapPin, Brain, ChevronDown, ChevronUp, ChevronRight, Home, Check } from "lucide-react";
import customCandleIcon from "@assets/Untitled design (6)_1755630328619.png";
import DiscountBar from "@/components/discount-bar";
import { useModalStore, useModalCompletionStore } from "@/lib/types";
import { useTrackModalComplete, useTrackFeatureUsage } from "@/hooks/use-analytics";

// TEMPORARY: Section background images
import sectionMorningBg from "@assets/Morning_Background_1767032607494.png";
import sectionAfternoonBg from "@assets/Afternoon_Background_1767032607493.png";
import sectionNightBg from "@assets/background_night_1767034895431.png";
import { useShabbosTime } from "@/hooks/use-shabbos-times";
import { useGeolocation, useJewishTimes } from "@/hooks/use-jewish-times";
import { useTableSummary } from "@/hooks/use-table-summary";
import DOMPurify from "dompurify";


export default function TableSection() {
  const { openModal } = useModalStore();
  const { isModalComplete, markModalComplete } = useModalCompletionStore();
  const { trackModalComplete } = useTrackModalComplete();
  const { trackFeatureUsage } = useTrackFeatureUsage();
  const { data: shabbosData, isLoading: shabbosLoading } = useShabbosTime();

  // Get shared location state and trigger geolocation if needed
  const { coordinates, permissionDenied } = useGeolocation();
  
  // Get Jewish times (includes shkia)
  const { data: jewishTimes } = useJewishTimes();
  
  // TEMPORARY: Check if current time is after tzais hakochavim (nightfall)
  const isAfterTzais = () => {
    const tzaisStr = jewishTimes?.tzaitHakochavim;
    if (!tzaisStr) return new Date().getHours() >= 18; // Fallback to 6 PM
    const now = new Date();
    const match = tzaisStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return now.getHours() >= 18;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3]?.toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;
    else if (!period && hours < 12) hours += 12; // 24-hour format fallback
    const tzaisTime = new Date(now);
    tzaisTime.setHours(hours, minutes, 0, 0);
    return now >= tzaisTime;
  };

  // TEMPORARY: Get time-appropriate background for main section
  const getSectionBackground = () => {
    const hour = new Date().getHours();
    if (hour < 12) return sectionMorningBg;
    if (isAfterTzais()) return sectionNightBg;
    return sectionAfternoonBg;
  };
  
  // Show location prompt if permission denied and no coordinates
  const showLocationPrompt = permissionDenied && !coordinates;
  
  // Determine loading states - match the behavior from Times section
  const isShabbosDataLoading = shabbosLoading && !!coordinates;
  const showShabbosError = !coordinates && permissionDenied;
  
  // Gift of Chatzos state
  const [giftExpanded, setGiftExpanded] = useState(false);
  
  // Fetch all Table content in a single batched request (5 API calls → 1)
  const { data: tableSummary } = useTableSummary();
  
  // Extract data from the batched response
  const giftOfChatzos = tableSummary?.giftOfChatzos;
  const lifeClasses = tableSummary?.lifeClasses || [];
  const inspirationContent = tableSummary?.inspiration;
  const recipeContent = tableSummary?.recipe;

  // Check if Gift of Chatzos has content
  const hasGiftContent = giftOfChatzos && giftOfChatzos.contentEnglish;

  // Get the first available Life class for display
  const currentLifeClass = lifeClasses?.[0];

  const formatGiftMarkdown = (text: string | null | undefined): string => {
    if (!text) return '';
    const withBold = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withLinks = withBold.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #E91E63; text-decoration: underline;">$1</a>');
    const withLineBreaks = withLinks.replace(/\n/g, '<br>');
    return DOMPurify.sanitize(withLineBreaks, {
      ALLOWED_TAGS: ['strong', 'b', 'br', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'style']
    });
  };

  // Calculate days until Shabbat using Jewish day (tzait to tzait)
  const getDaysUntilShabbat = (tzaitTime?: string) => {
    const now = new Date();
    let currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // If we have tzait time and it's after tzait, advance to next day
    if (tzaitTime) {
      try {
        const [time, period] = tzaitTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format
        let tzaitHours = hours;
        if (period === 'PM' && hours !== 12) tzaitHours += 12;
        if (period === 'AM' && hours === 12) tzaitHours = 0;
        
        // Create tzait date for today
        const tzaitDate = new Date(now);
        tzaitDate.setHours(tzaitHours, minutes, 0, 0);
        
        // If current time is after tzait, advance to next Jewish day
        if (now > tzaitDate) {
          currentDay = (currentDay + 1) % 7;
        }
      } catch (error) {
        // If parsing fails, fall back to regular day calculation
      }
    }
    
    if (currentDay === 6) return 7; // Saturday: 7 days until next Shabbat
    return 6 - currentDay; // Days remaining until Saturday
  };

  const daysUntilShabbat = getDaysUntilShabbat(jewishTimes?.tzaitHakochavim);



  return (
    <div className="pb-20 relative overflow-hidden min-h-screen" data-bridge-container>
      {/* TEMPORARY: Full page background image */}
      <img 
        src={getSectionBackground()} 
        alt="" 
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0, opacity: 0.3 }}
      />
      
      {/* Main Table Section */}
      <div 
        className="rounded-b-3xl p-3 relative"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          zIndex: 2
        }}
      >
        {/* Location Permission Prompt */}
        {showLocationPrompt && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="text-yellow-600" size={16} />
              <h4 className="platypi-bold text-sm platypi-bold text-yellow-800">Location Required</h4>
            </div>
            <p className="platypi-regular text-xs text-yellow-700 mb-3">
              Please enable location access for accurate davening times, or click below to set your location manually.
            </p>
            <button 
              onClick={() => openModal('location', 'table')}
              className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs platypi-medium hover:bg-yellow-700 transition-colors"
              data-modal-type="location"
              data-modal-section="table"
              data-testid="button-table-location"
            >
              Set Location Manually
            </button>
          </div>
        )}
        
        {/* Shabbos Times Section */}
        <div className="bg-white/85 rounded-2xl p-3 border border-blush/10"
             style={{
               animation: 'gentle-glow-pink 3s ease-in-out infinite'
             }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-feminine rounded-full">
                <span className="text-white platypi-bold text-lg">
                  {daysUntilShabbat}
                </span>
              </div>
              <h3 className="platypi-bold text-lg text-black">
                Days Until Shabbos {shabbosData?.parsha ? (
                  <span className="text-lavender"> {shabbosData.parsha.replace("Parashat ", "").replace("Parashah ", "")}</span>
                ) : ""}
              </h3>
            </div>
          </div>
          
          {/* Location Display */}

          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/85 rounded-xl p-2 text-center border border-blush/10">
              <p className="platypi-regular text-xs text-black/70 platypi-bold">Candle Lighting</p>
              <div className="flex items-center justify-center space-x-1">
                <img 
                  src={customCandleIcon} 
                  alt="Candle lighting" 
                  className="w-5 h-4 object-contain"
                  loading="lazy"
                />
                <p className="platypi-bold text-base text-black platypi-medium">
                  {showShabbosError ? "--:--" : 
                   shabbosData?.candleLighting || 
                   (isShabbosDataLoading ? "Loading..." : "--:--")}
                </p>
              </div>
            </div>
            <div className="bg-white/85 rounded-xl p-2 text-center border border-blush/10">
              <p className="platypi-regular text-xs text-black/70 platypi-bold">Havdalah</p>
              <div className="flex items-center justify-center space-x-1">
                <Flame className="text-lavender" size={14} />
                <p className="platypi-bold text-base text-black platypi-medium">
                  {showShabbosError ? "--:--" : 
                   shabbosData?.havdalah || 
                   (isShabbosDataLoading ? "Loading..." : "--:--")}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Gift of Chatzos Expandable Bar - Only shown when content exists */}
        {hasGiftContent && giftOfChatzos && (
          <div 
            className="bg-white/85 rounded-xl mt-2 overflow-hidden border border-blush/20"
          >
            {/* Collapsed/Header Bar */}
            <button
              onClick={() => setGiftExpanded(!giftExpanded)}
              className="w-full p-3 text-left hover:bg-white/90 transition-colors"
              data-testid="button-gift-of-chatzos-toggle"
            >
              <div className="flex items-center gap-3">
                {/* Static thumbnail image for collapsed state */}
                <img 
                  src="https://static.wixstatic.com/media/3b5ba3_483913622d834e2593a165e13fe65ab1~mv2.png/v1/fill/w_102,h_102,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Group%2017%20(1).png" 
                  alt={giftOfChatzos.title || "The Gift of Chatzos"} 
                  className="w-10 h-10 min-w-10 flex-shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
                
                {/* Title and Subtitle */}
                <div className="flex-grow">
                  <h3 className="platypi-bold text-sm text-black">{giftOfChatzos.title || "The Gift of Chatzos"}</h3>
                  {giftOfChatzos.subtitle && (
                    <p className="platypi-regular text-xs text-black/70">{giftOfChatzos.subtitle}</p>
                  )}
                </div>
                
                {/* Expand/Collapse Icon */}
                <div className="p-1 rounded-full bg-blush/20">
                  {giftExpanded ? (
                    <ChevronUp className="text-lavender" size={16} />
                  ) : (
                    <ChevronDown className="text-lavender" size={16} />
                  )}
                </div>
              </div>
            </button>
            
            {/* Expanded Content */}
            {giftExpanded && (
              <div className="px-3 pb-3">
                {/* Image above content */}
                {giftOfChatzos.imageUrl && (
                  <img 
                    src={giftOfChatzos.imageUrl} 
                    alt={giftOfChatzos.title || "The Gift of Chatzos"} 
                    className="w-full rounded-xl object-cover mb-3"
                    loading="lazy"
                  />
                )}
                
                {/* Content */}
                <div 
                  className="platypi-regular text-black/80 leading-relaxed text-left"
                  style={{ fontSize: '16px' }}
                  dangerouslySetInnerHTML={{ 
                    __html: formatGiftMarkdown(giftOfChatzos.contentEnglish) 
                  }}
                />
                
                {/* Thank You Message - linked to URL */}
                {giftOfChatzos.thankYouMessage && (
                  <div className="mt-4 pt-3 border-t border-blush/20">
                    {giftOfChatzos.url ? (
                      <a
                        href={giftOfChatzos.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="platypi-medium text-sm text-lavender hover:text-lavender/80 transition-colors underline"
                        data-testid="link-gift-thank-you"
                      >
                        {giftOfChatzos.thankYouMessage}
                      </a>
                    ) : (
                      <p className="platypi-medium text-sm text-lavender">
                        {giftOfChatzos.thankYouMessage}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Floating Link Button - Bottom Right */}
                {giftOfChatzos.url && giftOfChatzos.linkTitle && (
                  <a
                    href={giftOfChatzos.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-feminine text-white rounded-full px-3 py-1.5 mt-3 shadow-lg hover:scale-105 transition-all duration-200 platypi-medium text-xs inline-flex items-center justify-center"
                    data-testid="link-gift-of-chatzos"
                  >
                    {giftOfChatzos.linkTitle}
                  </a>
                )}
                
                {/* Complete Button */}
                <div className="mt-4 pt-3 border-t border-blush/20">
                  <button
                    onClick={() => {
                      if (!isModalComplete('gift-of-chatzos')) {
                        markModalComplete('gift-of-chatzos');
                        trackModalComplete('gift-of-chatzos');
                        trackFeatureUsage('gift-of-chatzos');
                      }
                    }}
                    disabled={isModalComplete('gift-of-chatzos')}
                    className={`w-full py-2.5 rounded-full platypi-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
                      isModalComplete('gift-of-chatzos')
                        ? 'bg-sage text-white cursor-default'
                        : 'bg-gradient-feminine text-white hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                    data-testid="button-gift-of-chatzos-complete"
                  >
                    {isModalComplete('gift-of-chatzos') ? (
                      <>
                        <Check size={16} />
                        Completed Today
                      </>
                    ) : (
                      'Complete'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Shabbos Content Grid - Separate Section */}
      <div className="py-2 space-y-1">
        {/* Top Row: Daily Recipe and Marriage Insights - Apple Glass Style */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Daily Recipe Button */}
          <button
            className={`w-full h-full rounded-xl p-4 text-center transition-all duration-300 relative ${
              !recipeContent ? 'cursor-not-allowed' : 'hover:scale-105'
            }`}
            style={{
              background: !recipeContent ? 'rgba(200, 200, 200, 0.5)' : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
            onClick={() => {
              if (recipeContent) {
                const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
                  detail: {
                    modalKey: 'recipe',
                    content: recipeContent
                  }
                });
                window.dispatchEvent(fullscreenEvent);
              }
            }}
            disabled={!recipeContent}
          >
            {!recipeContent && (
              <div className="absolute inset-0 bg-black/10 rounded-xl flex items-center justify-center z-10">
                <div className="bg-white/90 px-2 py-1 rounded-lg">
                  <p className="platypi-medium text-xs text-black">Coming soon</p>
                </div>
              </div>
            )}
            
            <div 
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full mb-1.5"
              style={{
                background: !recipeContent
                  ? 'rgba(150, 150, 150, 0.35)'
                  : isModalComplete('recipe')
                    ? 'rgba(139, 169, 131, 0.35)'
                    : 'linear-gradient(135deg, rgba(232, 180, 188, 0.35) 0%, rgba(200, 162, 200, 0.35) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }}
            >
              {isModalComplete('recipe') ? (
                <svg className="text-black" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <Utensils className={!recipeContent ? 'text-gray-500' : 'text-black'} size={12} />
              )}
              <p className={`platypi-bold text-xs ${!recipeContent ? 'text-gray-500' : 'text-black'}`}>Daily Recipe</p>
            </div>
            <p className={`platypi-regular text-xs leading-tight ${!recipeContent ? 'text-gray-400' : 'text-black'}`}>
              {!recipeContent ? 'Coming Soon' : isModalComplete('recipe') ? 'Completed' : recipeContent.title}
            </p>
          </button>

          {/* Marriage Insights Button */}
          <button
            data-testid="button-marriage-insights"
            className="w-full h-full rounded-xl p-4 text-center hover:scale-105 transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
            onClick={() => openModal('marriage-insights', 'table')}
            data-modal-type="marriage-insights"
            data-modal-section="table"
          >
            <div 
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full mb-1.5"
              style={{
                background: isModalComplete('marriage-insights')
                  ? 'rgba(139, 169, 131, 0.35)'
                  : 'linear-gradient(135deg, rgba(232, 180, 188, 0.35) 0%, rgba(200, 162, 200, 0.35) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }}
            >
              {isModalComplete('marriage-insights') ? (
                <svg className="text-black" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <Heart className="text-black" size={12} />
              )}
              <p className="platypi-bold text-xs text-black" data-testid="text-marriage-insights-title">Marriage Insights</p>
            </div>
            <p className="platypi-regular text-xs text-black leading-tight" data-testid="text-marriage-insights-subtitle">
              {isModalComplete('marriage-insights') ? 'Completed' : 'by Devora Levy'}
            </p>
          </button>
        </div>

        {/* Bottom Row: Life Classes and Meditation - Apple Glass Style */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Life Classes Button */}
          <button
            className={`w-full h-full rounded-xl p-4 text-center transition-all duration-300 relative ${
              !currentLifeClass ? 'cursor-not-allowed' : 'hover:scale-105'
            }`}
            style={{
              background: !currentLifeClass ? 'rgba(200, 200, 200, 0.5)' : 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
            onClick={() => {
              if (currentLifeClass) {
                openModal('life-class', 'table');
              }
            }}
            disabled={!currentLifeClass}
            data-testid="button-life-class"
          >
            {!currentLifeClass && (
              <div className="absolute inset-0 bg-black/10 rounded-xl flex items-center justify-center z-10">
                <div className="bg-white/90 px-2 py-1 rounded-lg">
                  <p className="platypi-medium text-xs text-black">Coming Soon</p>
                </div>
              </div>
            )}
            
            <div 
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full mb-1.5"
              style={{
                background: !currentLifeClass
                  ? 'rgba(150, 150, 150, 0.35)'
                  : isModalComplete('life-class')
                    ? 'rgba(139, 169, 131, 0.35)'
                    : 'linear-gradient(135deg, rgba(232, 180, 188, 0.35) 0%, rgba(200, 162, 200, 0.35) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }}
            >
              {isModalComplete('life-class') ? (
                <svg className="text-black" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ) : (
                <Home className={!currentLifeClass ? 'text-gray-500' : 'text-black'} size={12} />
              )}
              <p className={`platypi-bold text-xs ${!currentLifeClass ? 'text-gray-500' : 'text-black'}`}>Practical Parenting</p>
            </div>
            <p className={`platypi-regular text-xs leading-tight ${!currentLifeClass ? 'text-gray-400' : 'text-black'}`}>
              {!currentLifeClass ? 'Coming Soon' : isModalComplete('life-class') ? 'Completed' : currentLifeClass.title}
            </p>
          </button>

          {/* Meditation Button */}
          <button
            className="w-full h-full rounded-xl p-4 text-center hover:scale-105 transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
            onClick={() => openModal('meditation-categories', 'table')}
            data-testid="button-meditation"
            data-modal-type="meditation-categories"
            data-modal-section="table"
          >
            <div 
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full mb-1.5"
              style={{
                background: 'linear-gradient(135deg, rgba(232, 180, 188, 0.35) 0%, rgba(200, 162, 200, 0.35) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }}
            >
              <Brain className="text-black" size={12} />
              <p className="platypi-bold text-xs text-black">Meditation</p>
            </div>
            <p className="platypi-regular text-xs text-black leading-tight">
              Calm your mind
            </p>
          </button>
        </div>
        
        {/* Table Inspiration Bar - Only shown when content exists */}
        {inspirationContent && (
          <button 
            onClick={() => {
              const fullscreenEvent = new CustomEvent('openDirectFullscreen', {
                detail: {
                  modalKey: 'inspiration',
                  content: inspirationContent
                }
              });
              window.dispatchEvent(fullscreenEvent);
            }}
            className="w-full rounded-xl mt-2 overflow-hidden border border-blush/20 p-3 text-left transition-colors bg-white/80 hover:bg-white/90"
            data-testid="button-table-inspiration-bar"
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div className={`p-2 rounded-full ${
                isModalComplete('inspiration') ? 'bg-sage' : 'bg-gradient-feminine'
              }`}>
                <Star className="text-white" size={16} />
              </div>
              
              {/* Title and Subtitle */}
              <div className="flex-grow">
                <h3 className="platypi-bold text-sm text-black">Table Inspiration</h3>
                <p className="platypi-regular text-xs text-black/70">
                  {isModalComplete('inspiration') ? 'Completed' : inspirationContent.title}
                </p>
              </div>
              
              {/* Arrow indicator */}
              <ChevronRight className="text-black/40" size={18} />
            </div>
          </button>
        )}
        
        {/* Discount Promotion Bar */}
        <div className="mt-4">
          <DiscountBar />
        </div>
        
        {/* Bottom padding to prevent last element from being cut off by navigation */}
        <div className="h-16"></div>
      </div>
    </div>
  );
}

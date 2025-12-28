import { useState } from "react";
import { Utensils, Flame, Star, Heart, MapPin, Brain, ChevronDown, ChevronUp, ChevronRight, GraduationCap } from "lucide-react";
import customCandleIcon from "@assets/Untitled design (6)_1755630328619.png";
import DiscountBar from "@/components/discount-bar";
import { useModalStore, useModalCompletionStore } from "@/lib/types";

// TEMPORARY: Section background images
import sectionMorningBg from "@assets/Morning_1766941859356.jpg";
import sectionAfternoonBg from "@assets/Afternoon_1766941859356.jpg";
import sectionNightBg from "@assets/Night_Background_1766942692567.jpg";
import { useShabbosTime } from "@/hooks/use-shabbos-times";
import { useGeolocation, useJewishTimes } from "@/hooks/use-jewish-times";
import { useTableSummary } from "@/hooks/use-table-summary";
import DOMPurify from "dompurify";


export default function TableSection() {
  const { openModal } = useModalStore();
  const { isModalComplete } = useModalCompletionStore();
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
        <div className="bg-white/70 rounded-2xl p-3 border border-blush/10"
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
            <div className="bg-white/70 rounded-xl p-2 text-center border border-blush/10">
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
            <div className="bg-white/70 rounded-xl p-2 text-center border border-blush/10">
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
            className="bg-white/80 rounded-xl mt-2 overflow-hidden border border-blush/20"
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
              </div>
            )}
          </div>
        )}

      </div>

      {/* Shabbos Content Grid - Separate Section */}
      <div className="py-2 space-y-1">
        {/* Top Row: Daily Recipe and Date Converter */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Daily Recipe Button */}
          <button
            className={`rounded-3xl p-3 text-center transition-all duration-300 shadow-lg border border-blush/10 relative ${
              !recipeContent 
                ? 'bg-gray-100 cursor-not-allowed' 
                : isModalComplete('recipe') ? 'bg-sage/20 hover:scale-105' : 'bg-white hover:scale-105'
            }`}
            onClick={() => {
              if (recipeContent) {
                // Open directly in fullscreen without setting activeModal
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
            {/* Banner overlay for when no content */}
            {!recipeContent && (
              <div className="absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center z-10">
                <div className="bg-white/90 px-2 py-1 rounded-lg">
                  <p className="platypi-regular text-xs text-black platypi-medium">Recipe coming soon</p>
                </div>
              </div>
            )}
            
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              !recipeContent 
                ? 'bg-gray-300' 
                : isModalComplete('recipe') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Utensils className={`${!recipeContent ? 'text-gray-500' : 'text-white'}`} size={18} strokeWidth={1.5} />
            </div>
            <h3 className={`platypi-bold text-xs mb-1 platypi-bold ${!recipeContent ? 'text-gray-500' : 'text-black'}`}>
              Daily Recipe
            </h3>
            <p className={`platypi-regular text-xs leading-relaxed ${!recipeContent ? 'text-gray-400' : 'text-black/60'}`}>
              {!recipeContent ? 'Coming Soon' : isModalComplete('recipe') ? 'Completed' : recipeContent.title}
            </p>
          </button>

          {/* Marriage Insights Button */}
          <button
            data-testid="button-marriage-insights"
            className={`rounded-3xl p-3 text-center transition-all duration-300 shadow-lg border border-blush/10 relative ${
              isModalComplete('marriage-insights') ? 'bg-sage/20 hover:scale-105' : 'bg-white hover:scale-105'
            }`}
            onClick={() => openModal('marriage-insights', 'table')}
            data-modal-type="marriage-insights"
            data-modal-section="table"
          >
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              isModalComplete('marriage-insights') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <Heart className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="platypi-bold text-xs text-black mb-1 platypi-bold" data-testid="text-marriage-insights-title">Marriage Insights</h3>
            <p className={`platypi-regular text-xs leading-relaxed ${
              isModalComplete('marriage-insights') ? 'text-black/60' : 'text-black/60'
            }`} data-testid="text-marriage-insights-subtitle">
              {isModalComplete('marriage-insights') ? 'Completed' : 'by Devora Levy'}
            </p>
          </button>
        </div>

        {/* Bottom Row: Life Classes and Meditation */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Life Classes Button */}
          <button
            className={`rounded-3xl p-3 text-center transition-all duration-300 shadow-lg border border-blush/10 relative ${
              !currentLifeClass 
                ? 'bg-gray-100 cursor-not-allowed' 
                : isModalComplete('life-class') ? 'bg-sage/20 hover:scale-105' : 'bg-white hover:scale-105'
            }`}
            onClick={() => {
              if (currentLifeClass) {
                openModal('life-class', 'table');
              }
            }}
            disabled={!currentLifeClass}
            data-testid="button-life-class"
          >
            {/* Banner overlay for when no content */}
            {!currentLifeClass && (
              <div className="absolute inset-0 bg-black/20 rounded-3xl flex items-center justify-center z-10">
                <div className="bg-white/90 px-2 py-1 rounded-lg">
                  <p className="platypi-regular text-xs text-black platypi-medium">Coming Soon</p>
                </div>
              </div>
            )}
            
            <div className={`p-2 rounded-full mx-auto mb-2 w-fit ${
              !currentLifeClass 
                ? 'bg-gray-300' 
                : isModalComplete('life-class') ? 'bg-sage' : 'bg-gradient-feminine'
            }`}>
              <GraduationCap className={`${!currentLifeClass ? 'text-gray-500' : 'text-white'}`} size={18} strokeWidth={1.5} />
            </div>
            <h3 className={`platypi-bold text-xs mb-1 platypi-bold ${!currentLifeClass ? 'text-gray-500' : 'text-black'}`}>
              Life Classes
            </h3>
            <p className={`platypi-regular text-xs leading-relaxed ${!currentLifeClass ? 'text-gray-400' : 'text-black/60'}`}>
              {!currentLifeClass ? 'Coming Soon' : isModalComplete('life-class') ? 'Completed' : currentLifeClass.title}
            </p>
          </button>

          {/* Meditation Button */}
          <button
            className="rounded-3xl p-3 text-center hover:scale-105 transition-all duration-300 shadow-lg border border-blush/10 bg-white"
            onClick={() => openModal('meditation-categories', 'table')}
            data-testid="button-meditation"
            data-modal-type="meditation-categories"
            data-modal-section="table"
          >
            <div className="p-2 rounded-full mx-auto mb-2 w-fit bg-gradient-feminine">
              <Brain className="text-white" size={18} strokeWidth={1.5} />
            </div>
            <h3 className="platypi-bold text-xs text-black mb-1 platypi-bold">Meditation</h3>
            <p className="platypi-regular text-xs text-black/60 leading-relaxed">
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
            className={`w-full rounded-xl mt-2 overflow-hidden border border-blush/20 p-3 text-left transition-colors ${
              isModalComplete('inspiration') ? 'bg-sage/20 hover:bg-sage/30' : 'bg-white/80 hover:bg-white/90'
            }`}
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

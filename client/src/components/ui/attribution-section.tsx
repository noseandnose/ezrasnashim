import { useState, useEffect } from "react";
import { sanitizeHTML } from "@/lib/sanitize";

interface AttributionSectionProps {
  label: string;
  labelHtml?: boolean;
  logoUrl?: string | null | undefined;
  aboutText?: string | null | undefined;
  websiteUrl?: string | null | undefined;
  websiteLabel?: string | null | undefined;
  emailAddress?: string | null | undefined;
  className?: string;
  variant?: 'default' | 'white';
}

export function AttributionSection({
  label,
  labelHtml = false,
  logoUrl,
  aboutText,
  websiteUrl,
  websiteLabel,
  emailAddress,
  className = "",
  variant = 'default'
}: AttributionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Preload image when component mounts or logoUrl changes
  useEffect(() => {
    if (logoUrl) {
      setImageLoaded(false);
      setImageError(false);
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = logoUrl;
    }
  }, [logoUrl]);

  const hasExpandableContent = (logoUrl && !imageError) || aboutText;
  
  // Check if the website URL is already included in the label (either as text or as a link)
  const websiteAlreadyInLabel = websiteUrl && (
    label.includes(websiteUrl) || 
    label.includes('href=') ||
    (labelHtml && label.includes('<a'))
  );

  const isWhite = variant === 'white';
  
  if (!hasExpandableContent) {
    return (
      <div className={`${isWhite ? 'bg-solid-white border-gray-200' : 'bg-gradient-to-r from-blush/10 to-lavender/10 border-blush/20'} rounded-2xl p-4 border ${className}`}>
        {labelHtml ? (
          <p 
            className="text-sm platypi-medium text-black text-center"
            dangerouslySetInnerHTML={{ __html: sanitizeHTML(label) }}
          />
        ) : (
          <p className="text-sm platypi-medium text-black text-center">
            {label}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`mb-1 ${className}`}>
      <div className={`${isWhite ? 'bg-solid-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'} rounded-2xl border border-gray-200 transition-colors overflow-hidden`}>
        <button
          onPointerDown={() => setIsExpanded(prev => !prev)}
          className="w-full text-left p-3"
          data-testid="button-toggle-attribution"
        >
          <div className="flex items-center justify-between">
            {labelHtml ? (
              <span 
                className="platypi-medium text-black text-sm"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(label) }}
              />
            ) : (
              <span className="platypi-medium text-black text-sm">{label}</span>
            )}
            <span className="platypi-regular text-black/60 text-lg">
              {isExpanded ? '−' : '+'}
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="bg-solid-white overflow-hidden" data-testid="content-attribution-expanded">
            <div className="flex">
              {logoUrl && !imageError && (
                <div className="flex-shrink-0 w-24 self-stretch flex items-center justify-center" style={{ backgroundColor: '#ba89a0' }}>
                  {!imageLoaded ? (
                    <div className="w-12 h-12 animate-pulse bg-white/20 rounded-lg" />
                  ) : (
                    <img 
                      src={logoUrl} 
                      alt="Provider logo"
                      className="max-w-full max-h-full object-contain"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
              )}
              
              <div className={(logoUrl && !imageError) ? "flex-1 p-4" : "w-full p-4"}>
                {aboutText && (
                  <div className="platypi-regular leading-relaxed text-black/80 text-sm space-y-2" dir="ltr" style={{ textAlign: 'left' }}>
                    {aboutText.split('\n').map((paragraph, index) => {
                      const hasHebrew = /[\u0590-\u05FF]/.test(paragraph);
                      const isMainlyHebrew = hasHebrew && (paragraph.match(/[\u0590-\u05FF]/g)?.length || 0) > paragraph.length / 3;
                      
                      const renderTextWithLinks = (text: string) => {
                        const urlRegex = /(https?:\/\/[^\s]+)/g;
                        const parts = text.split(urlRegex);
                        
                        return parts.map((part, i) => {
                          if (urlRegex.test(part)) {
                            urlRegex.lastIndex = 0;
                            return (
                              <a
                                key={i}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {part}
                              </a>
                            );
                          }
                          return part;
                        });
                      };
                      
                      return (
                        <p 
                          key={index} 
                          dir={isMainlyHebrew ? "rtl" : "ltr"}
                          style={{ 
                            textAlign: isMainlyHebrew ? 'right' : 'left',
                            unicodeBidi: 'isolate'
                          }}
                        >
                          {renderTextWithLinks(paragraph)}
                        </p>
                      );
                    })}
                  </div>
                )}
                
                {((websiteUrl && !websiteAlreadyInLabel) || emailAddress) && (
                  <div className="mt-3 space-y-1">
                    {websiteUrl && !websiteAlreadyInLabel && (
                      <p className="text-sm">
                        <a 
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline platypi-medium"
                        >
                          {websiteLabel || websiteUrl}
                        </a>
                      </p>
                    )}
                    {emailAddress && (
                      <p className="text-sm">
                        <a 
                          href={`mailto:${emailAddress}`}
                          className="text-blue-600 hover:text-blue-800 underline platypi-medium"
                        >
                          {emailAddress}
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";

interface AttributionSectionProps {
  label: string;
  labelHtml?: boolean;
  logoUrl?: string | null | undefined;
  aboutText?: string | null | undefined;
  websiteUrl?: string | null | undefined;
  websiteLabel?: string | null | undefined;
  emailAddress?: string | null | undefined;
  className?: string;
}

export function AttributionSection({
  label,
  labelHtml = false,
  logoUrl,
  aboutText,
  websiteUrl,
  websiteLabel,
  emailAddress,
  className = ""
}: AttributionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasExpandableContent = logoUrl || aboutText;

  if (!hasExpandableContent) {
    return (
      <div className={`bg-gradient-to-r from-blush/10 to-lavender/10 rounded-2xl p-4 border border-blush/20 ${className}`}>
        {labelHtml ? (
          <p 
            className="text-sm platypi-medium text-black text-center"
            dangerouslySetInnerHTML={{ __html: label }}
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
      <div className="bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-200 transition-colors overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left p-3"
          data-testid="button-toggle-attribution"
        >
          <div className="flex items-center justify-between">
            {labelHtml ? (
              <span 
                className="platypi-medium text-black text-sm"
                dangerouslySetInnerHTML={{ __html: label }}
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
          <div className="bg-white border-t border-gray-200 overflow-hidden" data-testid="content-attribution-expanded">
            <div className="flex">
              {logoUrl && (
                <div className="flex-shrink-0 w-[35%]">
                  <img 
                    src={logoUrl} 
                    alt="Provider logo"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              
              <div className={logoUrl ? "w-[65%] p-4" : "w-full p-4"}>
                {aboutText && (
                  <div className="platypi-regular leading-relaxed text-black/80 text-sm space-y-2">
                    {aboutText.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                )}
                
                {(websiteUrl || emailAddress) && (
                  <div className="mt-3 space-y-1">
                    {websiteUrl && (
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

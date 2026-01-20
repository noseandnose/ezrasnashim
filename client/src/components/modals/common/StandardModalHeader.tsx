import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Minus, Expand, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface StandardModalHeaderProps {
  title: string;
  showLanguageToggle?: boolean;
  showFontControls?: boolean;
  showFullscreenButton?: boolean;
  showInfoPopover?: boolean;
  infoContent?: string;
  currentLanguage?: 'english' | 'hebrew';
  onLanguageChange?: (language: 'english' | 'hebrew') => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  onFullscreenClick?: () => void;
  className?: string;
}

export function StandardModalHeader({
  title,
  showLanguageToggle = false,
  showFontControls = false,
  showFullscreenButton = false,
  showInfoPopover = false,
  infoContent = '',
  currentLanguage = 'english',
  onLanguageChange,
  fontSize = 16,
  onFontSizeChange,
  onFullscreenClick,
  className = ''
}: StandardModalHeaderProps) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const increaseFontSize = () => {
    if (onFontSizeChange && fontSize < 24) {
      onFontSizeChange(fontSize + 1);
    }
  };

  const decreaseFontSize = () => {
    if (onFontSizeChange && fontSize > 12) {
      onFontSizeChange(fontSize - 1);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Language Toggle */}
      {showLanguageToggle && onLanguageChange && (
        <div className="absolute left-2 top-2 flex gap-1">
          <Button
            onClick={() => onLanguageChange('english')}
            size="sm"
            variant="ghost"
            className={`text-xs px-2 py-1 h-auto rounded-lg transition-all ${
              currentLanguage === 'english'
                ? 'bg-gradient-feminine text-white font-medium shadow-sm'
                : 'text-warm-gray bg-white/50 hover:bg-white/80'
            }`}
          >
            EN
          </Button>
          <Button
            onClick={() => onLanguageChange('hebrew')}
            size="sm"
            variant="ghost"
            className={`text-xs px-2 py-1 h-auto rounded-lg transition-all ${
              currentLanguage === 'hebrew'
                ? 'bg-gradient-feminine text-white font-medium shadow-sm'
                : 'text-warm-gray bg-white/50 hover:bg-white/80'
            }`}
          >
            HE
          </Button>
        </div>
      )}

      {/* Font Size Controls */}
      {showFontControls && onFontSizeChange && (
        <div className="absolute left-2 top-12 flex flex-col gap-1">
          <Button
            onClick={increaseFontSize}
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 rounded-full bg-white/50 hover:bg-white/80 transition-all"
            disabled={fontSize >= 24}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            onClick={decreaseFontSize}
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 rounded-full bg-white/50 hover:bg-white/80 transition-all"
            disabled={fontSize <= 12}
          >
            <Minus className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Right side controls */}
      <div className="absolute right-2 top-2 flex gap-2">
        {/* Info Popover */}
        {showInfoPopover && infoContent && (
          <Popover open={isInfoOpen} onOpenChange={setIsInfoOpen}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 rounded-full bg-white/50 hover:bg-white/80 transition-all"
              >
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-4 bg-white/95 backdrop-blur-sm border border-blush/20 rounded-2xl shadow-lg"
              side="left"
            >
              <div className="space-y-2">
                <div className="text-sm platypi-medium text-black">{infoContent}</div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Fullscreen Button */}
        {showFullscreenButton && onFullscreenClick && (
          <Button
            onClick={onFullscreenClick}
            size="sm"
            variant="ghost"
            className="w-8 h-8 p-0 rounded-full bg-white/50 hover:bg-white/80 transition-all"
          >
            <Expand className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Centered Title */}
      <div className="text-center pt-2">
        <h2 className="text-lg platypi-bold text-black">
          {title}
        </h2>
      </div>
    </div>
  );
}
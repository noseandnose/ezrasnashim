import { useState } from 'react';
import { Settings } from 'lucide-react';

interface FloatingSettingsProps {
  // Font Controls
  showFontControls?: boolean;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  // Language Controls
  showLanguageControls?: boolean;
  language?: 'hebrew' | 'english';
  onLanguageChange?: (lang: 'hebrew' | 'english') => void;
}

export function FloatingSettings({
  showFontControls = false,
  fontSize = 16,
  onFontSizeChange,
  showLanguageControls = false,
  language = 'hebrew',
  onLanguageChange
}: FloatingSettingsProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Don't render if no controls are needed
  if (!showFontControls && !showLanguageControls) {
    return null;
  }

  return (
    <>
      {/* Floating Settings Button */}
      <button
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        className="fixed bottom-6 left-6 w-12 h-12 bg-gradient-feminine text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-200 z-50"
        aria-label="Open settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Settings Drawer */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="fixed bottom-6 left-20 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 min-w-[200px]">
            <div className="space-y-4">
              {/* Language Selector */}
              {showLanguageControls && onLanguageChange && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Language</p>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => {
                        onLanguageChange('hebrew');
                        setIsDrawerOpen(false);
                      }}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors flex-1 ${
                        language === 'hebrew' 
                          ? 'bg-white text-black shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      עברית
                    </button>
                    <button
                      onClick={() => {
                        onLanguageChange('english');
                        setIsDrawerOpen(false);
                      }}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors flex-1 ${
                        language === 'english' 
                          ? 'bg-white text-black shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>
              )}

              {/* Font Size Controls */}
              {showFontControls && onFontSizeChange && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Font Size</p>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
                    <button
                      onClick={() => onFontSizeChange(Math.max(12, (fontSize || 16) - 2))}
                      className="w-8 h-8 flex items-center justify-center rounded bg-white text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
                      aria-label="Decrease font size"
                    >
                      A-
                    </button>
                    <span className="text-sm text-gray-600 font-medium px-2">
                      {fontSize || 16}px
                    </span>
                    <button
                      onClick={() => onFontSizeChange(Math.min(28, (fontSize || 16) + 2))}
                      className="w-8 h-8 flex items-center justify-center rounded bg-white text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors shadow-sm"
                      aria-label="Increase font size"
                    >
                      A+
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Close text */}
            <p className="text-xs text-gray-500 mt-3 text-center">Tap outside to close</p>
          </div>
        </>
      )}
    </>
  );
}
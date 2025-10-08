import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Plus, Minus } from "lucide-react";
import { useLocationStore } from '@/hooks/use-jewish-times';

// Shared Koren Thank You Component
export const KorenThankYou = () => {
  const { coordinates } = useLocationStore();
  
  // Check if user is in Israel based on coordinates
  const isInIsrael = coordinates && 
    coordinates.lat >= 29.5 && coordinates.lat <= 33.5 && 
    coordinates.lng >= 34.0 && coordinates.lng <= 36.0;
  
  const korenUrl = isInIsrael 
    ? "https://korenpub.co.il/collections/siddurim/products/koren-shalem-siddurhardcoverstandardashkenaz"
    : "https://korenpub.com/collections/siddurim/products/koren-shalem-siddur-ashkenaz-1";
  
  return (
    <div className="bg-blue-50 rounded-2xl px-2 py-3 mt-1 border border-blue-200">
      <span className="text-sm platypi-medium text-black">
        All tefilla texts courtesy of{' '}<a href={korenUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">Koren Publishers Jerusalem</a>{' '}and Rabbi Sacks Legacy
      </span>
    </div>
  );
};

// Standardized Modal Header Component
export const StandardModalHeader = ({ 
  title, 
  showHebrew, 
  setShowHebrew, 
  fontSize, 
  setFontSize 
}: {
  title: string;
  showHebrew: boolean;
  setShowHebrew: (show: boolean) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}) => (
  <div className="mb-2 space-y-2">
    {/* First Row: Language Toggle and Title */}
    <div className="flex items-center justify-center gap-4">
      <Button
        onClick={() => setShowHebrew(!showHebrew)}
        variant="ghost"
        size="sm"
        className={`text-xs platypi-medium px-3 py-1 rounded-lg transition-all ${
          showHebrew 
            ? 'bg-blush text-white' 
            : 'text-black/60 hover:text-black hover:bg-white/50'
        }`}
      >
        {showHebrew ? 'EN' : 'עב'}
      </Button>
      
      <DialogTitle className="text-lg platypi-bold text-black">{title}</DialogTitle>
    </div>
    
    {/* Second Row: Font Size Controls */}
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFontSize(Math.max(12, fontSize - 2))}
          className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-xs platypi-medium text-black/70 w-6 text-center">{fontSize}</span>
        <button
          onClick={() => setFontSize(Math.min(32, fontSize + 2))}
          className="w-6 h-6 rounded-full bg-warm-gray/10 flex items-center justify-center text-black/60 hover:text-black transition-colors"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
);
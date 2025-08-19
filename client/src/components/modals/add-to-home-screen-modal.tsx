import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Smartphone, X, Download, Plus, Home } from "lucide-react";

interface AddToHomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToHomeScreenModal({ isOpen, onClose }: AddToHomeScreenModalProps) {
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [showShareError, setShowShareError] = useState(false);

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setDeviceType('ios');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ezras Nashim',
          text: 'Daily Jewish spiritual app for women',
          url: window.location.origin
        });
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== 'AbortError') {
          setShowShareError(true);
          setTimeout(() => setShowShareError(false), 3000);
        }
      }
    } else {
      // Fallback - copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin);
        alert('Link copied to clipboard!');
      } catch {
        setShowShareError(true);
        setTimeout(() => setShowShareError(false), 3000);
      }
    }
  };

  const getInstructions = () => {
    if (deviceType === 'ios') {
      return (
        <div className="space-y-4">
          <h3 className="platypi-semibold text-lg text-black">For iPhone/iPad:</h3>
          <ol className="space-y-3 text-left">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-7 h-7 bg-gradient-feminine text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span className="text-warm-gray">Click the <strong>Share</strong> button below</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-7 h-7 bg-gradient-feminine text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <div className="space-y-1">
                <span className="text-warm-gray">In the share menu, scroll down and tap</span>
                <div className="flex items-center space-x-2 bg-ivory p-2 rounded-lg">
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Add to Home Screen</span>
                </div>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-7 h-7 bg-gradient-feminine text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span className="text-warm-gray">Tap <strong>Add</strong> in the top right corner</span>
            </li>
          </ol>
          <div className="bg-sage/10 p-3 rounded-lg">
            <p className="text-sm text-warm-gray">
              💡 <strong>Tip:</strong> The app will appear on your home screen just like a regular app!
            </p>
          </div>
        </div>
      );
    } else if (deviceType === 'android') {
      return (
        <div className="space-y-4">
          <h3 className="platypi-semibold text-lg text-black">For Android:</h3>
          <ol className="space-y-3 text-left">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-7 h-7 bg-gradient-feminine text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <span className="text-warm-gray">Click the <strong>Share</strong> button below</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-7 h-7 bg-gradient-feminine text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <div className="space-y-1">
                <span className="text-warm-gray">Select</span>
                <div className="flex items-center space-x-2 bg-ivory p-2 rounded-lg">
                  <Home className="w-4 h-4" />
                  <span className="font-medium">Add to Home screen</span>
                </div>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-7 h-7 bg-gradient-feminine text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
              <span className="text-warm-gray">Tap <strong>Add</strong> to confirm</span>
            </li>
          </ol>
          <div className="bg-sage/10 p-3 rounded-lg">
            <p className="text-sm text-warm-gray">
              💡 <strong>Tip:</strong> You can also tap the menu (⋮) in your browser and select "Add to Home screen"
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <h3 className="platypi-semibold text-lg text-black">For Desktop:</h3>
          <div className="space-y-3">
            <p className="text-warm-gray">
              To install Ezras Nashim on your computer:
            </p>
            <div className="bg-ivory p-4 rounded-lg space-y-2">
              <p className="text-sm text-warm-gray">
                <strong>Chrome/Edge:</strong> Look for the install icon <Download className="inline w-4 h-4" /> in the address bar
              </p>
              <p className="text-sm text-warm-gray">
                <strong>Safari:</strong> Add to Dock from the Share menu
              </p>
            </div>
            <p className="text-warm-gray text-sm">
              Or simply bookmark this page for quick access!
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-blush" />
              <span className="platypi-bold text-xl">Add to Home Screen</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="text-center mb-6">
            <p className="text-warm-gray">
              Access Ezras Nashim instantly from your home screen - no app store needed!
            </p>
          </div>

          {getInstructions()}

          {showShareError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                Unable to share. Please copy the URL manually from your browser's address bar.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              onClick={handleShare}
              className="w-full bg-gradient-feminine text-white hover:scale-105 transition-transform"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share App Link
            </Button>
            
            <button
              onClick={onClose}
              className="w-full py-2 text-warm-gray hover:text-black transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
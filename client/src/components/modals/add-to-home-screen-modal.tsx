import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Smartphone, Download, Plus, Home } from "lucide-react";
import { useBackButtonHistory } from "@/hooks/use-back-button-history";

interface AddToHomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToHomeScreenModal({ isOpen, onClose }: AddToHomeScreenModalProps) {
  // Register with back button history for Android WebView support
  useBackButtonHistory({ id: 'add-to-home-screen', isOpen, onClose });
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [iOSBrowser, setIOSBrowser] = useState<'safari' | 'chrome' | 'other'>('safari');

  useEffect(() => {
    // Detect device type and browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setDeviceType('ios');
      
      // Detect browser on iOS
      // Chrome on iOS includes "CriOS" in the user agent
      // Safari on iOS doesn't have "CriOS" or "FxiOS" (Firefox) in user agent
      if (userAgent.includes('crios')) {
        setIOSBrowser('chrome');
      } else if (userAgent.includes('fxios')) {
        setIOSBrowser('other');
      } else {
        setIOSBrowser('safari');
      }
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }
  }, []);

  const getInstructions = () => {
    if (deviceType === 'ios') {
      return (
        <div className="space-y-4">
          <h3 className="platypi-semibold text-lg text-black">For iPhone/iPad:</h3>
          <ol className="space-y-3 text-left">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-7 h-7 bg-gradient-feminine text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
              <div className="flex items-center space-x-2">
                <span className="text-warm-gray">
                  {iOSBrowser === 'safari' ? (
                    <>Tap the <strong>Share</strong> button at the bottom of the screen</>
                  ) : iOSBrowser === 'chrome' ? (
                    <>Tap the <strong>Share</strong> button at the top right corner of your screen</>
                  ) : (
                    <>Tap the <strong>Share</strong> button in your browser</>
                  )}
                </span>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-7 h-7 bg-gradient-feminine text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
              <div className="space-y-1">
                <span className="text-warm-gray">Scroll down and tap</span>
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
              <div className="space-y-1">
                <span className="text-warm-gray">Tap the <strong>Menu</strong> button</span>
                <div className="flex items-center space-x-2 bg-ivory p-2 rounded-lg">
                  <span className="text-lg">⋮</span>
                  <span className="text-sm text-warm-gray/70">Three dots in browser</span>
                </div>
              </div>
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
              💡 <strong>Tip:</strong> The app icon will be added to your home screen instantly!
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
          <DialogTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-blush" />
            <span className="platypi-bold text-xl">Add to Home Screen</span>
          </DialogTitle>
          <DialogDescription>
            Access Ezras Nashim instantly from your home screen - no app store needed!
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="text-center mb-6">
            <p className="text-warm-gray">
              Access Ezras Nashim instantly from your home screen - no app store needed!
            </p>
          </div>

          {getInstructions()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
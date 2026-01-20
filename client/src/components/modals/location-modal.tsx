import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocationStore } from "@/hooks/use-jewish-times";
import { useBackButtonHistory } from "@/hooks/use-back-button-history";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
  // Register with back button history for Android WebView support
  useBackButtonHistory({ id: 'location-modal', isOpen, onClose });
  const { setCoordinates } = useLocationStore();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Maps services
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
      
      // Create a temporary div for places service
      const tempDiv = document.createElement('div');
      placesService.current = new (window as any).google.maps.places.PlacesService(tempDiv);
    }
  }, [isOpen]);

  // Load Google Maps API
  useEffect(() => {
    if (isOpen && !(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
        const tempDiv = document.createElement('div');
        placesService.current = new (window as any).google.maps.places.PlacesService(tempDiv);
      };
      document.head.appendChild(script);
    }
  }, [isOpen]);

  // Get autocomplete predictions
  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    if (value.length > 2 && autocompleteService.current) {
      setShowPredictions(true);
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          types: ['(cities)'],
        },
        (predictions: any[] | null) => {
          if (predictions) {
            setPredictions(predictions.slice(0, 5)); // Limit to 5 suggestions
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  // Handle place selection
  const handlePlaceSelect = (placeId: string, description: string) => {
    if (!placesService.current) {
      toast({
        title: "Error",
        description: "Google Maps service not available",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setShowPredictions(false);
    placesService.current.getDetails(
      {
        placeId: placeId,
        fields: ['geometry', 'name', 'formatted_address']
      },
      (place: any, status: any) => {
        setIsLoading(false);
        
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place.geometry) {
          const coordinates = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          // Update the location store directly (setCoordinates now automatically resets permissionDenied)
          setCoordinates(coordinates);
          setInputValue(description);
          setPredictions([]);
          onClose();
          
          toast({
            title: "Location Updated",
            description: `Location set to ${description}`,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to get location details",
            variant: "destructive"
          });
        }
      }
    );
  };



  // Close without changes
  const handleClose = () => {
    setInputValue("");
    setPredictions([]);
    setShowPredictions(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md rounded-3xl p-6">
        <DialogHeader className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="bg-gradient-feminine p-2 rounded-full">
              <MapPin className="text-white" size={20} />
            </div>
          </div>
          <DialogTitle className="text-lg platypi-bold platypi-semibold text-black">Change Location</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Enter your city or location..."
              className="rounded-2xl border-blush/20 focus:border-blush bg-white"
              disabled={isLoading}
            />
            
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-blush" />
              </div>
            )}
          </div>

          {/* Autocomplete suggestions */}
          {showPredictions && predictions.length > 0 && (
            <div className="bg-white border border-blush/10 rounded-2xl shadow-lg max-h-48 overflow-y-auto">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
                  className="w-full text-left px-4 py-3 hover:bg-blush/5 transition-colors border-b border-blush/5 last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-blush" size={16} />
                    <div>
                      <div className="platypi-medium text-black">{prediction.structured_formatting.main_text}</div>
                      <div className="text-sm text-black/60">{prediction.structured_formatting.secondary_text}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}


          <div className="flex space-x-3">
            <Button 
              onClick={handleClose} 
              variant="outline"
              className="flex-1 rounded-2xl border-blush/30 text-blush hover:bg-blush/5"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
      
    </Dialog>
  );
}
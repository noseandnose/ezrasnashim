import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, MapPin, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useLocationStore } from "@/hooks/use-jewish-times";
import { toast } from "@/hooks/use-toast";
import backgroundImage from "@assets/Morning_Background_1767032607494.png";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, updateProfile } = useAuth();
  const { setCoordinates, resetLocation, useIPLocation } = useLocationStore();
  
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    coords: { lat: number; lng: number };
  } | null>(null);
  
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);

  useEffect(() => {
    if (user?.preferredLocation) {
      setInputValue(user.preferredLocation);
      if (user.preferredLocationCoords) {
        setSelectedLocation({
          name: user.preferredLocation,
          coords: user.preferredLocationCoords
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
      const tempDiv = document.createElement('div');
      placesService.current = new (window as any).google.maps.places.PlacesService(tempDiv);
    }
  }, []);

  useEffect(() => {
    if (!(window as any).google) {
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
  }, []);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSelectedLocation(null);
    
    if (value.length > 2 && autocompleteService.current) {
      setShowPredictions(true);
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          types: ['(cities)'],
        },
        (predictions: any[] | null) => {
          if (predictions) {
            setPredictions(predictions.slice(0, 5));
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

  const handlePlaceSelect = (prediction: any) => {
    if (!placesService.current) return;
    
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address', 'name'],
      },
      (place: any, status: string) => {
        if (status === 'OK' && place?.geometry?.location) {
          const coords = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          const locationName = prediction.description || place.formatted_address || place.name;
          
          setSelectedLocation({ name: locationName, coords });
          setInputValue(locationName);
          setPredictions([]);
          setShowPredictions(false);
        }
      }
    );
  };

  const handleSave = async () => {
    if (!selectedLocation) {
      toast({
        title: "Please select a location",
        description: "Type a city name and select from the suggestions",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await updateProfile({
        preferredLocation: selectedLocation.name,
        preferredLocationCoords: selectedLocation.coords
      });
      
      setCoordinates(selectedLocation.coords);
      localStorage.setItem('user-preferred-location', JSON.stringify(selectedLocation.coords));
      localStorage.setItem('user-preferred-location-name', selectedLocation.name);
      
      toast({
        title: "Location saved",
        description: "Your preferred location has been updated"
      });
    } catch (error) {
      toast({
        title: "Failed to save",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLocation = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        preferredLocation: null,
        preferredLocationCoords: null
      });
      
      localStorage.removeItem('user-preferred-location');
      localStorage.removeItem('user-preferred-location-name');
      
      setInputValue("");
      setSelectedLocation(null);
      
      // Reset the in-memory store and re-detect location
      resetLocation();
      
      // Try to get location via IP as fallback
      try {
        await useIPLocation();
      } catch (e) {
        // IP location failed, will use device location on next request
      }
      
      toast({
        title: "Location cleared",
        description: "Your location will now be detected automatically"
      });
    } catch (error) {
      toast({
        title: "Failed to clear",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="w-12 h-12 border-4 border-blush border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)'
        }}
      />
      
      <div className="relative z-10 max-w-md mx-auto p-4 pt-6 pb-24">
        <button 
          onClick={() => setLocation('/profile')}
          className="flex items-center gap-2 text-black/70 hover:text-black mb-6"
        >
          <ArrowLeft size={20} />
          <span className="platypi-regular">Back to Profile</span>
        </button>
        
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
          <h1 className="platypi-bold text-xl text-black mb-6">Settings</h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="platypi-semibold text-lg text-black mb-2 flex items-center gap-2">
                <MapPin size={18} className="text-blush" />
                Preferred Location
              </h2>
              <p className="platypi-regular text-sm text-black/60 mb-4">
                Set a location that will be used for Jewish times instead of your device's location. This is useful if you want times for a specific city.
              </p>
              
              <div className="relative">
                <Input
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Enter your city..."
                  className="platypi-regular"
                />
                
                {showPredictions && predictions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-60 overflow-y-auto">
                    {predictions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        onClick={() => handlePlaceSelect(prediction)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        <p className="platypi-regular text-sm text-black">{prediction.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedLocation && (
                <p className="platypi-regular text-xs text-green-600 mt-2">
                  Selected: {selectedLocation.name}
                </p>
              )}
              
              {user?.preferredLocation && (
                <p className="platypi-regular text-xs text-black/60 mt-2">
                  Current saved location: {user.preferredLocation}
                </p>
              )}
              
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !selectedLocation}
                  className="flex-1 bg-gradient-feminine text-white"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Location"
                  )}
                </Button>
                
                {user?.preferredLocation && (
                  <Button
                    onClick={handleClearLocation}
                    disabled={isSaving}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <X size={16} />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

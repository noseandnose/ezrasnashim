import { Scroll, Clock, HandHeart, ChevronRight, Plus, CheckCircle, User } from "lucide-react";
import { useModalStore } from "@/lib/types";
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Tehillim name entry interface
interface TehillimName {
  id: number;
  hebrewName: string;
  reason: string;
  dateAdded: string;
  // Future feature: automatic removal after 7 days
}

export default function TefillaSection() {
  const { openModal } = useModalStore();
  const { data: times, isLoading } = useJewishTimes();
  
  // Tehillim state management
  const [names, setNames] = useState<TehillimName[]>([]);
  const [currentPerek, setCurrentPerek] = useState(1);
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const [hebrewName, setHebrewName] = useState("");
  const [reason, setReason] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showHebrew, setShowHebrew] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedNames = localStorage.getItem('tehillim-names');
    const savedPerek = localStorage.getItem('tehillim-current-perek');
    const savedIndex = localStorage.getItem('tehillim-current-index');
    
    if (savedNames) {
      setNames(JSON.parse(savedNames));
    }
    if (savedPerek) {
      setCurrentPerek(parseInt(savedPerek));
    }
    if (savedIndex) {
      setCurrentNameIndex(parseInt(savedIndex));
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('tehillim-names', JSON.stringify(names));
  }, [names]);

  useEffect(() => {
    localStorage.setItem('tehillim-current-perek', currentPerek.toString());
  }, [currentPerek]);

  useEffect(() => {
    localStorage.setItem('tehillim-current-index', currentNameIndex.toString());
  }, [currentNameIndex]);

  // Add a new name to the list
  const addName = () => {
    if (!hebrewName.trim()) return;
    
    const newName: TehillimName = {
      id: Date.now(),
      hebrewName: hebrewName.trim(),
      reason: reason || 'רפואה',
      dateAdded: new Date().toISOString()
      // Future feature: Add expiration date (7 days from dateAdded)
    };
    
    setNames(prev => [...prev, newName]);
    setHebrewName("");
    setReason("");
    setShowAddForm(false);
  };

  // Mark current perek as completed and advance
  const completePerek = () => {
    setIsCompleting(true);
    
    // Short delay to show button feedback
    setTimeout(() => {
      setJustCompleted(true);
      setIsCompleting(false);
      
      // Advance to next perek (1-150, then cycle back to 1)
      const nextPerek = currentPerek >= 150 ? 1 : currentPerek + 1;
      setCurrentPerek(nextPerek);
      
      // Advance to next name if we have names
      if (names.length > 0) {
        const nextIndex = (currentNameIndex + 1) % names.length;
        setCurrentNameIndex(nextIndex);
      }
      
      // Clear completion message after 4 seconds
      setTimeout(() => setJustCompleted(false), 4000);
    }, 300);
  };

  // Get current name assignment (random selection instead of cycling)
  const getCurrentName = () => {
    if (names.length === 0) return null;
    // Use a seeded random based on perek number to get consistent assignment per perek
    const seedRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    const randomIndex = Math.floor(seedRandom(currentPerek) * names.length);
    return names[randomIndex];
  };

  const currentName = getCurrentName();

  // Get perek text (placeholder for now, will fetch from database)
  const getPerekText = (perekNumber: number) => {
    // Sample texts for demonstration - in production these would come from database
    const sampleTexts: { [key: number]: { hebrew: string; english: string } } = {
      1: {
        hebrew: "אַשְׁרֵי הָאִישׁ אֲשֶׁר לֹא הָלַךְ בַּעֲצַת רְשָׁעִים...",
        english: "Fortunate is the man who has not walked in the counsel of the wicked..."
      },
      23: {
        hebrew: "מִזְמוֹר לְדָוִד יְהוָה רֹעִי לֹא אֶחְסָר...",
        english: "A psalm of David. The Lord is my shepherd; I shall not want..."
      },
      91: {
        hebrew: "יֹשֵׁב בְּסֵתֶר עֶלְיוֹן בְּצֵל שַׁדַּי יִתְלוֹנָן...",
        english: "He who dwells in the secret place of the Most High..."
      },
      150: {
        hebrew: "הַלְלוּיָה הַלְלוּ אֵל בְּקָדְשׁוֹ...",
        english: "Hallelujah! Praise God in His sanctuary..."
      }
    };
    
    return sampleTexts[perekNumber] || {
      hebrew: `תהילים פרק ${perekNumber}`,
      english: `Psalm ${perekNumber} - Text will be added`
    };
  };

  const currentPerekText = getPerekText(currentPerek);

  return (
    <div className="h-full p-4">
      <div className="space-y-3 h-full">
        {/* Tehillim Section */}
        <div className="content-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Scroll className="text-xl text-blush" size={24} />
              <h3 className="font-semibold text-sm">Tehillim Cycle</h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs"
            >
              <Plus size={14} className="mr-1" />
              Add Name
            </Button>
          </div>

          {/* Add Name Form */}
          {showAddForm && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Hebrew Name
                </label>
                <Input
                  value={hebrewName}
                  onChange={(e) => setHebrewName(e.target.value)}
                  placeholder="Enter Hebrew name..."
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Prayer Reason
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="רפואה">רפואה (Healing)</SelectItem>
                    <SelectItem value="שידוך">שידוך (Shidduch)</SelectItem>
                    <SelectItem value="פרנסה">פרנסה (Parnassah)</SelectItem>
                    <SelectItem value="הצלחה">הצלחה (Success)</SelectItem>
                    <SelectItem value="זרע של קיימא">זרע של קיימא (Children)</SelectItem>
                    <SelectItem value="שלום בית">שלום בית (Peace in Home)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={addName}
                  disabled={!hebrewName.trim()}
                  className="flex-1"
                >
                  Add to List
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setHebrewName("");
                    setReason("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Current Perek Display */}
          <div className="space-y-3">
            {justCompleted && (
              <div className="flex items-center justify-center space-x-2 text-green-600 text-sm bg-green-50 rounded-lg p-3 mb-3 animate-pulse border border-green-200">
                <CheckCircle size={20} className="text-green-500" />
                <span className="font-medium">Perek {currentPerek - 1 || 150} completed! ✓</span>
              </div>
            )}
            
            <div className="bg-blush/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-blush">
                  Perek {currentPerek}
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowHebrew(!showHebrew)}
                  className="text-xs"
                >
                  {showHebrew ? "EN" : "עב"}
                </Button>
              </div>
              
              {/* Perek Text Display */}
              <div className="space-y-3 mb-3">
                <div className="bg-white/80 rounded p-3">
                  {showHebrew ? (
                    <div className="text-sm leading-relaxed text-right" style={{ fontFamily: 'Times, serif', direction: 'rtl' }}>
                      {currentPerekText.hebrew}
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed text-left">
                      {currentPerekText.english}
                    </div>
                  )}
                </div>
                
              </div>
              
              {/* Current Name Assignment */}
              {currentName ? (
                <div className="bg-white/60 rounded p-2 space-y-1">
                  <div className="flex items-center space-x-2">
                    <User size={12} className="text-blush" />
                    <span className="text-sm font-medium text-blush">
                      Davening For: {currentName.hebrewName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {currentName.reason}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 text-center py-2">
                  Add a name to dedicate this perek
                </div>
              )}
            </div>

            {/* Progress and Action */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {names.length} names • Perek {currentPerek} of 150
              </div>
              <Button
                size="sm"
                onClick={completePerek}
                disabled={isCompleting}
                className="bg-blush hover:bg-blush/90 disabled:opacity-50"
              >
                {isCompleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Completing...</span>
                  </div>
                ) : (
                  "Mark Done"
                )}
              </Button>
            </div>
          </div>

          
        </div>

        {/* Mincha */}
        <div 
          className="content-card rounded-2xl p-4 cursor-pointer"
          onClick={() => openModal('mincha')}
        >
          <div className="flex items-center space-x-3">
            <Clock className="text-xl text-peach" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Mincha</h3>
              <p className="text-xs text-gray-600">
                {isLoading ? "Loading..." : 
                 times?.minchaGedolah && times?.minchaKetanah ? 
                 `${times.minchaGedolah} - ${times.minchaKetanah}` : 
                 "Loading..."}
              </p>
            </div>
          </div>
        </div>

        {/* Women's Prayers */}
        <div 
          className="content-card rounded-2xl p-4 cursor-pointer"
          onClick={() => openModal('womens-prayers')}
        >
          <div className="flex items-center space-x-3">
            <HandHeart className="text-xl text-blush" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Women's Prayers</h3>
              <p className="text-xs text-gray-600">Blessings, Tefillos & Personal</p>
            </div>
            <ChevronRight className="text-gray-400" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

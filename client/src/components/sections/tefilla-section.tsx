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
    setJustCompleted(true);
    
    // Advance to next perek (1-150, then cycle back to 1)
    const nextPerek = currentPerek >= 150 ? 1 : currentPerek + 1;
    setCurrentPerek(nextPerek);
    
    // Advance to next name if we have names
    if (names.length > 0) {
      const nextIndex = (currentNameIndex + 1) % names.length;
      setCurrentNameIndex(nextIndex);
    }
    
    // Clear completion message after 2 seconds
    setTimeout(() => setJustCompleted(false), 2000);
  };

  // Get current name assignment
  const getCurrentName = () => {
    if (names.length === 0) return null;
    return names[currentNameIndex];
  };

  const currentName = getCurrentName();

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
              <div className="flex items-center space-x-2 text-green-600 text-sm">
                <CheckCircle size={16} />
                <span>Perek {currentPerek - 1 || 150} completed!</span>
              </div>
            )}
            
            <div className="bg-blush/10 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-blush">
                  Current Perek: {currentPerek}
                </h4>
                <span className="text-xs bg-blush/20 text-blush px-2 py-1 rounded-full">
                  {Math.ceil(currentPerek / 5)} of 30 cycles
                </span>
              </div>
              
              {currentName ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User size={14} className="text-gray-600" />
                    <span className="text-sm font-medium">{currentName.hebrewName}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    For: {currentName.reason}
                  </div>
                  <div className="text-xs text-gray-500">
                    {/* Future feature: Show days remaining (7 days total) */}
                    Added: {new Date(currentName.dateAdded).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  No names in list. Add a name to begin dedicated prayers.
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
                className="bg-blush hover:bg-blush/90"
              >
                Mark Done
              </Button>
            </div>
          </div>

          {/* Names List (if any) */}
          {names.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h5 className="text-xs font-medium text-gray-700 mb-2">
                Prayer List ({names.length} names)
              </h5>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {names.map((name, index) => (
                  <div
                    key={name.id}
                    className={`text-xs p-2 rounded ${
                      index === currentNameIndex
                        ? 'bg-blush/20 text-blush font-medium'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {name.hebrewName} - {name.reason}
                    {index === currentNameIndex && (
                      <span className="ml-2 text-xs">(Current)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
                 times?.minchaGedolah && times?.minchaKetana ? 
                 `${times.minchaGedolah} - ${times.minchaKetana}` : 
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

import { Scroll, Clock, HandHeart, ChevronRight, Plus, CheckCircle, User, AlertCircle, Calendar, Heart } from "lucide-react";
import { useModalStore } from "@/lib/types";
import { useJewishTimes } from "@/hooks/use-jewish-times";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import type { TehillimName, GlobalTehillimProgress } from "@shared/schema";

export default function TefillaSection() {
  const { openModal } = useModalStore();
  const { data: times, isLoading } = useJewishTimes();
  const queryClient = useQueryClient();
  
  // Local state management
  const [hebrewName, setHebrewName] = useState("");
  const [reason, setReason] = useState("");
  const [reasonEnglish, setReasonEnglish] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHebrew, setShowHebrew] = useState(true);

  // Fetch global Tehillim progress
  const { data: progress } = useQuery<GlobalTehillimProgress>({
    queryKey: ['/api/tehillim/progress'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch current name for the perek
  const { data: currentName } = useQuery<TehillimName | null>({
    queryKey: ['/api/tehillim/current-name'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch all active names for count display
  const { data: allNames } = useQuery<TehillimName[]>({
    queryKey: ['/api/tehillim/names'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Mutation to complete a perek
  const completePerekMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/tehillim/complete', { completedBy: 'user' });
    },
    onSuccess: () => {
      toast({
        title: "Perek Completed!",
        description: `Perek ${progress?.currentPerek || 'current'} has been completed. Moving to the next perek.`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete perek. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation to add a new name
  const addNameMutation = useMutation({
    mutationFn: async (data: { hebrewName: string; reason: string; reasonEnglish?: string }) => {
      return apiRequest('POST', '/api/tehillim/names', data);
    },
    onSuccess: () => {
      toast({
        title: "Name Added Successfully",
        description: "The name has been added to the Tehillim cycle and will be removed automatically after 7 days.",
      });
      setHebrewName("");
      setReason("");
      setReasonEnglish("");
      setShowAddForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/names'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tehillim/current-name'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add name. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleAddName = () => {
    if (!hebrewName.trim() || !reason.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in both the Hebrew name and reason fields.",
        variant: "destructive"
      });
      return;
    }

    addNameMutation.mutate({
      hebrewName: hebrewName.trim(),
      reason: reason.trim(),
      reasonEnglish: reasonEnglish.trim() || undefined
    });
  };

  const completePerek = () => {
    completePerekMutation.mutate();
  };

  // Reason options for the dropdown
  const reasonOptions = [
    { value: "רפואה שלמה", label: "רפואה שלמה (Complete Healing)", english: "Complete Healing" },
    { value: "זרע של קיימא", label: "זרע של קיימא (Children)", english: "Children" },
    { value: "שידוך הגון", label: "שידוך הגון (Good Match)", english: "Good Match" },
    { value: "פרנסה טובה", label: "פרנסה טובה (Good Livelihood)", english: "Good Livelihood" },
    { value: "הצלחה", label: "הצלחה (Success)", english: "Success" },
    { value: "שלום בית", label: "שלום בית (Peace in Home)", english: "Peace in Home" },
    { value: "עליית נשמה", label: "עליית נשמה (Soul Elevation)", english: "Soul Elevation" }
  ];

  const getTehillimText = (perekNumber: number, isHebrew: boolean) => {
    // Authentic Tehillim texts for the first few perakim
    const tehillimTexts: Record<number, { hebrew: string; english: string }> = {
      1: {
        hebrew: "אַשְׁרֵי הָאִישׁ אֲשֶׁר לֹא הָלַךְ בַּעֲצַת רְשָׁעִים וּבְדֶרֶךְ חַטָּאִים לֹא עָמָד וּבְמוֹשַׁב לֵצִים לֹא יָשָׁב׃ כִּי אִם בְּתוֹרַת יְהוָה חֶפְצוֹ וּבְתוֹרָתוֹ יֶהְגֶּה יוֹמָם וָלָיְלָה׃",
        english: "Happy is the man who has not walked in the counsel of the wicked, nor stood in the way of sinners, nor sat in the seat of scorners. But his delight is in the law of the Lord, and in His law he meditates day and night."
      },
      2: {
        hebrew: "לָמָּה רָגְשׁוּ גוֹיִם וּלְאֻמִּים יֶהְגּוּ רִיק׃ יִתְיַצְּבוּ מַלְכֵי אֶרֶץ וְרוֹזְנִים נוֹסְדוּ יָחַד עַל יְהוָה וְעַל מְשִׁיחוֹ׃",
        english: "Why do the nations rage, and the peoples plot in vain? The kings of the earth set themselves, and the rulers take counsel together, against the Lord and against His anointed."
      },
      3: {
        hebrew: "מִזְמוֹר לְדָוִד בְּבָרְחוֹ מִפְּנֵי אַבְשָׁלוֹם בְּנוֹ׃ יְהוָה מָה רַבּוּ צָרָי רַבִּים קָמִים עָלָי׃",
        english: "A Psalm of David, when he fled from Absalom his son. Lord, how many are my foes! Many are rising against me."
      }
    };

    const text = tehillimTexts[perekNumber];
    if (!text) {
      return (
        <div className="text-sm text-gray-600 italic text-center">
          {isHebrew ? `פרק ${perekNumber} - טקסט מלא זמין בספר תהלים` : `Perek ${perekNumber} - Full text available in Tehillim book`}
        </div>
      );
    }

    return (
      <div className={`text-sm leading-relaxed ${isHebrew ? 'text-right font-hebrew' : 'font-english'}`}>
        {isHebrew ? text.hebrew : text.english}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold warm-gray">Tefilla</h2>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHebrew(!showHebrew)}
            className="text-xs"
          >
            {showHebrew ? 'EN' : 'עב'}
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Tehillim Cycle */}
        <div className="content-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Scroll className="text-xl text-blush" size={24} />
              <div>
                <h3 className="font-semibold text-sm">Tehillim Cycle</h3>
                <p className="text-xs text-gray-600">
                  {showHebrew ? "מחזור תהלים משותף" : "Shared Tehillim Cycle"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-blush"
            >
              <Plus size={16} />
            </Button>
          </div>

          {/* Add Name Form */}
          {showAddForm && (
            <div className="space-y-3 mb-4 p-3 bg-warm-white rounded-xl">
              <div className="flex items-center space-x-2 text-sm text-orange-600">
                <AlertCircle size={16} />
                <span>Names are automatically removed after 7 days</span>
              </div>
              
              <Input
                placeholder={showHebrew ? "שם בעברית" : "Hebrew Name"}
                value={hebrewName}
                onChange={(e) => setHebrewName(e.target.value)}
                className="text-right"
                dir="rtl"
              />
              
              <Select value={reason} onValueChange={(value) => {
                setReason(value);
                const option = reasonOptions.find(opt => opt.value === value);
                setReasonEnglish(option?.english || "");
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={showHebrew ? "בחר סיבה" : "Select Reason"} />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {showHebrew ? option.value : option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setShowAddForm(false)} 
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {showHebrew ? "ביטול" : "Cancel"}
                </Button>
                <Button 
                  onClick={handleAddName}
                  disabled={addNameMutation.isPending}
                  size="sm"
                  className="flex-1 bg-blush hover:bg-blush/90"
                >
                  {addNameMutation.isPending ? "Adding..." : (showHebrew ? "הוסף" : "Add")}
                </Button>
              </div>
            </div>
          )}

          {/* Current Perek Display */}
          <div className="bg-cream rounded-xl p-3 mb-3">
            <div className="text-sm font-medium text-gray-700 mb-2">
              {showHebrew ? `פרק ${progress?.currentPerek || 1}` : `Current Perek ${progress?.currentPerek || 1}`}
            </div>
            
            {/* Tehillim Text Display */}
            <div className="mb-3 bg-white rounded-lg p-3 max-h-32 overflow-y-auto">
              {getTehillimText(progress?.currentPerek || 1, showHebrew)}
            </div>

            {/* Current Name Assignment */}
            <div className="mb-3">
              {currentName ? (
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <User size={12} className="text-blush" />
                    <span className="text-sm font-medium text-blush">
                      {showHebrew ? "מתפלל עבור:" : "Davening For:"} {currentName.hebrewName}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {showHebrew ? currentName.reason : (currentName.reasonEnglish || currentName.reason)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 text-center py-2">
                  {showHebrew ? "הוסף שם להקדיש פרק זה" : "Add a name to dedicate this perek"}
                </div>
              )}
            </div>

            {/* Progress and Action */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                {(allNames?.length || 0)} names • Perek {progress?.currentPerek || 1} of 150
              </div>
              <Button
                size="sm"
                onClick={completePerek}
                disabled={completePerekMutation.isPending}
                className="bg-blush hover:bg-blush/90 disabled:opacity-50"
              >
                {completePerekMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Completing...</span>
                  </div>
                ) : (
                  showHebrew ? "סיים פרק" : "Mark Done"
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

        {/* Nishmas 40-Day Campaign */}
        <div 
          className="content-card rounded-2xl p-4 cursor-pointer"
          onClick={() => openModal('nishmas-campaign')}
        >
          <div className="flex items-center space-x-3">
            <Heart className="text-xl text-rose-500" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Nishmas 40-Day Campaign</h3>
              <p className="text-xs text-gray-600">Daily tefillah for yeshuos</p>
            </div>
            <ChevronRight className="text-gray-400" size={16} />
          </div>
        </div>

        {/* Hebrew Date Calculator */}
        <div 
          className="content-card rounded-2xl p-4 cursor-pointer"
          onClick={() => openModal('date-calculator')}
        >
          <div className="flex items-center space-x-3">
            <Calendar className="text-xl text-purple-500" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Hebrew Date Calculator</h3>
              <p className="text-xs text-gray-600">Convert dates & add events</p>
            </div>
            <Plus className="text-gray-400" size={16} />
          </div>
        </div>
      </div>
      {/* Bottom padding to prevent last element from being cut off by navigation */}
      <div className="h-24"></div>
    </div>
  );
}
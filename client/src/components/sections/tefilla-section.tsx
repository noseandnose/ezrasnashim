import { Scroll, Clock, HandHeart, Plus, CheckCircle, User, AlertCircle, Calendar, Heart, ChevronRight } from "lucide-react";
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
    <div className="p-4 space-y-6">
      {/* Personalized Welcome Message */}
      <div className="bg-gradient-to-r from-blush/10 to-lavender/10 rounded-3xl p-6 text-center border border-blush/20">
        <h2 className="font-serif text-2xl text-warm-gray mb-2">
          בוקר טוב, נשים קדושות!
        </h2>
        <p className="font-sans text-warm-gray/80 text-sm leading-relaxed">
          May your tefilla today be uplifting and bring you closer to the Divine
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Daily Tehillim Card */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-blush/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-feminine p-3 rounded-full">
                <Scroll className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-serif text-lg text-warm-gray">Daily Tehillim</h3>
                <p className="font-sans text-sm text-warm-gray/70">
                  Shared Cycle for Yeshuos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHebrew(!showHebrew)}
                className="text-xs px-2 py-1 h-auto border-gray-300 bg-white hover:bg-gray-50"
              >
                {showHebrew ? 'EN' : 'עב'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-blush"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>

          {/* Add Name Form */}
          {showAddForm && (
            <div className="space-y-4 mb-6 p-4 bg-gradient-to-r from-ivory to-lavender/5 rounded-2xl border border-lavender/20">
              <div className="flex items-center space-x-2 text-sm text-blush/80">
                <AlertCircle size={16} />
                <span className="font-sans">Names are automatically removed after 7 days</span>
              </div>
              
              <Input
                placeholder="Hebrew Name"
                value={hebrewName}
                onChange={(e) => setHebrewName(e.target.value)}
                className="text-right rounded-2xl border-blush/20 focus:border-blush"
                dir="rtl"
              />
              
              <Select value={reason} onValueChange={(value) => {
                setReason(value);
                const option = reasonOptions.find(opt => opt.value === value);
                setReasonEnglish(option?.english || "");
              }}>
                <SelectTrigger className="w-full rounded-2xl border-blush/20">
                  <SelectValue placeholder="Select Reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {showHebrew ? option.value : option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowAddForm(false)} 
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-2xl border-blush/30 hover:bg-blush/5"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddName}
                  disabled={addNameMutation.isPending}
                  size="sm"
                  className="flex-1 rounded-2xl bg-gradient-feminine hover:opacity-90 text-white"
                >
                  {addNameMutation.isPending ? "Adding..." : "Add Name"}
                </Button>
              </div>
            </div>
          )}

          {/* Current Perek Display with Progress Bar */}
          <div className="bg-gradient-to-br from-ivory to-lavender/10 rounded-2xl p-5 mb-4 border border-blush/15">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif text-lg text-warm-gray">
                Perek {progress?.currentPerek || 1}
              </h4>
              <div className="text-xs text-warm-gray/60 font-sans">
                {progress?.currentPerek || 1} of 150
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-blush/20 rounded-full h-2">
                <div 
                  className="bg-gradient-feminine h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((progress?.currentPerek || 1) / 150) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-warm-gray/60 mt-1 font-sans">
                {(allNames?.length || 0)} names in cycle
              </div>
            </div>
            
            {/* Tehillim Text Display */}
            <div className="mb-4 bg-white/70 rounded-2xl p-4 max-h-32 overflow-y-auto border border-blush/10">
              {getTehillimText(progress?.currentPerek || 1, showHebrew)}
            </div>

            {/* Current Name Assignment */}
            <div className="mb-4">
              {currentName ? (
                <div className="bg-white/80 rounded-2xl p-4 border border-blush/15">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="bg-blush/20 p-1 rounded-full">
                      <User size={12} className="text-blush" />
                    </div>
                    <span className="font-serif text-sm font-medium text-warm-gray">
                      Davening For: {currentName.hebrewName}
                    </span>
                  </div>
                  <div className="text-xs text-warm-gray/70 font-sans">
                    {currentName.reasonEnglish || currentName.reason}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-warm-gray/60 text-center py-3 font-sans">
                  Add a name to dedicate this perek
                </div>
              )}
            </div>

            {/* Mark Done Button */}
            <Button
              onClick={completePerek}
              disabled={completePerekMutation.isPending}
              className="w-full rounded-2xl bg-gradient-feminine hover:opacity-90 text-white font-sans py-3 shadow-lg transition-all duration-300"
            >
              {completePerekMutation.isPending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Completing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle size={16} />
                  <span>Mark Done</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Grid of 4 Square Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Mincha */}
          <div 
            className="content-card rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => openModal('mincha')}
          >
            <div className="text-center">
              <Clock className="text-peach mb-2 mx-auto" size={32} />
              <h3 className="font-semibold text-sm">Mincha</h3>
              <p className="text-xs text-gray-600 mt-1">
                {isLoading ? "Loading..." : 
                 times?.minchaGedolah && times?.minchaKetanah ? 
                 `${times.minchaGedolah} - ${times.minchaKetanah}` : 
                 "Loading..."}
              </p>
            </div>
          </div>

          {/* Women's Prayers */}
          <div 
            className="content-card rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => openModal('womens-prayers')}
          >
            <div className="text-center">
              <HandHeart className="text-blush mb-2 mx-auto" size={32} />
              <h3 className="font-semibold text-sm">Women's Prayers</h3>
              <p className="text-xs text-gray-600 mt-1">Blessings & Tefillos</p>
            </div>
          </div>

          {/* Nishmas 40-Day Campaign */}
          <div 
            className="content-card rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => openModal('nishmas-campaign')}
          >
            <div className="text-center">
              <Heart className="text-rose-500 mb-2 mx-auto" size={32} />
              <h3 className="font-semibold text-sm">Nishmas Campaign</h3>
              <p className="text-xs text-gray-600 mt-1">40 Days for Yeshuos</p>
            </div>
          </div>

          {/* Hebrew Date Calculator */}
          <div 
            className="content-card rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => openModal('date-calculator')}
          >
            <div className="text-center">
              <Calendar className="text-purple-500 mb-2 mx-auto" size={32} />
              <h3 className="font-semibold text-sm">Date Calculator</h3>
              <p className="text-xs text-gray-600 mt-1">Convert & Add Events</p>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom padding to prevent last element from being cut off by navigation */}
      <div className="h-24"></div>
    </div>
  );
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function TimesModals() {
  const { activeModal, closeModal } = useModalStore();
  const [eventTitle, setEventTitle] = useState("");
  const [hebrewDate, setHebrewDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEventMutation = useMutation({
    mutationFn: async (data: { title: string; hebrewDate: string; gregorianDate: string; recurring: boolean; years: number }) => {
      return apiRequest('POST', '/api/calendar-events', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-events'] });
      toast({
        title: "Success",
        description: "Event added to calendar for the next 20 years"
      });
      setEventTitle("");
      setHebrewDate("");
      closeModal();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add event to calendar",
        variant: "destructive"
      });
    }
  });

  const handleAddToCalendar = () => {
    if (!eventTitle || !hebrewDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    // Simple date conversion (in real app, would use proper Hebrew date library)
    const gregorianDate = new Date().toISOString().split('T')[0];

    createEventMutation.mutate({
      title: eventTitle,
      hebrewDate,
      gregorianDate,
      recurring: true,
      years: 20
    });
  };

  return (
    <>
      {/* Hebrew Date Calculator Modal */}
      <Dialog open={activeModal === 'date-calculator'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <DialogTitle className="text-lg font-semibold">Hebrew Date Calculator</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Event Title</Label>
              <Input 
                type="text" 
                placeholder="Anniversary, Yahrzeit, etc." 
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush"
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Hebrew Date</Label>
              <Input 
                type="text" 
                placeholder="כ״ט כסלו" 
                value={hebrewDate}
                onChange={(e) => setHebrewDate(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blush"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => closeModal()} 
                variant="outline"
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddToCalendar}
                disabled={createEventMutation.isPending}
                className="flex-1 gradient-blush-peach text-white py-3 rounded-xl font-medium border-0"
              >
                {createEventMutation.isPending ? "Adding..." : "Add to Calendar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

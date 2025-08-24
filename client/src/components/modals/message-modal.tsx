import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Message } from "@shared/schema";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

export default function MessageModal({ isOpen, onClose, date }: MessageModalProps) {
  const { data: message, isLoading } = useQuery<Message>({
    queryKey: [`/api/messages/${date}`],
    enabled: isOpen && !!date,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="platypi-bold text-xl text-black">
            {isLoading ? "Loading..." : message?.title || "Daily Message"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 overflow-y-auto flex-1">
          {isLoading ? (
            <p className="text-center text-warm-gray">Loading message...</p>
          ) : message ? (
            <div className="space-y-4">
              <p className="text-warm-gray whitespace-pre-wrap platypi-medium leading-relaxed">
                {message.message}
              </p>
              <p className="text-xs text-warm-gray/60 text-right">
                {format(new Date(date), "MMMM d, yyyy")}
              </p>
            </div>
          ) : (
            <p className="text-center text-warm-gray">
              No message available for today.
            </p>
          )}
        </div>
        
        <div className="flex-shrink-0 pt-4">
          <Button 
            onClick={onClose}
            className="w-full py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
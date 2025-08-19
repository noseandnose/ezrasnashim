import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="platypi-bold text-xl text-black">
            {isLoading ? "Loading..." : message?.title || "Daily Message"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <p className="text-center text-warm-gray">Loading message...</p>
          ) : message ? (
            <div className="space-y-4">
              <p className="text-warm-gray whitespace-pre-wrap">
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
      </DialogContent>
    </Dialog>
  );
}
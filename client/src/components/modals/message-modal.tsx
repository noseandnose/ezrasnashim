import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Settings, Bell } from "lucide-react";
import type { Message } from "@shared/schema";
import { MobilePermissionsGuide } from "@/components/mobile-permissions-guide";
import { isMobileApp } from "@/utils/mobile-app-detection";

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

export default function MessageModal({ isOpen, onClose, date }: MessageModalProps) {
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  
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
          <DialogDescription>
            Updates on New Features and other Exciting activity
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="bg-white rounded-2xl p-6 border border-blush/10">
              <p className="text-center text-warm-gray">Loading message...</p>
            </div>
          ) : message ? (
            <div className="bg-white rounded-2xl p-6 border border-blush/10">
              <div className="space-y-4">
                <p className="text-warm-gray whitespace-pre-wrap platypi-medium leading-relaxed">
                  {message.message}
                </p>
                <p className="text-xs text-warm-gray/60 text-right">
                  {format(new Date(date), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-blush/10">
              <p className="text-center text-warm-gray">
                No message available for today.
              </p>
            </div>
          )}
        </div>
        
        {/* Mobile App Notification Permission Helper */}
        {isMobileApp() && (
          <div className="bg-gradient-to-r from-lavender-50 to-rose-50 rounded-2xl p-4 border border-lavender/20 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-blush" />
              <p className="platypi-medium text-black">Get Notifications?</p>
            </div>
            <p className="text-sm text-gray-700 mb-3 platypi-regular">
              Enable notifications to receive updates about new messages and features.
            </p>
            <Button
              onClick={() => setShowPermissionGuide(true)}
              variant="outline"
              size="sm"
              className="w-full rounded-xl border-blush/30 text-blush hover:bg-blush/5"
            >
              Show Notification Guide
            </Button>
          </div>
        )}
        
        <div className="flex-shrink-0 pt-4">
          <Button 
            onClick={onClose}
            className="w-full py-3 rounded-xl platypi-medium border-0 bg-gradient-feminine text-white hover:scale-105 transition-transform"
          >
            Done
          </Button>
        </div>
      </DialogContent>
      
      <MobilePermissionsGuide
        isOpen={showPermissionGuide}
        onClose={() => setShowPermissionGuide(false)}
        permissionType="notifications"
      />
    </Dialog>
  );
}
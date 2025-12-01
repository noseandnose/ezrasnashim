"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  // FIX: Radix Dialog sets pointer-events: none on <body> when dialogs are open
  // This can get stuck after closing, especially in mobile WebViews after background/resume
  // We reset pointer-events on body when app becomes visible or when dialog unmounts
  React.useEffect(() => {
    const resetPointerEvents = () => {
      // Check if any dialogs are currently open
      const openDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
      
      // If no dialogs are open, ensure body pointer-events is reset
      if (openDialogs.length === 0) {
        if (document.body.style.pointerEvents === 'none') {
          document.body.style.pointerEvents = '';
        }
      }
      
      // Also reset any stuck pointer-events on dialog elements themselves
      const allDialogs = document.querySelectorAll('[role="dialog"]');
      allDialogs.forEach((dialog) => {
        const htmlDialog = dialog as HTMLElement;
        if (htmlDialog.style.pointerEvents === 'none') {
          htmlDialog.style.pointerEvents = 'auto';
        }
      });
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Delay slightly to let Radix finish its cleanup
        requestAnimationFrame(() => {
          resetPointerEvents();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also reset on unmount in case dialog closes while app is backgrounded
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Delay cleanup to not interfere with Radix's own cleanup
      requestAnimationFrame(() => {
        resetPointerEvents();
      });
    };
  }, []);

  return (
    <DialogPortal container={document.body}>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 bg-gradient-soft border border-blush/20 p-6 shadow-2xl duration-200 rounded-3xl platypi-regular data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full w-8 h-8 bg-warm-gray/10 hover:bg-warm-gray/20 flex items-center justify-center transition-all duration-200 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blush/50 focus:ring-offset-2">
          <X className="h-4 w-4 text-warm-gray" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg platypi-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}

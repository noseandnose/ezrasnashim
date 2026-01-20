import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  gradient?: boolean;
  showCloseX?: boolean;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerContent?: ReactNode;
  maxHeight?: string;
}

export function StandardModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  width = 'md',
  gradient = false,
  showCloseX = true,
  className = '',
  contentClassName = '',
  headerClassName = '',
  footerContent,
  maxHeight = '80vh'
}: StandardModalProps) {
  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  };

  const baseClasses = `
    w-full ${widthClasses[width]} mx-auto rounded-3xl 
    ${gradient ? 'bg-gradient-to-br from-blush to-lavender border-0 shadow-2xl' : 'bg-white border border-blush/20'}
    ${className}
  `;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={`${baseClasses} ${contentClassName}`}
        style={{ maxHeight }}
        data-bridge-container
      >
        <div className="relative">
          {/* Custom Close Button */}
          {showCloseX && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full w-8 h-8 bg-warm-gray/10 hover:bg-warm-gray/20 flex items-center justify-center transition-all duration-200 z-10"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 text-warm-gray" />
            </button>
          )}

          {/* Header */}
          {title && (
            <DialogHeader className={`text-center mb-4 ${headerClassName}`}>
              <DialogTitle className="text-lg platypi-bold text-black">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-warm-gray/70 platypi-regular">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          )}

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
            {children}
          </div>

          {/* Footer */}
          {footerContent && (
            <div className="mt-4 pt-4 border-t border-blush/10">
              {footerContent}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Standard button component for modal footers
export function StandardModalButton({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = ''
}: {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  className?: string;
}) {
  const baseClasses = "w-full py-3 rounded-xl platypi-medium border-0 transition-all duration-300";
  
  const variantClasses = {
    primary: "bg-gradient-feminine text-white hover:scale-105",
    secondary: "bg-sage text-white hover:opacity-90",
    outline: "border border-blush/30 text-blush hover:bg-blush/5"
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Button>
  );
}
import { ChevronRight, Handshake } from "lucide-react";
import { Link } from "wouter";

interface DiscountBarProps {
  className?: string;
}

export default function DiscountBar({ className = "" }: DiscountBarProps) {
  return (
    <div className={className}>
      <Link href="/partners" data-testid="button-partners-bar">
        <div
          className="w-full rounded-xl overflow-hidden border border-blush/20 p-3 text-left transition-colors bg-white/80 hover:bg-white/90 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-feminine">
              <Handshake className="text-white" size={16} />
            </div>
            
            <div className="flex-grow">
              <h3 className="platypi-bold text-sm text-black">Partners</h3>
              <p className="platypi-regular text-xs text-black/70">
                Exclusive Deals and Resources
              </p>
            </div>
            
            <ChevronRight className="text-black/40" size={18} />
          </div>
        </div>
      </Link>
    </div>
  );
}

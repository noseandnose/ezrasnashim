import { Handshake } from "lucide-react";
import { Link } from "wouter";

interface DiscountBarProps {
  className?: string;
}

export default function DiscountBar({ className = "" }: DiscountBarProps) {
  return (
    <div className={className}>
      <Link href="/partners" data-testid="button-partners-bar">
        <div
          className="w-full rounded-xl overflow-hidden border border-blush/20 p-3 flex items-center gap-3 transition-all bg-white/80 hover:bg-white/90 cursor-pointer shadow-sm"
        >
          <div className="p-2.5 rounded-full bg-gradient-feminine shadow-sm flex-shrink-0">
            <Handshake className="text-white" size={18} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="platypi-bold text-sm text-black">Partners</h3>
            <p className="platypi-regular text-xs text-black/70">
              Exclusive Deals and Resources
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

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
          className="w-full rounded-xl overflow-hidden border border-blush/20 p-4 transition-all bg-white/80 hover:bg-white/90 cursor-pointer shadow-sm"
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-2.5 rounded-full bg-gradient-feminine shadow-sm">
              <Handshake className="text-white" size={20} />
            </div>
            
            <div className="text-center">
              <h3 className="platypi-bold text-base text-black">Partners</h3>
              <p className="platypi-regular text-xs text-black/70">
                Exclusive Deals and Resources
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

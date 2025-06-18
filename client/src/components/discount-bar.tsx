import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

interface DiscountPromotion {
  id: number;
  title: string;
  subtitle: string;
  logoUrl: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

interface DiscountBarProps {
  className?: string;
}

export default function DiscountBar({ className = "" }: DiscountBarProps) {
  const { data: promotion, isLoading } = useQuery<DiscountPromotion | null>({
    queryKey: ['/api/discount-promotions/active'],
  });

  if (isLoading || !promotion) {
    return null;
  }

  const handleClick = () => {
    window.open(promotion.linkUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div 
      className={`bg-gradient-to-r from-rose-300 via-rose-200 to-purple-200 
                  border border-rose-200 rounded-lg p-3 cursor-pointer 
                  hover:shadow-md transition-shadow duration-200 ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={promotion.logoUrl} 
            alt={promotion.title}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-800 leading-tight">
              {promotion.title}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {promotion.subtitle}
            </p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2" />
      </div>
    </div>
  );
}
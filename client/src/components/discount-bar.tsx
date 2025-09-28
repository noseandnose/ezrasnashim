import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { useLocationStore } from "@/hooks/use-jewish-times";
import axiosClient from "@/lib/axiosClient";

interface DiscountPromotion {
  id: number;
  title: string;
  subtitle: string;
  logoUrl: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetLocation: string;
  createdAt: string;
}

interface DiscountBarProps {
  className?: string;
}

export default function DiscountBar({ className = "" }: DiscountBarProps) {
  const { coordinates } = useLocationStore();

  const {
    data: promotions,
    isLoading,
  } = useQuery<DiscountPromotion[]>({
    queryKey: [
      "/api/discount-promotions/active",
      coordinates?.lat,
      coordinates?.lng,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (coordinates?.lat) params.set("lat", coordinates.lat.toString());
      if (coordinates?.lng) params.set("lng", coordinates.lng.toString());

      const response = await axiosClient.get(
        `/api/discount-promotions/active?${params.toString()}`
      );
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  if (isLoading) {
    return null;
  }

  if (!promotions || promotions.length === 0) {
    return null;
  }

  const handleClick = (linkUrl: string) => {
    window.open(linkUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {promotions.map((promotion) => (
        <div
          key={promotion.id}
          className="bg-gradient-soft border border-blush/10 rounded-3xl p-3 cursor-pointer 
                     hover:shadow-lg transition-shadow duration-200"
          onClick={() => handleClick(promotion.linkUrl)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={promotion.logoUrl}
                alt={promotion.title}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div className="flex-1">
                <h3 className="text-sm platypi-semibold text-gray-800 leading-tight">
                  {promotion.title}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">{promotion.subtitle}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useLocationStore } from "@/hooks/use-jewish-times";
import axiosClient from "@/lib/axiosClient";

interface Partner {
  id: number;
  title: string;
  subtitle: string;
  logoUrl: string;
  linkUrl: string;
  type: string;
  targetLocation: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

type TabType = "deals" | "resources";

export default function Partners() {
  const [activeTab, setActiveTab] = useState<TabType>("deals");
  const { coordinates } = useLocationStore();

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/discount-promotions/active", coordinates?.lat, coordinates?.lng],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (coordinates?.lat) params.set("lat", coordinates.lat.toString());
      if (coordinates?.lng) params.set("lng", coordinates.lng.toString());
      const response = await axiosClient.get(`/api/discount-promotions/active?${params.toString()}`);
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const filteredPartners = partners?.filter(p => p.type === (activeTab === "deals" ? "deal" : "resource")) || [];

  const handleClick = (linkUrl: string) => {
    window.open(linkUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div 
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-blush/10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center px-4 py-3">
          <Link href="/" className="p-2 -ml-2 touch-manipulation" data-testid="button-partners-back">
            <ArrowLeft className="w-6 h-6 text-black" />
          </Link>
          <h1 className="flex-1 text-center platypi-bold text-xl text-black pr-8">Partners</h1>
        </div>
        
        <div className="flex px-4 pb-3 gap-2">
          <button
            onClick={() => setActiveTab("deals")}
            className={`flex-1 py-2.5 rounded-full platypi-semibold text-sm transition-all ${
              activeTab === "deals"
                ? "bg-blush text-white shadow-md"
                : "bg-white/80 text-black/60 border border-blush/20"
            }`}
            data-testid="tab-deals"
          >
            Deals
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`flex-1 py-2.5 rounded-full platypi-semibold text-sm transition-all ${
              activeTab === "resources"
                ? "bg-blush text-white shadow-md"
                : "bg-white/80 text-black/60 border border-blush/20"
            }`}
            data-testid="tab-resources"
          >
            Resources
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 pb-20">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-blush border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-black/60 platypi-medium">
              No {activeTab} available at the moment
            </p>
          </div>
        ) : (
          filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="bg-white rounded-2xl p-4 cursor-pointer shadow-sm border border-blush/10
                         hover:shadow-md transition-shadow duration-200"
              onClick={() => handleClick(partner.linkUrl)}
              data-testid={`partner-card-${partner.id}`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={partner.logoUrl}
                  alt={partner.title}
                  className="w-14 h-14 min-w-14 flex-shrink-0 rounded-xl object-cover border-2 border-blush/10 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base platypi-bold text-black leading-tight truncate">
                    {partner.title}
                  </h3>
                  <p className="text-sm text-black/60 mt-1 line-clamp-2">
                    {partner.subtitle}
                  </p>
                </div>
                <ExternalLink className="w-5 h-5 text-black/40 flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useLocationStore } from "@/hooks/use-jewish-times";
import axiosClient from "@/lib/axiosClient";
import { TapDiv } from "@/components/ui/tap-button";

interface Partner {
  id: number;
  title: string;
  subtitle: string;
  logoUrl: string;
  linkUrl: string;
  type: string;
  targetLocation: string;
  isActive: boolean;
  createdAt: string;
}

type TabType = "deals" | "resources";

export default function Partners() {
  const [activeTab, setActiveTab] = useState<TabType>("deals");
  const [loadingPartnerId, setLoadingPartnerId] = useState<number | null>(null);
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

  const handleClick = (partnerId: number, linkUrl: string) => {
    setLoadingPartnerId(partnerId);
    window.open(linkUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => setLoadingPartnerId(null), 1000);
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
        
        <div className="flex rounded-2xl bg-blush/10 p-1 border border-blush/20 mx-4 mb-3">
          <button
            onClick={() => setActiveTab("deals")}
            className={`flex-1 py-2.5 px-2 rounded-xl text-center transition-all duration-200 ${
              activeTab === "deals"
                ? "bg-gradient-feminine text-white shadow-lg"
                : "text-black/70 hover:bg-blush/10"
            }`}
            data-testid="tab-deals"
          >
            <span className="platypi-semibold text-xs leading-tight block">Deals</span>
          </button>
          <button
            onClick={() => setActiveTab("resources")}
            className={`flex-1 py-2.5 px-2 rounded-xl text-center transition-all duration-200 ${
              activeTab === "resources"
                ? "bg-gradient-feminine text-white shadow-lg"
                : "text-black/70 hover:bg-blush/10"
            }`}
            data-testid="tab-resources"
          >
            <span className="platypi-semibold text-xs leading-tight block">Resources</span>
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
          filteredPartners.map((partner) => {
            const isLoading = loadingPartnerId === partner.id;
            return (
              <TapDiv
                key={partner.id}
                className={`bg-white rounded-2xl p-4 cursor-pointer shadow-sm border border-blush/10
                           transition-all duration-200 active:scale-[0.98] ${
                             isLoading ? 'opacity-70' : 'hover:shadow-md'
                           }`}
                onTap={() => !isLoading && handleClick(partner.id, partner.linkUrl)}
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
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 text-blush flex-shrink-0 animate-spin" />
                  ) : (
                    <ExternalLink className="w-5 h-5 text-black/40 flex-shrink-0" />
                  )}
                </div>
              </TapDiv>
            );
          })
        )}
      </div>
    </div>
  );
}

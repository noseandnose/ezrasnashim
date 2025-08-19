import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { DollarSign, Heart } from "lucide-react";
import { useTrackModalComplete } from "@/hooks/use-analytics";

interface Campaign {
  id: number;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  endDate: string;
}

export default function DonationModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("1");
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const { trackModalComplete } = useTrackModalComplete();

  // Fetch active campaign data
  const { data: campaign } = useQuery<Campaign>({
    queryKey: ['/api/campaigns/active'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/active`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 60 minutes
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (donationAmount: number) => {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: donationAmount
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Don't track completion or mark task complete here - only after successful payment
      closeModal();
      
      if (data.clientSecret) {
        // Navigate to donation page with amount and type
        const params = new URLSearchParams({
          amount: (isCustom ? customAmount : amount),
          type: "General Donation",
          sponsor: "",
          dedication: ""
        });
        setLocation(`/donate?${params.toString()}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Payment Error",
        description: "Unable to process donation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDonate = () => {
    const donationAmount = isCustom ? parseFloat(customAmount) : parseFloat(amount);
    if (donationAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }
    createPaymentMutation.mutate(donationAmount);
  };

  const handleAmountSelect = (selectedAmount: string) => {
    if (selectedAmount === "custom") {
      setIsCustom(true);
      setAmount("custom");
    } else {
      setIsCustom(false);
      setAmount(selectedAmount);
    }
  };

  const quickAmounts = [
    { value: "1", label: "$1" },
    { value: "18", label: "$18" },
    { value: "180", label: "$180" },
    { value: "1800", label: "$1800" },
    { value: "custom", label: "Custom" }
  ];

  return (
    <Dialog open={activeModal === 'donate'} onOpenChange={(open) => {
      if (!open) {
        // User clicked X or pressed Escape - don't track completion
        closeModal();
      }
    }}>
      <DialogContent className="w-full max-w-sm max-h-[80vh] overflow-y-auto gradient-soft-glow rounded-3xl p-6 platypi-regular border border-blush/20">
        <div className="flex items-center justify-center mb-3 relative">
          <DialogTitle className="text-lg platypi-bold text-black">Put a Coin in Tzedaka</DialogTitle>
        </div>
        <p className="text-xs text-warm-gray/70 platypi-regular text-center mb-4">
          Donations go towards Woman in need and Torah Causes
        </p>
        
        {/* Apple Pay development notice */}
        {(() => {
          const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
          
          if (isLocalhost) {
            return (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  💡 <strong>Note:</strong> Apple Pay will be available in production (requires HTTPS)
                </p>
              </div>
            );
          }
          return null;
        })()}

        <div className="space-y-3 text-sm text-gray-700">
          {/* Amount Selection Buttons */}
          <div>
            <p className="text-sm platypi-medium text-warm-gray mb-2">Select Amount</p>
            <div className="grid grid-cols-5 gap-1">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount.value}
                  onClick={() => handleAmountSelect(quickAmount.value)}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    amount === quickAmount.value
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  {quickAmount.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input - Only show when Custom is selected */}
          {isCustom && (
            <div>
              <label className="text-sm platypi-medium text-warm-gray mb-2 block">Enter Custom Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10 platypi-semibold">$</span>
                <Input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="pl-10 rounded-xl border-blush/30 focus:border-blush bg-white"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Donation Button */}
          <div className="mt-4">
            <Button
              onClick={handleDonate}
              disabled={createPaymentMutation.isPending || (isCustom ? !customAmount || parseFloat(customAmount) <= 0 : !amount || parseFloat(amount) <= 0)}
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
            >
              {createPaymentMutation.isPending ? 'Processing...' : `Donate $${isCustom ? customAmount : amount}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
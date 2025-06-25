import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { useModalStore, useDailyCompletionStore } from "../../../lib/types";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "../../../lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import { DollarSign, Heart } from "lucide-react";

export default function DonationModal() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { toast } = useToast();
  const [amount, setAmount] = useState("1");

  const createPaymentMutation = useMutation({
    mutationFn: async (donationAmount: number) => {
      const response = await apiRequest('POST', '/api/create-payment-intent', {
        amount: donationAmount
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Complete tzedaka task when donation is initiated
      completeTask('tzedaka');
      closeModal();
      
      // Check if all tasks are completed and show congratulations
      setTimeout(() => {
        if (checkAndShowCongratulations()) {
          openModal('congratulations');
        }
      }, 100);
      
      if (data.clientSecret) {
        // Redirect to Stripe checkout or handle payment flow
        window.location.href = `/checkout?payment_intent=${data.clientSecret}`;
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
    const donationAmount = parseFloat(amount);
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

  const quickAmounts = [1, 18, 54, 180, 1800];

  return (
    <Dialog open={activeModal === 'donate'} onOpenChange={() => closeModal()}>
      <DialogContent className="w-full max-w-sm max-h-[80vh] overflow-y-auto gradient-soft-glow rounded-3xl p-6 font-sans border border-blush/20">
        <DialogHeader className="text-center mb-4">
          <DialogTitle className="text-lg font-serif font-semibold mb-2 text-warm-gray">Support Causes</DialogTitle>
          <p className="text-xs text-warm-gray/70 font-sans">Support our community with your generous contribution</p>
        </DialogHeader>

        <div className="space-y-3 text-sm text-gray-700">
          {/* Quick Amount Buttons */}
          <div>
            <p className="text-sm font-medium text-warm-gray mb-2">Quick Amount</p>
            <div className="grid grid-cols-5 gap-1">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className={`p-2 rounded-xl text-xs font-medium transition-all ${
                    amount === quickAmount.toString()
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  ${quickAmount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="text-sm font-medium text-warm-gray mb-2 block">Custom Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10 font-semibold">$</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="pl-10 rounded-xl border-blush/30 focus:border-blush bg-white"
                min="1"
                step="0.01"
              />
            </div>
          </div>

          {/* Donation Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleDonate}
              disabled={createPaymentMutation.isPending || !amount || parseFloat(amount) <= 0}
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0 hover:shadow-lg transition-all duration-300"
            >
              {createPaymentMutation.isPending ? 'Processing...' : `Donate $${amount}`}
            </Button>
            
            <Button
              onClick={() => closeModal()}
              variant="outline"
              className="w-full rounded-xl border-blush/20 text-warm-gray hover:bg-white/90 transition-all duration-300 bg-white/70 backdrop-blur-sm border"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
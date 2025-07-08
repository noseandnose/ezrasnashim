import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModalStore, useDailyCompletionStore } from "@/lib/types";
import { useState } from "react";
import { Heart, BookOpen, Baby, Shield, DollarSign } from "lucide-react";
import { useLocation } from "wouter";
import { useTrackModalComplete } from "@/hooks/use-analytics";

export default function TzedakaModals() {
  const { activeModal, closeModal, openModal } = useModalStore();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const [, setLocation] = useLocation();
  const [donationAmount, setDonationAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [dedicationText, setDedicationText] = useState("");
  const [torahPortion, setTorahPortion] = useState("");
  const { trackModalComplete } = useTrackModalComplete();

  const getDonationAmount = () => {
    if (donationAmount === "custom") {
      return parseFloat(customAmount) || 0;
    }
    return parseFloat(donationAmount) || 0;
  };

  const getTorahAmount = () => {
    const amounts: { [key: string]: number } = {
      letter: 1,
      pasuk: 18,
      perek: 54,
      parsha: 360
    };
    return amounts[torahPortion] || 0;
  };

  const handleDonation = () => {
    let amount = 0;
    let typeDescription = "";

    switch (activeModal) {
      case "sponsor-day":
        amount = 180;
        typeDescription = "Sponsor a Day of Ezras Nashim";
        break;
      case "torah-dedication":
        amount = getTorahAmount();
        typeDescription = `Torah Dedication - ${torahPortion}`;
        break;
      case "infertility-support":
        amount = getDonationAmount();
        typeDescription = "Women's Infertility Support";
        break;
      case "abuse-support":
        amount = getDonationAmount();
        typeDescription = "Women's Abuse Support";
        break;
    }

    if (amount > 0) {
      // Track modal completion
      if (activeModal) {
        trackModalComplete(activeModal);
      }
      
      // Complete tzedaka task when donation is initiated
      completeTask('tzedaka');
      
      const params = new URLSearchParams({
        amount: amount.toString(),
        type: typeDescription,
        sponsor: donorName,
        dedication: dedicationText
      });

      closeModal();
      
      // Check if all tasks are completed and show congratulations
      setTimeout(() => {
        if (checkAndShowCongratulations()) {
          openModal('congratulations');
        }
      }, 100);
      
      setLocation(`/donate?${params.toString()}`);
    }
  };

  return (
    <>
      {/* Sponsor a Day Modal */}
      <Dialog open={activeModal === 'sponsor-day'} onOpenChange={() => closeModal()}>
        <DialogContent aria-describedby="sponsor-day-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Sponsor a Day</DialogTitle>
          </div>
          <p className="text-xs text-warm-gray/70 font-sans text-center mb-4">Dedicate all mitzvot done on the app for one day - $180</p>
          <div id="sponsor-day-description" className="sr-only">Daily sponsorship and dedication options</div>
          
          <div className="space-y-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-blush/20">
              <div className="text-center">
                <div className="font-serif text-2xl text-warm-gray mb-1">$180</div>
                <div className="font-sans text-xs text-warm-gray/70">Fixed sponsorship amount</div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-warm-gray block mb-2">Sponsored By</label>
              <Input 
                placeholder="Enter your name or family name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-warm-gray block mb-2">In Honor or Memory Of</label>
              <Textarea
                placeholder="L'ilui Nishmas... or L'kavod..."
                value={dedicationText}
                onChange={(e) => setDedicationText(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm min-h-[80px]"
              />
            </div>



            <div className="space-y-2">
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0 hover:shadow-lg transition-all duration-300"
              >
                Sponsor for $180
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

      {/* Torah Dedication Modal */}
      <Dialog open={activeModal === 'torah-dedication'} onOpenChange={() => closeModal()}>
        <DialogContent aria-describedby="torah-dedication-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Torah Dedication</DialogTitle>
          </div>
          <p className="text-sm text-gray-600 text-center mb-4">Dedicate a Letter, Pasuk, Perek or Parsha</p>
          <div id="torah-dedication-description" className="sr-only">Torah learning sponsorship and dedication options</div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Torah Portion</label>
              <Select value={torahPortion} onValueChange={setTorahPortion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dedication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="letter">Letter - $1</SelectItem>
                  <SelectItem value="pasuk">Pasuk - $18</SelectItem>
                  <SelectItem value="perek">Perek - $54</SelectItem>
                  <SelectItem value="parsha">Parsha - $360</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Dedication Name</label>
              <Input 
                placeholder="L'ilui Nishmas..."
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Special Message (Optional)</label>
              <Textarea 
                placeholder="In loving memory of..."
                value={dedicationText}
                onChange={(e) => setDedicationText(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0 hover:shadow-lg transition-all duration-300"
                disabled={!torahPortion}
              >
                Continue to Payment
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

      {/* Infertility Support Modal */}
      <Dialog open={activeModal === 'infertility-support'} onOpenChange={() => closeModal()}>
        <DialogContent aria-describedby="infertility-support-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Infertility Support</DialogTitle>
          </div>
          <p className="text-sm text-gray-600 text-center mb-4">Support couples struggling with fertility challenges</p>
          <div id="infertility-support-description" className="sr-only">Fertility support and assistance for couples</div>
          
          <div className="space-y-4">
            <div className="bg-rose-50 p-4 rounded-xl text-sm text-gray-700">
              <p className="mb-2">Your donation helps provide:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Financial assistance for fertility treatments</li>
                <li>Emotional support and counseling</li>
                <li>Educational resources and workshops</li>
                <li>Community support groups</li>
              </ul>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Donation Amount</label>
              <Select value={donationAmount} onValueChange={setDonationAmount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18">$18 - Chai</SelectItem>
                  <SelectItem value="36">$36 - Double Chai</SelectItem>
                  <SelectItem value="72">$72 - Quadruple Chai</SelectItem>
                  <SelectItem value="180">$180 - Ten Chai</SelectItem>
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
              {donationAmount === "custom" && (
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10 font-semibold">$</span>
                  <Input 
                    placeholder="Enter amount" 
                    className="pl-10 bg-white"
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => closeModal()} 
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleDonation()}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
                disabled={!donationAmount}
              >
                Donate Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Abuse Support Modal */}
      <Dialog open={activeModal === 'abuse-support'} onOpenChange={() => closeModal()}>
        <DialogContent>
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg font-serif font-bold text-black">Abuse Support</DialogTitle>
          </div>
          <p className="text-sm text-gray-600 text-center mb-4">Support women escaping abusive situations</p>
          
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-xl text-sm text-gray-700">
              <p className="mb-2">Your donation provides:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Emergency shelter and safe housing</li>
                <li>Legal assistance and advocacy</li>
                <li>Counseling and therapy services</li>
                <li>Financial assistance for basic needs</li>
                <li>Job training and placement support</li>
              </ul>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Donation Amount</label>
              <Select value={donationAmount} onValueChange={setDonationAmount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">$25 - Basic Support</SelectItem>
                  <SelectItem value="50">$50 - Emergency Aid</SelectItem>
                  <SelectItem value="100">$100 - Safe Haven</SelectItem>
                  <SelectItem value="250">$250 - New Beginning</SelectItem>
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
              {donationAmount === "custom" && (
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10 font-semibold">$</span>
                  <Input 
                    placeholder="Enter amount" 
                    className="pl-10 bg-white"
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0 hover:shadow-lg transition-all duration-300"
                disabled={!donationAmount}
              >
                Donate Now
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
    </>
  );
}
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
  const [sponsorMessage, setSponsorMessage] = useState("");
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
      case "womens-causes":
        amount = getDonationAmount();
        typeDescription = "Women's Causes Support";
        break;
      case "support-torah":
        amount = getDonationAmount();
        typeDescription = "Torah Learning Support";
        break;
      case "donate":
        amount = getDonationAmount();
        typeDescription = "General Donation";
        break;
    }

    if (amount > 0) {
      // Don't track completion here - only after successful payment
      // Completion will be tracked in the donate page after payment succeeds
      
      const params = new URLSearchParams({
        amount: amount.toString(),
        type: typeDescription,
        sponsor: donorName,
        dedication: dedicationText,
        message: sponsorMessage
      });

      closeModal();
      setLocation(`/donate?${params.toString()}`);
    }
  };

  return (
    <>
      {/* Sponsor a Day Modal */}
      <Dialog open={activeModal === 'sponsor-day'} onOpenChange={(open) => {
        if (!open) {
          // User clicked X or pressed Escape - don't track completion
          closeModal();
        }
      }}>
        <DialogContent aria-describedby="sponsor-day-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Sponsor a Day</DialogTitle>
          </div>
          <p className="text-xs text-warm-gray/70 platypi-regular text-center mb-4">Dedicate all mitzvot done on the app for one day - $180</p>
          <div id="sponsor-day-description" className="sr-only">Daily sponsorship and dedication options</div>
          
          <div className="space-y-4">
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-blush/20">
              <div className="text-center">
                <div className="platypi-regular text-2xl text-warm-gray mb-1">$180</div>
                <div className="platypi-regular text-xs text-warm-gray/70">Fixed sponsorship amount</div>
              </div>
            </div>

            <div>
              <label className="text-sm platypi-medium text-warm-gray block mb-2">Sponsored By *</label>
              <Input 
                placeholder="Enter your name or family name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm"
                required
              />
            </div>

            <div>
              <label className="text-sm platypi-medium text-warm-gray block mb-2">In Honor or Memory Of *</label>
              <Input
                placeholder="L'ilui Nishmas... or L'kavod..."
                value={dedicationText}
                onChange={(e) => setDedicationText(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm"
                required
              />
            </div>

            <div>
              <label className="text-sm platypi-medium text-warm-gray block mb-2">Write a short message about the person *</label>
              <Textarea
                placeholder="A person who always loved torah..."
                value={sponsorMessage}
                onChange={(e) => setSponsorMessage(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm min-h-[80px]"
                required
              />
            </div>



            <div>
              <Button 
                onClick={() => handleDonation()}
                disabled={!donorName.trim() || !dedicationText.trim() || !sponsorMessage.trim()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sponsor for $180
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Torah Dedication Modal */}
      <Dialog open={activeModal === 'torah-dedication'} onOpenChange={(open) => {
        if (!open) {
          // User clicked X or pressed Escape - don't track completion
          closeModal();
        }
      }}>
        <DialogContent aria-describedby="torah-dedication-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Torah Dedication</DialogTitle>
          </div>
          <p className="text-sm platypi-regular text-gray-600 text-center mb-4">Dedicate a Letter, Pasuk, Perek or Parsha</p>
          <div id="torah-dedication-description" className="sr-only">Torah learning sponsorship and dedication options</div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm platypi-medium block mb-2">Torah Portion</label>
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
              <label className="text-sm platypi-medium block mb-2">Dedication Name</label>
              <Input 
                placeholder="L'ilui Nishmas..."
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm platypi-medium block mb-2">Special Message (Optional)</label>
              <Textarea 
                placeholder="In loving memory of..."
                value={dedicationText}
                onChange={(e) => setDedicationText(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
                disabled={!torahPortion}
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Infertility Support Modal */}
      <Dialog open={activeModal === 'infertility-support'} onOpenChange={(open) => {
        if (!open) {
          // User clicked X or pressed Escape - don't track completion
          closeModal();
        }
      }}>
        <DialogContent aria-describedby="infertility-support-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Infertility Support</DialogTitle>
          </div>
          <p className="text-sm platypi-regular text-gray-600 text-center mb-4">Support couples struggling with fertility challenges</p>
          <div id="infertility-support-description" className="sr-only">Fertility support and assistance for couples</div>
          
          <div className="space-y-4">
            <div className="bg-rose-50 p-4 rounded-xl text-sm platypi-regular text-gray-700">
              <p className="mb-2 platypi-regular">Your donation helps provide:</p>
              <ul className="list-disc list-inside space-y-1 text-xs platypi-regular">
                <li>Financial assistance for fertility treatments</li>
                <li>Emotional support and counseling</li>
                <li>Educational resources and workshops</li>
                <li>Community support groups</li>
              </ul>
            </div>

            <div>
              <label className="text-sm platypi-medium block mb-2">Donation Amount</label>
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
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10 platypi-semibold">$</span>
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

            <div>
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
                disabled={!donationAmount}
              >
                Donate Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Abuse Support Modal */}
      <Dialog open={activeModal === 'abuse-support'} onOpenChange={(open) => {
        if (!open) {
          // User clicked X or pressed Escape - don't track completion
          closeModal();
        }
      }}>
        <DialogContent>
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Abuse Support</DialogTitle>
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
              <label className="text-sm platypi-medium block mb-2">Donation Amount</label>
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
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10 platypi-semibold">$</span>
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

            <div>
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
                disabled={!donationAmount}
              >
                Donate Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Women's Causes Modal */}
      <Dialog open={activeModal === 'womens-causes'} onOpenChange={(open) => {
        if (!open) {
          // User clicked X or pressed Escape - don't track completion
          closeModal();
        }
      }}>
        <DialogContent aria-describedby="womens-causes-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Support Women's Causes</DialogTitle>
          </div>
          <p className="text-sm text-gray-600 text-center mb-4">Support fertility assistance and abuse prevention</p>
          <div id="womens-causes-description" className="sr-only">Support various women's causes including fertility and abuse prevention</div>
          
          <div className="space-y-4">
            <div className="bg-rose-50 p-4 rounded-xl text-sm text-gray-700">
              <p className="mb-2">Your donation supports:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Fertility treatments and counseling</li>
                <li>Abuse prevention and safe housing</li>
                <li>Legal assistance and advocacy</li>
                <li>Educational workshops and support groups</li>
                <li>Emergency financial assistance</li>
              </ul>
            </div>

            <div>
              <label className="text-sm platypi-medium block mb-2">Donation Amount</label>
              <Select value={donationAmount} onValueChange={setDonationAmount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="36">$36 - Basic Support</SelectItem>
                  <SelectItem value="72">$72 - Extended Help</SelectItem>
                  <SelectItem value="180">$180 - Comprehensive Aid</SelectItem>
                  <SelectItem value="360">$360 - Major Impact</SelectItem>
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
              {donationAmount === "custom" && (
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10 platypi-semibold">$</span>
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

            <div>
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
                disabled={!donationAmount}
              >
                Donate Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Torah Modal */}
      <Dialog open={activeModal === 'support-torah'} onOpenChange={(open) => {
        if (!open) {
          // User clicked X or pressed Escape - don't track completion
          closeModal();
        }
      }}>
        <DialogContent aria-describedby="support-torah-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Support Torah</DialogTitle>
          </div>
          <p className="text-sm text-gray-600 text-center mb-4">Support Torah learning and education</p>
          <div id="support-torah-description" className="sr-only">Support Torah learning, kollels, and Jewish education</div>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl text-sm text-gray-700">
              <p className="mb-2">Your donation supports:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Kollel scholars and Torah study</li>
                <li>Educational programs and resources</li>
                <li>Seforim and Torah books</li>
                <li>Community learning initiatives</li>
                <li>Study halls and learning spaces</li>
              </ul>
            </div>

            <div>
              <label className="text-sm platypi-medium block mb-2">Donation Amount</label>
              <Select value={donationAmount} onValueChange={setDonationAmount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18">$18 - Chai</SelectItem>
                  <SelectItem value="54">$54 - Learning</SelectItem>
                  <SelectItem value="108">$108 - Scholarship</SelectItem>
                  <SelectItem value="270">$270 - Monthly Support</SelectItem>
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
              {donationAmount === "custom" && (
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10 platypi-semibold">$</span>
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

            <div>
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
                disabled={!donationAmount}
              >
                Donate Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* General Donation Modal - "Put a Coin in Tzedaka" */}
      <Dialog open={activeModal === 'donate'} onOpenChange={(open) => {
        if (!open) {
          // User clicked X or pressed Escape - don't track completion
          closeModal();
        }
      }}>
        <DialogContent aria-describedby="donate-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Put a Coin in Tzedaka</DialogTitle>
          </div>
          <p className="text-sm platypi-regular text-gray-600 text-center mb-4">Donations go towards Woman in need and Torah Causes</p>
          <div id="donate-description" className="sr-only">General tzedaka donations for women in need and Torah causes</div>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-rose-50 to-purple-50 p-4 rounded-xl text-sm text-gray-700">
              <p className="mb-2 platypi-medium">Your donation supports:</p>
              <ul className="list-disc list-inside space-y-1 text-xs platypi-regular">
                <li>Women and families in financial need</li>
                <li>Torah learning and educational programs</li>
                <li>Community support initiatives</li>
                <li>Emergency assistance for Jewish families</li>
              </ul>
            </div>

            <div>
              <label className="text-sm platypi-medium block mb-2">Donation Amount</label>
              <Select value={donationAmount} onValueChange={setDonationAmount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">$1 - Every coin counts</SelectItem>
                  <SelectItem value="5">$5 - Small blessing</SelectItem>
                  <SelectItem value="18">$18 - Chai</SelectItem>
                  <SelectItem value="36">$36 - Double Chai</SelectItem>
                  <SelectItem value="72">$72 - Quadruple Chai</SelectItem>
                  <SelectItem value="180">$180 - Ten Chai</SelectItem>
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
              {donationAmount === "custom" && (
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-800 z-10 platypi-semibold">$</span>
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

            <div>
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
                disabled={!donationAmount}
              >
                Donate Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
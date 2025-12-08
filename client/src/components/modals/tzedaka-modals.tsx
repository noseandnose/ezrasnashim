import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModalStore } from "@/lib/types";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Campaign } from "@shared/schema";

// Load Stripe outside of component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function TzedakaModals() {
  const { activeModal, closeModal } = useModalStore();
  const { toast } = useToast();

  const [donationAmount, setDonationAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [dedicationText, setDedicationText] = useState("");
  const [sponsorMessage, setSponsorMessage] = useState("");
  const [torahPortion, setTorahPortion] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset form when modals open
  useEffect(() => {
    setIsProcessing(false); // Always reset processing state
    if (activeModal === 'wedding-campaign') {
      setDonationAmount("1");
      setDonorEmail("");
    } else if (activeModal === 'sponsor-day' || activeModal === 'donate') {
      setDonorEmail("");
      setDonationAmount("");
      setCustomAmount("");
      setDonorName("");
      setDedicationText("");
      setSponsorMessage("");
    }
  }, [activeModal]);

  // Fetch active campaign data for the wedding campaign modal
  const { data: activeCampaign, isLoading: isCampaignLoading } = useQuery<Campaign>({
    queryKey: ['/api/campaigns/active'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/campaigns/active`);
      if (!response.ok) return null;
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000 // 60 minutes
  });

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

  const handleDonation = async () => {
    let amount = 0;
    let typeDescription = "";
    let buttonType = ""; // New field for Stripe metadata

    switch (activeModal) {
      case "sponsor-day":
        amount = 180;
        typeDescription = "Sponsor a Day of Ezras Nashim";
        buttonType = "sponsor_a_day";
        break;
      case "torah-dedication":
        amount = getTorahAmount();
        typeDescription = `Torah Dedication - ${torahPortion}`;
        buttonType = "put_a_coin"; // Torah dedication falls under general donation
        break;
      case "infertility-support":
        amount = getDonationAmount();
        typeDescription = "Women's Infertility Support";
        buttonType = "put_a_coin"; // General donation category
        break;
      case "abuse-support":
        amount = getDonationAmount();
        typeDescription = "Women's Abuse Support";
        buttonType = "put_a_coin"; // General donation category
        break;
      case "womens-causes":
        amount = getDonationAmount();
        typeDescription = "Women's Causes Support";
        buttonType = "put_a_coin"; // General donation category
        break;
      case "support-torah":
        amount = getDonationAmount();
        typeDescription = "Torah Learning Support";
        buttonType = "put_a_coin"; // General donation category
        break;
      case "donate":
        amount = getDonationAmount();
        typeDescription = "General Donation";
        buttonType = "put_a_coin";
        break;
      case "wedding-campaign":
        amount = getDonationAmount();
        typeDescription = activeCampaign?.title || "Active Campaign Support";
        buttonType = "active_campaign";
        break;
    }

    if (amount > 0) {
      setIsProcessing(true);
      
      try {
        // Build return URL with all donation metadata
        const returnUrl = `${window.location.origin}/donate?success=true&amount=${amount}&type=${encodeURIComponent(typeDescription)}&buttonType=${buttonType}&sponsor=${encodeURIComponent(donorName)}&dedication=${encodeURIComponent(dedicationText)}&message=${encodeURIComponent(sponsorMessage)}&email=${encodeURIComponent(donorEmail)}`;
        
        // Create Stripe session directly from modal
        const response = await apiRequest('POST', '/api/create-session-checkout', {
          amount,
          donationType: typeDescription,
          metadata: {
            buttonType,
            sponsorName: donorName,
            dedication: dedicationText,
            message: sponsorMessage,
            email: donorEmail,
            timestamp: new Date().toISOString()
          },
          returnUrl
        });
        
        const sessionId = response.data.sessionId;
        
        // Store session info for completion tracking
        localStorage.setItem('pending_donation', JSON.stringify({
          sessionId: sessionId,
          buttonType: buttonType,
          amount: amount,
          timestamp: new Date().toISOString()
        }));
        localStorage.setItem('has_been_redirected_to_stripe', 'true');
        
        // Redirect to Stripe checkout
        const stripe = await stripePromise;
        if (stripe) {
          closeModal();
          await stripe.redirectToCheckout({ sessionId });
        }
      } catch (error) {
        console.error('Failed to create checkout session:', error);
        toast({
          title: "Error",
          description: "Unable to process donation. Please try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    }
  }

  // Email validation helper
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
        <DialogContent aria-describedby="sponsor-day-description" onOpenAutoFocus={(e) => e.preventDefault()}>
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Sponsor a Day</DialogTitle>
          </div>
          <p className="text-xs text-warm-gray/70 platypi-regular text-center mb-4">Dedicate all Mitzvas done on the app for one day - $180</p>
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
                autoFocus={false}
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
                autoFocus={false}
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
                autoFocus={false}
                required
              />
            </div>

            <div>
              <label className="text-sm platypi-medium text-warm-gray block mb-2">Email Address *</label>
              <Input 
                placeholder="your@email.com"
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm"
                autoFocus={false}
                required
              />
              <p className="text-xs text-warm-gray/60 mt-1 platypi-regular">For your tax receipt</p>
            </div>

            <div>
              <Button 
                onClick={() => handleDonation()}
                disabled={isProcessing || !donorName.trim() || !dedicationText.trim() || !sponsorMessage.trim() || !isValidEmail(donorEmail)}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Sponsor for $180"
                )}
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
                disabled={isProcessing || !torahPortion}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Continue to Payment"
                )}
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
        <DialogContent aria-describedby="abuse-support-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Abuse Support</DialogTitle>
          </div>
          <p id="abuse-support-description" className="text-sm text-gray-600 text-center mb-4">Support women escaping abusive situations</p>
          
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

      {/* Wedding Campaign Modal - "Sponsor a Wedding for a Couple" - Restored Original Style */}
      <Dialog open={activeModal === 'wedding-campaign'} onOpenChange={(open) => {
        if (!open) {
          // User clicked X or pressed Escape - don't track completion
          closeModal();
        }
      }}>
        <DialogContent aria-describedby="wedding-campaign-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">
              {isCampaignLoading ? "Loading..." : activeCampaign?.title || "Active Campaign"}
            </DialogTitle>
          </div>
          <p className="text-sm platypi-regular text-gray-600 text-center mb-4">
            {isCampaignLoading ? "Loading campaign details..." : activeCampaign?.description || "Support our active campaign"}
          </p>
          <div id="wedding-campaign-description" className="sr-only">
            {activeCampaign?.description || "Active campaign sponsorship"}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm platypi-medium block mb-2">Select Amount</label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={() => setDonationAmount("1")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "1"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  $1
                </button>
                <button
                  onClick={() => setDonationAmount("18")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "18"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  $18
                </button>
                <button
                  onClick={() => setDonationAmount("180")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "180"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  $180
                </button>
                <button
                  onClick={() => setDonationAmount("1800")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "1800"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  $1800
                </button>
                <button
                  onClick={() => setDonationAmount("custom")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "custom"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  Custom
                </button>
              </div>
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
              <label className="text-sm platypi-medium text-warm-gray block mb-2">Email Address *</label>
              <Input 
                placeholder="your@email.com"
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm"
                required
              />
              <p className="text-xs text-warm-gray/60 mt-1 platypi-regular">For your tax receipt</p>
            </div>

            <div>
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
                disabled={isProcessing || !donationAmount || (donationAmount === "custom" && (!customAmount || parseFloat(customAmount) <= 0)) || !isValidEmail(donorEmail)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Donate ${donationAmount === "custom" ? `$${customAmount || ""}` : `$${donationAmount || "1"}`}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* General Donation Modal - Put a Coin in Tzedaka */}
      <Dialog open={activeModal === 'donate'} onOpenChange={(open) => {
        if (!open) {
          closeModal();
        }
      }}>
        <DialogContent aria-describedby="general-donation-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">General Donation</DialogTitle>
          </div>
          <p className="text-sm platypi-regular text-gray-600 text-center mb-4">
            Support Women's Causes and Torah Learning
          </p>
          <div id="general-donation-description" className="sr-only">
            General donation for women's causes and Torah learning
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm platypi-medium block mb-2">Select Amount</label>
              <div className="grid grid-cols-5 gap-2">
                <button
                  onClick={() => setDonationAmount("1")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "1"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  $1
                </button>
                <button
                  onClick={() => setDonationAmount("18")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "18"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  $18
                </button>
                <button
                  onClick={() => setDonationAmount("36")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "36"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  $36
                </button>
                <button
                  onClick={() => setDonationAmount("72")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "72"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  $72
                </button>
                <button
                  onClick={() => setDonationAmount("custom")}
                  className={`p-2 rounded-xl text-xs platypi-medium transition-all ${
                    donationAmount === "custom"
                      ? 'bg-gradient-feminine text-white shadow-soft'
                      : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                  }`}
                >
                  Custom
                </button>
              </div>
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
              <label className="text-sm platypi-medium block mb-2">Donor Name (Optional)</label>
              <Input 
                placeholder="Your name"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm"
                autoFocus={false}
              />
            </div>

            <div>
              <label className="text-sm platypi-medium text-warm-gray block mb-2">Email Address *</label>
              <Input 
                placeholder="your@email.com"
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm"
                required
              />
              <p className="text-xs text-warm-gray/60 mt-1 platypi-regular">For your tax receipt</p>
            </div>

            <div>
              <Button 
                onClick={() => handleDonation()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing || !donationAmount || (donationAmount === "custom" && (!customAmount || parseFloat(customAmount) <= 0)) || !isValidEmail(donorEmail)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Donate ${donationAmount === "custom" ? `$${customAmount || ""}` : `$${donationAmount || ""}`}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Gave Tzedaka Elsewhere Modal - Matching Campaign Modal Style */}
      <Dialog open={activeModal === 'gave-elsewhere'} onOpenChange={(open) => {
        if (!open) {
          closeModal();
        }
      }}>
        <DialogContent aria-describedby="gave-elsewhere-description">
          <div className="flex items-center justify-center mb-3 relative">
            <DialogTitle className="text-lg platypi-bold text-black">Gave Tzedaka Elsewhere</DialogTitle>
          </div>
          <p className="text-sm platypi-regular text-gray-600 text-center mb-4">
            Thank you for giving tzedaka! Mark this as complete to track your mitzvah.
          </p>
          <div id="gave-elsewhere-description" className="sr-only">
            Confirmation that user gave tzedaka elsewhere
          </div>
          
          <div className="space-y-4">
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <p className="text-sm text-green-800 platypi-medium mb-2">✓ Tzedaka Completed</p>
              <p className="text-xs text-green-600 platypi-regular">
                You've fulfilled the mitzvah of tzedaka today. May your generosity be blessed.
              </p>
            </div>

            <div>
              <Button 
                onClick={() => closeModal()}
                className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300"
              >
                Mark Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
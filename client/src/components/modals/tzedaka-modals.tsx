import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModalStore } from "@/lib/types";
import { useState } from "react";
import { Heart, BookOpen, Baby, Shield, DollarSign } from "lucide-react";
import { useLocation } from "wouter";

export default function TzedakaModals() {
  const { activeModal, closeModal } = useModalStore();
  const [, setLocation] = useLocation();
  const [donationAmount, setDonationAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [dedicationText, setDedicationText] = useState("");
  const [torahPortion, setTorahPortion] = useState("");

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

  const handleDonation = (donationType: string) => {
    let amount = 0;
    let typeDescription = "";

    switch (activeModal) {
      case "sponsor-day":
        amount = getDonationAmount();
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
      const params = new URLSearchParams({
        amount: amount.toString(),
        type: typeDescription,
        sponsor: donorName,
        dedication: dedicationText
      });

      closeModal();
      setLocation(`/donate?${params.toString()}`);
    }
  };

  return (
    <>
      {/* Sponsor a Day Modal */}
      <Dialog open={activeModal === 'sponsor-day'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="text-blush mr-2" size={20} />
              <DialogTitle className="text-lg font-semibold">Sponsor a Day of Ezras Nashim</DialogTitle>
            </div>
            <p className="text-sm text-gray-600">
              Dedicate all Mitzvot done on the app for one day
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Donation Amount</label>
              <Select value={donationAmount} onValueChange={setDonationAmount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="36">$36 - Chai</SelectItem>
                  <SelectItem value="54">$54 - 1.5 Chai</SelectItem>
                  <SelectItem value="72">$72 - Double Chai</SelectItem>
                  <SelectItem value="118">$118 - Premium</SelectItem>
                  <SelectItem value="custom">Custom Amount</SelectItem>
                </SelectContent>
              </Select>
              {donationAmount === "custom" && (
                <Input 
                  placeholder="Enter amount" 
                  className="mt-2"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Sponsor Name (Optional)</label>
              <Input 
                placeholder="L'ilui Nishmas..."
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">Dedication Message (Optional)</label>
              <Textarea 
                placeholder="In memory of... / For the refuah of..."
                value={dedicationText}
                onChange={(e) => setDedicationText(e.target.value)}
                rows={3}
              />
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
                onClick={handleDonation}
                className="flex-1 gradient-blush-peach text-white"
                disabled={!donationAmount}
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Torah Dedication Modal */}
      <Dialog open={activeModal === 'torah-dedication'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <BookOpen className="text-peach mr-2" size={20} />
              <DialogTitle className="text-lg font-semibold">Torah Dedication</DialogTitle>
            </div>
            <p className="text-sm text-gray-600">
              Dedicate a Letter, Pasuk, Perek or Parsha
            </p>
          </DialogHeader>
          
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

            <div className="flex space-x-2">
              <Button 
                onClick={() => closeModal()} 
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDonation}
                className="flex-1 gradient-blush-peach text-white"
                disabled={!torahPortion}
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Infertility Support Modal */}
      <Dialog open={activeModal === 'infertility-support'} onOpenChange={() => closeModal()}>
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <Baby className="text-rose-500 mr-2" size={20} />
              <DialogTitle className="text-lg font-semibold">Infertility Support</DialogTitle>
            </div>
            <p className="text-sm text-gray-600">
              Support couples struggling with fertility challenges
            </p>
          </DialogHeader>
          
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
                onClick={handleDonation}
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
        <DialogContent className="w-full max-w-sm rounded-3xl p-6">
          <DialogHeader className="text-center mb-4">
            <div className="flex items-center justify-center mb-2">
              <Shield className="text-purple-500 mr-2" size={20} />
              <DialogTitle className="text-lg font-semibold">Abuse Support</DialogTitle>
            </div>
            <p className="text-sm text-gray-600">
              Support women escaping abusive situations
            </p>
          </DialogHeader>
          
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
                onClick={handleDonation}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
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
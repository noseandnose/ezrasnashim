import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

interface AmountOption {
  value: string;
  label: string;
  description?: string;
}

interface InfoBox {
  title: string;
  items: string[];
  bgColor?: string;
}

interface DonationFormConfig {
  modalKey: string;
  title: string;
  description: string;
  buttonType: string;
  fixedAmount?: number;
  amountOptions?: AmountOption[];
  showAmountGrid?: boolean;
  gridAmounts?: string[];
  infoBox?: InfoBox;
  fields: {
    showDonorName?: boolean;
    donorNameLabel?: string;
    donorNamePlaceholder?: string;
    donorNameRequired?: boolean;
    showDedication?: boolean;
    dedicationLabel?: string;
    dedicationPlaceholder?: string;
    dedicationRequired?: boolean;
    showMessage?: boolean;
    messageLabel?: string;
    messagePlaceholder?: string;
    messageRequired?: boolean;
    showTorahPortion?: boolean;
  };
}

interface DonationFormModalProps {
  config: DonationFormConfig | null;
  isOpen: boolean;
  onClose: () => void;
  activeCampaign?: any;
}

const torahAmounts: { [key: string]: number } = {
  letter: 1,
  pasuk: 18,
  perek: 54,
  parsha: 360
};

export function DonationFormModal({ config, isOpen, onClose, activeCampaign }: DonationFormModalProps) {
  const [, setLocation] = useLocation();
  const [donationAmount, setDonationAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [dedicationText, setDedicationText] = useState("");
  const [sponsorMessage, setSponsorMessage] = useState("");
  const [torahPortion, setTorahPortion] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDonationAmount(config?.modalKey === 'wedding-campaign' ? '1' : '');
      setCustomAmount("");
      setDonorName("");
      setDedicationText("");
      setSponsorMessage("");
      setTorahPortion("");
    }
  }, [isOpen, config?.modalKey]);

  if (!config) return null;

  const getDonationAmount = () => {
    if (config.fixedAmount) return config.fixedAmount;
    if (config.fields.showTorahPortion && torahPortion) {
      return torahAmounts[torahPortion] || 0;
    }
    if (donationAmount === "custom") {
      return parseFloat(customAmount) || 0;
    }
    return parseFloat(donationAmount) || 0;
  };

  const handleDonation = () => {
    const amount = getDonationAmount();
    
    if (amount > 0) {
      let typeDescription = config.title;
      if (config.fields.showTorahPortion && torahPortion) {
        typeDescription = `Torah Dedication - ${torahPortion}`;
      }
      if (config.modalKey === 'wedding-campaign' && activeCampaign?.title) {
        typeDescription = activeCampaign.title;
      }

      const params = new URLSearchParams({
        amount: amount.toString(),
        type: typeDescription,
        buttonType: config.buttonType,
        sponsor: donorName,
        dedication: dedicationText,
        message: sponsorMessage
      });

      onClose();
      setLocation(`/donate?${params.toString()}`);
    }
  };

  const isFormValid = () => {
    if (config.fixedAmount) {
      return (!config.fields.donorNameRequired || donorName.trim()) &&
             (!config.fields.dedicationRequired || dedicationText.trim()) &&
             (!config.fields.messageRequired || sponsorMessage.trim());
    }
    if (config.fields.showTorahPortion) {
      return !!torahPortion;
    }
    return !!donationAmount;
  };

  const renderAmountSelection = () => {
    if (config.fixedAmount) {
      return (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 border border-blush/20">
          <div className="text-center">
            <div className="platypi-regular text-2xl text-warm-gray mb-1">${config.fixedAmount}</div>
            <div className="platypi-regular text-xs text-warm-gray/70">Fixed sponsorship amount</div>
          </div>
        </div>
      );
    }

    if (config.fields.showTorahPortion) {
      return (
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
      );
    }

    if (config.showAmountGrid && config.gridAmounts) {
      return (
        <div>
          <label className="text-sm platypi-medium block mb-2">Select Amount</label>
          <div className="grid grid-cols-5 gap-2">
            {config.gridAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setDonationAmount(amount)}
                className={`p-2 rounded-xl text-xs platypi-medium transition-all whitespace-nowrap ${
                  donationAmount === amount
                    ? 'bg-gradient-feminine text-white shadow-soft'
                    : 'bg-white/70 backdrop-blur-sm border border-blush/20 text-warm-gray hover:bg-white/90'
                }`}
              >
                {amount === "custom" ? "Custom" : `$${amount}`}
              </button>
            ))}
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
      );
    }

    if (config.amountOptions) {
      return (
        <div>
          <label className="text-sm platypi-medium block mb-2">Donation Amount</label>
          <Select value={donationAmount} onValueChange={setDonationAmount}>
            <SelectTrigger>
              <SelectValue placeholder="Select amount" />
            </SelectTrigger>
            <SelectContent>
              {config.amountOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
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
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={`${config.modalKey}-description`}>
        <div className="flex items-center justify-center mb-3 relative">
          <DialogTitle className="text-lg platypi-bold text-black">
            {config.modalKey === 'wedding-campaign' && activeCampaign?.title ? activeCampaign.title : config.title}
          </DialogTitle>
        </div>
        <p className="text-sm platypi-regular text-gray-600 text-center mb-4">
          {config.modalKey === 'wedding-campaign' && activeCampaign?.description ? activeCampaign.description : config.description}
        </p>
        <div id={`${config.modalKey}-description`} className="sr-only">
          {config.description}
        </div>
        
        <div className="space-y-4">
          {/* Info Box */}
          {config.infoBox && (
            <div className={`${config.infoBox.bgColor || 'bg-rose-50'} p-4 rounded-xl text-sm text-gray-700`}>
              <p className="mb-2 platypi-regular">{config.infoBox.title}</p>
              <ul className="list-disc list-inside space-y-1 text-xs platypi-regular">
                {config.infoBox.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Amount Selection */}
          {renderAmountSelection()}

          {/* Donor Name Field */}
          {config.fields.showDonorName && (
            <div>
              <label className="text-sm platypi-medium text-warm-gray block mb-2">
                {config.fields.donorNameLabel || 'Donor Name'} {config.fields.donorNameRequired && '*'}
              </label>
              <Input 
                placeholder={config.fields.donorNamePlaceholder || "Enter your name"}
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm"
                autoFocus={false}
                required={config.fields.donorNameRequired}
              />
            </div>
          )}

          {/* Dedication Field */}
          {config.fields.showDedication && (
            <div>
              <label className="text-sm platypi-medium text-warm-gray block mb-2">
                {config.fields.dedicationLabel || 'Dedication'} {config.fields.dedicationRequired && '*'}
              </label>
              <Input
                placeholder={config.fields.dedicationPlaceholder || "L'ilui Nishmas... or L'kavod..."}
                value={dedicationText}
                onChange={(e) => setDedicationText(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm"
                autoFocus={false}
                required={config.fields.dedicationRequired}
              />
            </div>
          )}

          {/* Message Field */}
          {config.fields.showMessage && (
            <div>
              <label className="text-sm platypi-medium text-warm-gray block mb-2">
                {config.fields.messageLabel || 'Message'} {config.fields.messageRequired && '*'}
              </label>
              <Textarea
                placeholder={config.fields.messagePlaceholder || "Enter your message..."}
                value={sponsorMessage}
                onChange={(e) => setSponsorMessage(e.target.value)}
                className="rounded-xl border-blush/30 focus:border-blush bg-white/80 backdrop-blur-sm min-h-[80px]"
                autoFocus={false}
                required={config.fields.messageRequired}
              />
            </div>
          )}

          {/* Submit Button */}
          <div>
            <Button 
              onClick={handleDonation}
              disabled={!isFormValid()}
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl platypi-medium border-0 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {config.fixedAmount ? `Sponsor for $${config.fixedAmount}` : 
               config.modalKey === 'wedding-campaign' ? 
               `Donate ${donationAmount === "custom" ? `$${customAmount || ""}` : `$${donationAmount || "1"}`}` :
               'Donate Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
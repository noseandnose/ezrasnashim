import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

// Load Stripe outside of component render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface DonationFormProps {
  amount: number;
  donationType: string;
  sponsorName: string;
  dedication: string;
  onSuccess: () => void;
}

const DonationForm = ({ amount, donationType, sponsorName, dedication, onSuccess }: DonationFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/?donation=success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Call completion handler for sponsor day donations
      if (donationType === 'Sponsor a Day of Ezras Nashim' && sponsorName) {
        try {
          await apiRequest("POST", "http://18.193.108.87/donation-complete", {
            donationType,
            sponsorName,
            dedication: dedication || null
          });
        } catch (error) {
          console.error('Failed to create sponsor record:', error);
        }
      }
      
      toast({
        title: "Thank You!",
        description: "Your donation has been processed successfully.",
      });
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-gray-50 rounded-xl">
        <div className="text-center">
          <h3 className="font-semibold text-lg mb-2">{donationType}</h3>
          <div className="text-2xl font-bold text-blush">${amount}</div>
        </div>
      </div>

      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
          fields: {
            billingDetails: 'never'
          }
        }}
      />

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 gradient-blush-peach text-white font-medium"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing...
          </div>
        ) : (
          `Donate $${amount}`
        )}
      </Button>
    </form>
  );
};

export default function Donate() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [donationComplete, setDonationComplete] = useState(false);
  const { toast } = useToast();

  // Get donation details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const amount = parseFloat(urlParams.get('amount') || '0');
  const donationType = urlParams.get('type') || 'General Donation';
  const sponsorName = urlParams.get('sponsor') || '';
  const dedication = urlParams.get('dedication') || '';

  useEffect(() => {
    if (amount <= 0) {
      setLocation('/');
      return;
    }

    // Create PaymentIntent when component loads
    apiRequest("POST", "http://18.193.108.87/create-payment-intent", {
      amount,
      donationType,
      metadata: {
        sponsorName,
        dedication,
        timestamp: new Date().toISOString()
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('No client secret received');
        }
      })
      .catch((error) => {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Payment Setup Failed",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      });
  }, [amount, donationType, sponsorName, dedication]);

  const handleSuccess = () => {
    setDonationComplete(true);
  };

  const handleBackToApp = () => {
    setLocation('/');
  };

  if (donationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush/10 to-peach/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
          <p className="text-gray-600 mb-6">
            Your donation of ${amount} has been processed successfully. 
            May your generosity bring many blessings.
          </p>
          
          <Button
            onClick={handleBackToApp}
            className="w-full gradient-blush-peach text-white py-3"
          >
            Return to Ezras Nashim
          </Button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush/10 to-peach/10 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blush border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush/10 to-peach/10 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToApp}
            className="mr-4"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Complete Donation</h1>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-lg">
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: 'hsl(328, 85%, 87%)',
                }
              }
            }}
          >
            <DonationForm
              amount={amount}
              donationType={donationType}
              sponsorName={sponsorName}
              dedication={dedication}
              onSuccess={handleSuccess}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}
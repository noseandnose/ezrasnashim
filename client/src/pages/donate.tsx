import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useDailyCompletionStore, useModalStore } from "@/lib/types";
import { useTrackModalComplete } from "@/hooks/use-analytics";
// Removed Apple Pay button import - now using integrated PaymentElement

// Add Apple Pay types
declare global {
  interface Window {
    ApplePaySession?: {
      canMakePayments(): boolean;
    };
  }
}

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
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { openModal } = useModalStore();
  const { trackModalComplete } = useTrackModalComplete();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    console.log('Attempting to confirm payment...');
    console.log('Elements ready:', !!elements);
    console.log('Stripe ready:', !!stripe);
    
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/?donation=success`,
        },
        redirect: "if_required", // Stay on same page when possible
      });
      
      console.log('Payment confirmation result:', { 
        error: error ? { type: error.type, code: error.code, message: error.message } : null, 
        paymentIntent: paymentIntent ? { 
          id: paymentIntent.id, 
          status: paymentIntent.status, 
          amount: paymentIntent.amount,
          payment_method: paymentIntent.payment_method
        } : null 
      });

      if (error) {
        console.error('Payment error details:', {
          type: error.type,
          code: error.code,
          message: error.message,
          decline_code: error.decline_code,
          payment_intent: error.payment_intent
        });
        
        // Special handling for Apple Pay errors
        if (error.type === 'card_error' && error.code === 'payment_intent_authentication_failure') {
          toast({
            title: "Apple Pay Authentication Failed",
            description: "Please try again or use a different payment method.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payment Failed",
            description: error.message || "Payment could not be processed. Please try again.",
            variant: "destructive",
          });
        }
      } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing' || paymentIntent.status === 'requires_capture')) {
        // Handle succeeded, processing, and requires_capture status (Apple Pay variations)
        console.log('Payment successful with status:', paymentIntent.status);
        
        // Call completion handler for sponsor day donations
        if (donationType === 'Sponsor a Day of Ezras Nashim' && sponsorName) {
          try {
            await apiRequest("POST", "/api/donation-complete", {
              donationType,
              sponsorName,
              dedication: dedication || null
            });
          } catch (error) {
            console.error('Failed to create sponsor record:', error);
          }
        }
        
        // Complete tzedaka task when payment is successful/processing
        completeTask('tzedaka');
        
        // Track completion for analytics
        trackModalComplete('donate');
        
        toast({
          title: "Thank You!",
          description: paymentIntent.status === 'processing' 
            ? "Your donation is being processed and will be confirmed shortly."
            : paymentIntent.status === 'requires_capture'
            ? "Your donation has been authorized and will be captured shortly."
            : "Your donation has been processed successfully.",
        });
        
        // Check if all tasks are completed and show congratulations
        setTimeout(() => {
          if (checkAndShowCongratulations()) {
            openModal('congratulations');
          }
        }, 1000);
        
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        // Handle payments that require additional authentication (3D Secure, etc.)
        console.log('Payment requires additional action');
        toast({
          title: "Additional Authentication Required",
          description: "Please complete the authentication process to finalize your payment.",
        });
      } else if (paymentIntent) {
        console.warn('Unexpected payment intent status:', paymentIntent.status);
        console.log('Full payment intent object:', paymentIntent);
        
        // Check if this might be a successful payment with an unexpected status
        if (paymentIntent.status === 'canceled') {
          toast({
            title: "Payment Canceled",
            description: "The payment was canceled. Please try again.",
            variant: "destructive",
          });
        } else {
          // For any other status, treat as potentially successful but unclear
          console.log('Treating unknown status as potentially successful:', paymentIntent.status);
          toast({
            title: "Payment Status Unclear",
            description: `Payment status: ${paymentIntent.status}. Please check your payment method for confirmation.`,
            variant: "destructive",
          });
        }
      } else {
        console.error('No payment intent returned from Stripe');
        toast({
          title: "Payment Error",
          description: "No payment information was returned. Please try again.",
          variant: "destructive",
        });
      }
    } catch (paymentError) {
      console.error('Payment processing error:', paymentError);
      toast({
        title: "Payment Error",
        description: "An error occurred while processing your payment. Please try again.",
        variant: "destructive",
      });
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

      {/* Apple Pay Safari detection */}
      {(() => {
        const isIPhone = /iPhone/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isIPhone && !isSafari) {
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Apple Pay Notice:</strong> Please use Safari to enable Apple Pay on your iPhone.
              </p>
            </div>
          );
        }
        return null;
      })()}

      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
          fields: {
            billingDetails: {
              address: 'never',
              email: 'never',
              name: 'never',
              phone: 'never'
            }
          },
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          },
          business: {
            name: 'Ezras Nashim'
          }
        }}
        onReady={() => {
          console.log('PaymentElement is ready');
          console.log('User Agent:', navigator.userAgent);
          console.log('Protocol:', window.location.protocol);
          console.log('Hostname:', window.location.hostname);
          
          // Check available payment methods
          if ('ApplePaySession' in window) {
            console.log('ApplePaySession is available in browser');
            // Check if Apple Pay is available
            try {
              const canMakePayments = window.ApplePaySession?.canMakePayments();
              console.log('Device can make Apple Pay payments:', canMakePayments);
            } catch (e) {
              console.error('Error checking Apple Pay availability:', e);
            }
          } else {
            console.log('ApplePaySession not available in this browser');
          }
        }}
      />

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 gradient-blush-peach text-white platypi-medium"
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
    apiRequest("POST", "/api/create-payment-intent", {
      amount,
      donationType,
      metadata: {
        sponsorName,
        dedication,
        timestamp: new Date().toISOString()
      }
    })
      .then((response) => {
        const data = response.data;
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
    // Navigate to home with scroll to progress to show flower growth
    setLocation('/?scrollToProgress=true');
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
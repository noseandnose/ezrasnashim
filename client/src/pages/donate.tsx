import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState, useRef } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { useDailyCompletionStore, useModalStore, useDonationCompletionStore } from "@/lib/types";
import { playCoinSound } from "@/utils/sounds";
import { useTrackModalComplete } from "@/hooks/use-analytics";
import Stripe from 'stripe';
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
  clientSecret: string;
  onSuccess: () => void;
}


const DonationForm = ({ amount, donationType, sponsorName, dedication, onSuccess }: DonationFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const { addCompletedDonation } = useDonationCompletionStore();
  const { openModal } = useModalStore();
  const { trackModalComplete } = useTrackModalComplete();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Directly confirm payment - PaymentElement handles its own validation
      // The confirmPayment method will automatically validate the form
      
      let confirmResult;
      try {
        
        // Use redirect: 'if_required' to handle success without redirect for card payments
        confirmResult = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/donate?success=true&amount=${amount}&type=${encodeURIComponent(donationType)}&email=${encodeURIComponent(userEmail || '')}`,
            receipt_email: userEmail || undefined,
          },
          redirect: 'if_required' // This prevents redirect for successful card payments
        });
        

      } catch (stripeError) {
        // Stripe confirmPayment threw an error
        // Error details captured but not logged to console
        throw stripeError; // Re-throw to be caught by outer catch
      }
      

      
      // Handle the TypeScript typing issue - confirmResult may have different structures
      const error = (confirmResult as any)?.error;
      const paymentIntent = (confirmResult as any)?.paymentIntent;
      
      console.log('=== FULL PAYMENT CONFIRMATION RESULT ===');
      console.log('Raw confirmResult object:', confirmResult);
      console.log('Error object:', error);
      console.log('PaymentIntent object:', paymentIntent);
      console.log('Error exists:', !!error);
      console.log('PaymentIntent exists:', !!paymentIntent);
      
      if (error) {
        console.log('=== ERROR DETAILS ===');
        console.log('Error type:', error.type);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        console.log('Decline code:', (error as any).decline_code);
        console.log('Payment Intent in error:', (error as any).payment_intent);
        console.log('Full error object keys:', Object.keys(error));
      }
      
      if (paymentIntent) {
        console.log('=== PAYMENT INTENT DETAILS ===');
        console.log('Payment Intent ID:', paymentIntent.id);
        console.log('Payment Intent status:', paymentIntent.status);
        console.log('Payment Intent amount:', paymentIntent.amount);
        console.log('Payment method:', paymentIntent.payment_method);
        console.log('Client secret exists:', !!paymentIntent.client_secret);
        console.log('Full PaymentIntent keys:', Object.keys(paymentIntent));
      }
      console.log('Raw Stripe response - error exists:', !!error);
      console.log('Raw Stripe response - paymentIntent exists:', !!paymentIntent);
      if (paymentIntent) {
        console.log('PaymentIntent details:', {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          created: paymentIntent.created,
          payment_method_id: paymentIntent.payment_method
        });
      }

      if (error) {
        console.error('Payment error details:', {
          type: error.type,
          code: error.code,
          message: error.message,
          decline_code: error.decline_code,
          payment_intent: error.payment_intent
        });
        
        // Enhanced Apple Pay error handling
        if (error.type === 'card_error') {
          if (error.code === 'payment_intent_authentication_failure') {
            toast({
              title: "Apple Pay Authentication Failed",
              description: "Touch ID or Face ID authentication failed. Please try again.",
              variant: "destructive",
            });
          } else if (error.code === 'card_declined') {
            toast({
              title: "Payment Declined",
              description: "Your payment method was declined. Please try a different card or payment method.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Payment Error",
              description: error.message || "There was an issue with your payment method. Please try again.",
              variant: "destructive",
            });
          }
        } else if (error.type === 'validation_error') {
          toast({
            title: "Payment Information Error",
            description: "Please check your payment information and try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Payment Error",
            description: error.message || "An error occurred while processing your payment. Please try again.",
            variant: "destructive",
          });
        }
      } else if (!error && (!paymentIntent || paymentIntent?.status === 'requires_payment_method')) {
        // This is a normal state when user hasn't entered payment details yet
        console.log('Payment requires method - user needs to complete form');
        // Don't show error, just let user continue with form
        setIsProcessing(false);
        return;
      } else if (paymentIntent && ['succeeded', 'processing', 'requires_capture', 'requires_confirmation'].includes(paymentIntent.status)) {
        // Handle all successful/processing payment statuses (Apple Pay, Google Pay, card variations)
        console.log('Payment successful with status:', paymentIntent.status);
        console.log('Payment method type detected:', paymentIntent.payment_method);
        
        // Call completion handler for sponsor day donations
        if (donationType === 'Sponsor a Day of Ezras Nashim' && sponsorName) {
          try {
            await apiRequest("POST", "/api/donation-complete", {
              donationType,
              sponsorName,
              dedication: dedication || null
            });
            console.log('Sponsor record created successfully');
          } catch (error) {
            console.error('Failed to create sponsor record:', error);
          }
        }
        
        // Play coin sound on successful donation
        playCoinSound();
        
        // Mark specific donation type as completed
        if (donationType === 'Sponsor a Day of Ezras Nashim') {
          addCompletedDonation('sponsor-day');
        } else {
          addCompletedDonation('general-donation');
        }
        
        // Complete tzedaka task when payment is successful/processing
        completeTask('tzedaka');
        
        // Track completion for analytics
        trackModalComplete('donate');
        
        // Update donation status in database (in case webhook isn't configured)
        apiRequest("POST", "/api/donations/update-status", {
          paymentIntentId: paymentIntent.id,
          status: 'succeeded'
        }).catch(err => console.log('Could not update donation status:', err));
        
        const successMessage = paymentIntent.status === 'processing' 
          ? "Your donation is being processed and will be confirmed shortly."
          : paymentIntent.status === 'requires_capture'
          ? "Your donation has been authorized and will be captured shortly."
          : paymentIntent.status === 'requires_confirmation'
          ? "Your donation is being confirmed and will complete shortly."
          : "Your donation has been processed successfully.";
        
        toast({
          title: "Thank You!",
          description: successMessage,
        });
        
        // Check if all tasks are completed and show congratulations
        setTimeout(() => {
          if (checkAndShowCongratulations()) {
            openModal('congratulations');
          }
        }, 1000);
        
        // Store email for success modal if available
        if (userEmail) {
          localStorage.setItem('lastDonationEmail', userEmail);
        }
        
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
          // For any other status, be more optimistic about Apple Pay/Google Pay
          console.log('Unexpected payment status, checking if Apple Pay succeeded:', paymentIntent.status);
          
          // If payment method exists and amount matches, likely successful
          if (paymentIntent.payment_method && paymentIntent.amount) {
            console.log('Payment method and amount exist, treating as successful');
            
            // Complete tzedaka task optimistically
            completeTask('tzedaka');
            trackModalComplete('donate');
            
            toast({
              title: "Payment Processed",
              description: "Your donation is being processed. Please check your payment method for confirmation.",
            });
            
            onSuccess();
          } else {
            toast({
              title: "Payment Status Unclear",
              description: `Payment status: ${paymentIntent.status}. Please check your payment method for confirmation.`,
              variant: "destructive",
            });
          }
        }
      } else {
        // This shouldn't happen but handle it gracefully
        console.log('Unexpected payment state:', { error, paymentIntent });
        if (!error && !paymentIntent) {
          // User may have cancelled or form needs input
          console.log('Payment form needs completion');
          setIsProcessing(false);
          return;
        }
        
        toast({
          title: "Payment Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } catch (paymentError) {
      console.error('=== PAYMENT PROCESSING ERROR ===');
      console.error('Error caught in catch block:', paymentError);
      console.error('Error type:', typeof paymentError);
      console.error('Error constructor:', (paymentError as any)?.constructor?.name);
      console.error('Error details:', {
        name: (paymentError as any)?.name,
        message: (paymentError as any)?.message,
        code: (paymentError as any)?.code,
        type: (paymentError as any)?.type,
        stack: (paymentError as any)?.stack
      });
      
      // Extract error message
      const errorMessage = (paymentError as any)?.message || 
                          (paymentError as any)?.error?.message ||
                          "An error occurred while processing your payment. Please try again.";
      
      // Special handling for network/connectivity errors
      if (errorMessage.includes('network') || 
          errorMessage.includes('timeout') ||
          (paymentError as any)?.name === 'NetworkError') {
        toast({
          title: "Connection Error",
          description: "Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('confirm')) {
        // Specific error for payment confirmation issues
        toast({
          title: "Payment Confirmation Error",
          description: "Unable to confirm the payment. Please ensure your payment details are correct and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
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

      {/* Email field for tax receipt */}
      <div className="mb-6">
        <Label htmlFor="email" className="flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4" />
          Email for Tax Receipt
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          className="w-full"
        />
        <p className="text-sm text-gray-500 mt-1">
          We'll send your tax-deductible donation receipt to this email
        </p>
      </div>

      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
          wallets: {
            applePay: 'auto',
            googlePay: 'auto'
          },
          business: {
            name: 'Ezras Nashim'
          }
        }}
        onReady={() => {
          console.log('=== PAYMENT ELEMENT READY ===');
          console.log('User Agent:', navigator.userAgent);
          console.log('Protocol:', window.location.protocol);
          console.log('Hostname:', window.location.hostname);
          console.log('Full URL:', window.location.href);
          
          // Check available payment methods
          if ('ApplePaySession' in window) {
            console.log('✅ ApplePaySession is available in browser');
            try {
              const canMakePayments = window.ApplePaySession?.canMakePayments();
              console.log('Device can make Apple Pay payments:', canMakePayments);
              
              // Test domain verification
              fetch('/.well-known/apple-developer-merchantid-domain-association')
                .then(response => {
                  console.log('Apple Pay domain verification response:', response.status, response.ok);
                  return response.text();
                })
                .then(content => {
                  console.log('Domain verification content length:', content.length);
                  console.log('Domain verification content preview:', content.substring(0, 50) + '...');
                })
                .catch(error => {
                  console.error('❌ Apple Pay domain verification failed:', error);
                });
            } catch (e) {
              console.error('Error checking Apple Pay availability:', e);
            }
          } else {
            console.log('❌ ApplePaySession not available in this browser');
          }
          
          console.log('=== STRIPE PUBLIC KEY INFO ===');
          const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
          console.log('Public key exists:', !!publicKey);
          console.log('Public key format:', publicKey?.substring(0, 10) + '...');
          console.log('Is live key:', publicKey?.includes('pk_live'));
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
  //const [clientSecret, setClientSecret] = useState("");
  const [donationComplete, setDonationComplete] = useState(false);
  const [userEmailForReceipt, setUserEmailForReceipt] = useState("");
  const { toast } = useToast();
  
  // Use ref to track if payment intent has been created
  const paymentIntentCreatedRef = useRef(false);

  // Get donation details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get('success') === 'true';
  const amount = parseFloat(urlParams.get('amount') || '0');
  const donationType = urlParams.get('type') || 'General Donation';
  const sponsorName = urlParams.get('sponsor') || '';
  const dedication = urlParams.get('dedication') || '';
  //const emailFromUrl = urlParams.get('email') || '';

  useEffect(() => {
    // Check if returning from successful payment
    if (isSuccess) {
      setDonationComplete(true);
      return;
    }

    if (amount <= 0) {
      setLocation('/');
      return;
    }

    // // Use ref to ensure payment intent is only created once
    // if (paymentIntentCreatedRef.current || clientSecret) {
    //   console.log('Payment intent already created or in progress, skipping...');
    //   return;
    // }

    // // Mark as created immediately using ref
    // paymentIntentCreatedRef.current = true;

    // Create PaymentIntent when component loads
    // console.log('=== PAYMENT INTENT CREATION (SINGLE INSTANCE) ===');
    // console.log('Amount:', amount);
    // console.log('Donation type:', donationType);
    // console.log('Sponsor name:', sponsorName);
    // console.log('Dedication:', dedication);

    // console.log('Creating session checkout with data: ', amount, donationType, sponsorName, dedication);
    apiRequest("POST", "/api/create-session-checkout", {
      amount,
      donationType,
      metadata: {
        sponsorName,
        dedication,
        timestamp: new Date().toISOString()
      },
      returnUrl: `${window.location.origin}/donate?success=true&amount=${amount}&type=${donationType}&sponsor=${sponsorName}&dedication=${dedication}`,
      email: "" // Will be filled by user in the form
    })
      .then(async (response) => {
        const stripe = await stripePromise;
        const sessionId = response.data.sessionId;
        console.log('Redirecting to Stripe Checkout with session ID:', sessionId);
        return stripe && stripe.redirectToCheckout({ sessionId: sessionId });
        // console.log('Payment intent response:', response);
        // const data = response.data;
        // console.log('Payment intent data:', data);
        // const decoded = decodeURIComponent(data.id);
        // setClientSecret(decoded);
        // if (data.clientSecret) {
        //   console.log('Client secret received successfully');
        //   setClientSecret(decodeURIComponent(data.id));
        // } else {
        //   console.error('No client secret in response:', data);
        //   throw new Error('No client secret received');
        // }
      })
      .catch((error) => {
        console.error('Error creating session:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        
        // Reset the ref on error so user can retry if needed
        paymentIntentCreatedRef.current = false;
        
        toast({
          title: "Payment Setup Failed",
          description: `Unable to initialize payment: ${error.response?.data?.message || error.message}`,
          variant: "destructive",
        });
      });
  }, []); // Empty dependency array - run only once on mount

  const handleSuccess = () => {
    // Get email from localStorage if it was set in the form
    const savedEmail = localStorage.getItem('lastDonationEmail');
    if (savedEmail) {
      setUserEmailForReceipt(savedEmail);
      localStorage.removeItem('lastDonationEmail'); // Clean up
    }
    setDonationComplete(true);
  };

  const handleBackToApp = () => {
    // Navigate to home with scroll to progress to show flower growth
    setLocation('/?scrollToProgress=true');
  };

  if (donationComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="text-white" size={40} />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-2">
            Your donation has been processed successfully.
          </p>
          <p className="text-xl font-semibold text-blush mb-6">
            ${amount || '0'} - {donationType}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            May your generosity bring many blessings and help us reach our goal of 1 million mitzvos monthly.
            {userEmailForReceipt && (
              <span className="block mt-2">
                A tax receipt will be sent to: <strong>{userEmailForReceipt}</strong>
              </span>
            )}
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={handleBackToApp}
              className="w-full gradient-blush-peach text-white py-3 font-semibold shadow-md hover:shadow-lg transition-shadow"
            >
              Return to Ezras Nashim
            </Button>
            {/* <Button
              onClick={() => setLocation('/donate')}
              variant="outline"
              className="w-full py-3"
            >
              Make Another Donation
            </Button> */}
          </div>
        </div>
      </div>
    );
  }

  // if (!clientSecret) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blush/10 to-peach/10 flex items-center justify-center">
  //       <div className="animate-spin w-8 h-8 border-4 border-blush border-t-transparent rounded-full" />
  //     </div>
  //   );
  // }

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

        {/* <div className="bg-white rounded-3xl p-6 shadow-lg">
          <Elements 
            stripe={stripePromise} 
            options={{
              clientSecret: clientSecret,
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
        </div> */}
      </div>
    </div>
  );
}
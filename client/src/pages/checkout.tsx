import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { Heart, ArrowLeft } from 'lucide-react';

// Load Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
        return_url: `${window.location.origin}/donation-success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your generous donation!",
      });
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory via-lavender/20 to-blush/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-gradient-feminine p-3 rounded-full">
              <Heart className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-serif font-semibold text-warm-gray">Complete Your Donation</h1>
          </div>
          <p className="text-sm text-warm-gray/70">Your contribution helps support our community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PaymentElement />
          
          <div className="space-y-3">
            <Button
              type="submit"
              disabled={!stripe || isProcessing}
              className="w-full bg-gradient-feminine text-white py-3 rounded-xl font-medium border-0"
            >
              {isProcessing ? 'Processing...' : 'Complete Donation'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/')}
              className="w-full rounded-xl border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft size={16} className="mr-2" />
              Return to App
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Get client secret from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    
    if (paymentIntent) {
      setClientSecret(paymentIntent);
    } else {
      // Redirect back if no payment intent
      setLocation('/');
    }
  }, [setLocation]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory via-lavender/20 to-blush/10 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm clientSecret={clientSecret} />
    </Elements>
  );
}
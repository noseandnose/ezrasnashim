import { useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ApplePayButtonProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function ApplePayButton({ amount, onSuccess, onError, disabled }: ApplePayButtonProps) {
  const stripe = useStripe();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplePay = async () => {
    if (!stripe || disabled) return;

    setIsProcessing(true);

    try {
      // Check if Apple Pay is available
      if (!window.ApplePaySession?.canMakePayments()) {
        throw new Error('Apple Pay is not available on this device');
      }

      // Create payment request
      const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Ezras Nashim Donation',
          amount: Math.round(amount * 100), // Convert to cents
        },
        requestPayerName: false,
        requestPayerEmail: false,
      });

      // Check if payment request can be made
      const result = await paymentRequest.canMakePayment();
      if (!result) {
        throw new Error('Apple Pay is not supported');
      }

      paymentRequest.on('paymentmethod', async (event) => {
        try {
          // Create payment intent on server
          const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              donationType: 'Apple Pay Donation',
              metadata: {
                paymentMethod: 'apple_pay',
                timestamp: new Date().toISOString()
              }
            }),
          });

          const { clientSecret } = await response.json();

          // Confirm payment with Stripe
          const { error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: event.paymentMethod.id,
          });

          if (error) {
            event.complete('fail');
            throw error;
          }

          event.complete('success');
          onSuccess();
          
          toast({
            title: "Payment Successful",
            description: "Thank you for your donation via Apple Pay!",
          });

        } catch (err: any) {
          event.complete('fail');
          onError(err.message);
        }
      });

      // Show Apple Pay payment sheet
      paymentRequest.show();

    } catch (error: any) {
      onError(error.message);
      toast({
        title: "Apple Pay Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if Apple Pay is available
  const isApplePayAvailable = typeof window !== 'undefined' && 
    window.ApplePaySession?.canMakePayments();

  if (!isApplePayAvailable) {
    return null; // Don't render if Apple Pay is not available
  }

  return (
    <button
      onClick={handleApplePay}
      disabled={disabled || isProcessing || !stripe}
      className={`
        w-full h-12 bg-black text-white rounded-xl font-medium
        flex items-center justify-center space-x-2
        hover:bg-gray-800 transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isProcessing ? 'animate-pulse' : ''}
      `}
      style={{
        background: 'linear-gradient(135deg, #000 0%, #333 100%)',
      }}
    >
      {isProcessing ? (
        <div className="flex items-center space-x-2">
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          <span>Processing...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
          </svg>
          <span>Pay</span>
        </div>
      )}
    </button>
  );
}
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState, useRef } from 'react';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useLocation } from "wouter";
import { useDailyCompletionStore, useModalStore, useDonationCompletionStore } from "@/lib/types";
import { useAnalytics } from "@/hooks/use-analytics";

// TzedakaButtonType definition
type TzedakaButtonType = 'gave_elsewhere' | 'active_campaign' | 'put_a_coin' | 'sponsor_a_day';
import { playCoinSound } from "@/utils/sounds";
import { triggerMitzvahSync } from "@/hooks/use-mitzvah-sync";
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

export default function Donate() {
  const [, setLocation] = useLocation();
  //const [clientSecret, setClientSecret] = useState("");
  const [donationComplete, setDonationComplete] = useState(false);
  const [userEmailForReceipt] = useState("");
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const { toast } = useToast();
  const { completeTask, checkAndShowCongratulations } = useDailyCompletionStore();
  const {  addCompletedDonation } = useDonationCompletionStore();
  const { openModal } = useModalStore();
  const { trackEvent } = useAnalytics();
  
  // Use ref to track if payment intent has been created
  const paymentIntentCreatedRef = useRef(false);
  const hasRedirectedToStripeRef = useRef(false);

  // Get donation details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isSuccess = urlParams.get('success') === 'true';
  const amount = parseFloat(urlParams.get('amount') || '0');
  const donationType = urlParams.get('type') || 'General Donation';
  const buttonType = urlParams.get('buttonType') || 'put_a_coin'; // New field for tracking
  const sponsorName = urlParams.get('sponsor') || '';
  const dedication = urlParams.get('dedication') || '';
  const message = urlParams.get('message') || '';
  const donorEmail = urlParams.get('email') || '';

  
  // Function to mark individual button as complete (from tzedaka-section)
  const markTzedakaButtonCompleted = (buttonType: TzedakaButtonType) => {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
    let completions: Record<string, any> = {};
    try {
      completions = JSON.parse(localStorage.getItem('tzedaka_button_completions') || '{}');
    } catch (e) {
      console.warn('Failed to parse tzedaka_button_completions');
    }
    
    if (!completions[today]) {
      completions[today] = {};
    }
    
    completions[today][buttonType] = true;
    
    // Note: No longer pruning old data to preserve cloud-synced history
    // Historical data is needed for streak calculations and profile stats
    
    localStorage.setItem('tzedaka_button_completions', JSON.stringify(completions));
    
    // Trigger cloud sync for authenticated users
    triggerMitzvahSync();
  };

  // Function to call backend payment confirmation endpoint (idempotent)
  const handleDonationSuccess = async (sessionId: string, buttonType: string, paymentIntentId?: string) => {
    console.log('=== FRONTEND PAYMENT CONFIRMATION ===');
    console.log('Session ID:', sessionId);
    console.log('Payment Intent ID:', paymentIntentId);
    console.log('Button Type:', buttonType);

    try {
      // Call the new idempotent confirmation endpoint
      const response = await apiRequest('POST', '/api/payments/confirm', {
        paymentIntentId: paymentIntentId || sessionId, // Use payment intent if available, fallback to session
        sessionId: sessionId,
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        metadata: {
          buttonType: buttonType,
          donationType: donationType,
          sponsorName: sponsorName,
          email: donorEmail,
          dedication: dedication,
          message: message,
          sessionId: sessionId
        }
      });
      
      console.log('Payment confirmation response:', response);
      
      // Always mark as success locally if we got a response (idempotent backend handles duplicates)
      if (response && response.data) {

        // Play coin sound on successful donation
        playCoinSound();

        // Mark the individual button as complete using the button type
        markTzedakaButtonCompleted(buttonType as TzedakaButtonType);
        
        if(buttonType === 'sponsor_a_day') {
          try {
            await apiRequest("POST", "/api/donation-complete", {
              buttonType,
              donationType: donationType,
              sponsorName: sponsorName || 'Anonymous',
              email: donorEmail || null,
              dedication: dedication || null,
              message: message || null
            });
            // Sponsor record created successfully
          } catch (error) {
            console.error('Failed to create sponsor record:', error);
          }
        }
        
        if (buttonType) {
          try {
            addCompletedDonation(buttonType);
          } catch (error) {
            console.error('Failed to add completed donation:', error);
          }
        }

        // CRITICAL FIX: Also complete the overall daily tzedaka task
        completeTask('tzedaka');
        
        // Track donation for analytics (counts toward total acts)
        trackEvent('tzedaka_completion', {
          buttonType: buttonType,
          amount: amount,
          date: new Date().toISOString().split('T')[0]
        });
        
        // ENHANCED CACHE INVALIDATION: Force refresh ALL donation-related data immediately
        const today = new Date().toISOString().split('T')[0];
        // Campaign data
        await queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active'] });
        // Statistics data  
        await queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/today'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/month'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/total'] });
        // Community impact data
        await queryClient.invalidateQueries({ queryKey: [`/api/analytics/community-impact`] });
        await queryClient.invalidateQueries({ queryKey: [`/api/community/impact/${today}`] });
        
        // Force immediate refetch of campaign data to show updated progress bar
        await queryClient.refetchQueries({ queryKey: ['/api/campaigns/active'] });
        console.log('Invalidated and refetched all donation data for immediate UI update');
        
        toast({
          title: "Donation Complete!",
          description: `Your ${buttonType.replace('_', ' ')} action has been recorded.`,
        });
        
        console.log(`Successfully recorded ${buttonType} completion and daily tzedaka task`);
        
        // Check if all tasks are completed and show congratulations
        setTimeout(() => {
          if (checkAndShowCongratulations('tzedaka')) {
            openModal('congratulations', 'tzedaka');
          }
        }, 200);
      }
    } catch (error) {
      console.error('Error processing donation success:', error);
      // Still mark button complete locally even if backend fails
      markTzedakaButtonCompleted(buttonType as TzedakaButtonType);
      // Also complete the overall daily tzedaka task
      completeTask('tzedaka');
      // Track donation for analytics even when backend fails
      trackEvent('tzedaka_completion', {
        buttonType: buttonType,
        amount: amount,
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  useEffect(() => {
    // Check if returning from successful payment
    if (isSuccess) {
      console.log('SUCCESS DETECTED - Processing donation completion...');

      // Stripe doesn't send back the session ID with the successful payment, we get it from the pending_donation in localStorage
      console.log('URL Params:', {
        success: urlParams.get('success'),
        buttonType: urlParams.get('buttonType'),
        amount: urlParams.get('amount')
      });
      
      // Get the session ID from localStorage (if available)
      const pendingDonationString = localStorage.getItem('pending_donation');
      let sessionId = null;

      if (pendingDonationString) {
        try {
          const pendingDonation = JSON.parse(pendingDonationString);
          sessionId = pendingDonation.sessionId;
        } catch (error) {
          console.error('Failed to parse pending_donation:', error);
        }
      }

      setDonationComplete(true);
      setShowLoadingScreen(false);
      
      // Clear redirect flag on successful completion
      localStorage.removeItem('has_been_redirected_to_stripe');
      
      // paymentIntentId is not available from the URL since Stripe doesn't send it back with the successful payment - keeping it in because some functions require it
      const paymentIntentId = urlParams.get('payment_intent');
      console.log('Confirming payment with sessionId:', sessionId, 'paymentIntentId:', paymentIntentId, 'buttonType:', buttonType);
      
      // Immediately confirm payment and update UI (don't wait for webhook)
      handleDonationSuccess(sessionId, buttonType, paymentIntentId || undefined);
      
      return;
    }

    // Check if we've already been redirected to Stripe (to prevent recreation on return)
    const hasBeenRedirected = localStorage.getItem('has_been_redirected_to_stripe');
    if (hasBeenRedirected && !isSuccess) {
      console.log('CANCELLED: User returned from Stripe without success - clearing and redirecting home');
      setShowLoadingScreen(false);
      
      // Clear the redirect flag and any pending donation
      localStorage.removeItem('has_been_redirected_to_stripe');
      localStorage.removeItem('pending_donation');
      
      // Show cancellation message
      toast({
        title: "Donation Cancelled",
        description: "No worries! You can try donating again anytime.",
        variant: "default",
      });
      
      // Redirect to home after a short delay
      setTimeout(() => {
        setLocation('/');
      }, 1500);
      
      return;
    }

    // BACKUP: Check for pending donation completion (in case URL redirect fails)
    const pendingDonation = localStorage.getItem('pending_donation');
    if (pendingDonation && !isSuccess) {
      try {
        const donation = JSON.parse(pendingDonation);
        const donationAge = Date.now() - new Date(donation.timestamp).getTime();
        
        // If donation is less than 5 minutes old, check for completion
        if (donationAge < 5 * 60 * 1000) {
          console.log('BACKUP: Checking for completed donation:', donation);
          
          // Check backend for completion status
          if (amount <= 0) { // We're on the donate page without parameters - likely returned from Stripe
            console.log('BACKUP: Checking backend for donation completion');
            
            // Check if donation was completed
            apiRequest('GET', `/api/donations/check-completion/${donation.sessionId}`)
              .then((response) => {
                if (response.data && response.data.completed) {
                  console.log('BACKUP: Backend confirms donation completion');
                  
                  // Clear pending donation and mark complete
                  localStorage.removeItem('pending_donation');
                  markTzedakaButtonCompleted(donation.buttonType as TzedakaButtonType);
                  completeTask('tzedaka');
                  
                  // Force cache refresh for all financial data
                  const today = new Date().toISOString().split('T')[0];
                  queryClient.invalidateQueries({ queryKey: ['/api/campaigns/active'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/today'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/month'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats/total'] });
                  queryClient.invalidateQueries({ queryKey: [`/api/community/impact/${today}`] });
                  
                  // Show success toast
                  toast({
                    title: "Donation Complete!",
                    description: `Your ${donation.buttonType.replace('_', ' ')} action has been recorded.`,
                  });
                  
                  // Check if congratulations should be shown
                  if (checkAndShowCongratulations('tzedaka')) {
                    openModal('congratulations', 'tzedaka');
                  } else {
                    // Only navigate if congratulations wasn't shown
                    setTimeout(() => {
                      setLocation('/?scrollToProgress=true');
                    }, 1000);
                  }
                } else {
                  console.log('BACKUP: No completion found yet');
                }
              })
              .catch((error) => {
                console.error('BACKUP: Error checking completion:', error);
                // Fallback - just clear the pending donation
                localStorage.removeItem('pending_donation');
              });
          }
        } else {
          // Clear old pending donations and redirect flag
          localStorage.removeItem('pending_donation');
          localStorage.removeItem('has_been_redirected_to_stripe');
          setShowLoadingScreen(false);
        }
      } catch (error) {
        console.error('Error processing pending donation:', error);
        localStorage.removeItem('pending_donation');
        localStorage.removeItem('has_been_redirected_to_stripe');
        setShowLoadingScreen(false);
      }
    }

    // (Old cancellation logic removed - now handled above with hasBeenRedirected check)

    // Prevent session recreation if we've already redirected to Stripe
    if (hasRedirectedToStripeRef.current || hasBeenRedirected) {
      console.log('Already redirected to Stripe, preventing recreation...');
      return;
    }

    if (amount <= 0) {
      setLocation('/');
      return;
    }

    // Mark that we're about to redirect to Stripe
    hasRedirectedToStripeRef.current = true;
    localStorage.setItem('has_been_redirected_to_stripe', 'true');

    apiRequest('POST', '/api/create-session-checkout', {
      amount,
      donationType,
      metadata: {
        buttonType, // Essential for tracking which button was clicked
        sponsorName,
        dedication,
        message,
        timestamp: new Date().toISOString()
      },
      returnUrl: `${window.location.origin}/donate?success=true&amount=${amount}&type=${donationType}&buttonType=${buttonType}&sponsor=${sponsorName}&dedication=${dedication}&message=${message}`,
      email: "" // Will be filled by user in the form
    })
      .then(async (response) => {
        const stripe = await stripePromise;
        const sessionId = response.data.sessionId;
        console.log('Redirecting to Stripe Checkout with session ID:', sessionId);
        
        // Store session info for completion tracking backup
        localStorage.setItem('pending_donation', JSON.stringify({
          sessionId: sessionId,
          buttonType: buttonType,
          amount: amount,
          timestamp: new Date().toISOString()
        }));
        
        return stripe && stripe.redirectToCheckout({ sessionId: sessionId });
      })
      .catch((error) => {
        console.error('Error creating session:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        
        // Reset the refs on error so user can retry if needed
        paymentIntentCreatedRef.current = false;
        hasRedirectedToStripeRef.current = false;
        localStorage.removeItem('has_been_redirected_to_stripe');
        
        toast({
          title: "Payment Setup Failed",
          description: `Unable to initialize payment: ${error.response?.data?.message || error.message}`,
          variant: "destructive",
        });
      });
  }, []); // Empty dependency array - run only once on mount



  const handleBackToApp = () => {
    // Navigate to home with scroll to progress to show flower growth
    setLocation('/?scrollToProgress=true');
  };

  if (donationComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-sage to-sage/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Heart className="text-white fill-white" size={40} />
          </div>
          
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Thank You!</h1>
          <p className="text-lg text-gray-600 mb-2">
            Your donation has been processed successfully.
          </p>
          <p className="text-xl font-semibold text-blush mb-6">
            ${amount || '0'} - {donationType}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Thank you so much for doing Tzedaka through Ezras Nashim, may you merit to do many more holy mitzvas!
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

  // Show loading spinner while redirecting to Stripe
  if (showLoadingScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory via-lavender/20 to-blush/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blush/20 border-t-blush rounded-full mx-auto mb-4"></div>
          <p className="text-warm-gray platypi-medium">Processing your donation...</p>
        </div>
      </div>
    );
  }

  // If we get here, user cancelled or something went wrong - redirect to home
  return null;
}
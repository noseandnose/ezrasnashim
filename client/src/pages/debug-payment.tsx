import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DebugPayment() {
  const [, setLocation] = useLocation();

  const testSponsorDayFlow = () => {
    // Simulate the sponsor day modal flow
    const params = new URLSearchParams({
      amount: '180',
      type: 'Sponsor a Day of Ezras Nashim',
      sponsor: 'Test User',
      dedication: 'Test Dedication',
      message: 'Test Message'
    });
    
    // Testing sponsor day flow
    
    setLocation(`/donate?${params.toString()}`);
  };

  const testCampaignFlow = () => {
    // Simulate a campaign donation flow
    const params = new URLSearchParams({
      amount: '50',
      type: "Women's Causes Support",
      sponsor: 'Test Donor',
      dedication: 'Test Campaign Donation'
    });
    
    // Testing campaign flow
    
    setLocation(`/donate?${params.toString()}`);
  };

  const testPutCoinFlow = () => {
    // Simulate put a coin flow
    const params = new URLSearchParams({
      amount: '18',
      type: 'General Donation',
      sponsor: 'Anonymous',
      dedication: ''
    });
    
    // Testing put coin flow
    
    setLocation(`/donate?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Payment Flows</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Flow Testing</h2>
          <p className="text-gray-600 mb-6">
            Test each donation flow to identify where the payment failure occurs. 
            Check the browser console for detailed logging.
          </p>
          
          <div className="space-y-4">
            <Button 
              onClick={testSponsorDayFlow}
              className="w-full p-4 text-left"
              variant="outline"
            >
              <div>
                <div className="font-semibold">Test Sponsor Day Flow</div>
                <div className="text-sm text-gray-500">$180 fixed amount - Most commonly used</div>
              </div>
            </Button>
            
            <Button 
              onClick={testCampaignFlow}
              className="w-full p-4 text-left"
              variant="outline"
            >
              <div>
                <div className="font-semibold">Test Campaign Donation</div>
                <div className="text-sm text-gray-500">$50 custom amount - Campaign donation</div>
              </div>
            </Button>
            
            <Button 
              onClick={testPutCoinFlow}
              className="w-full p-4 text-left"
              variant="outline"
            >
              <div>
                <div className="font-semibold">Test Put a Coin</div>
                <div className="text-sm text-gray-500">$18 amount - Quick donation</div>
              </div>
            </Button>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li>Open browser developer console (F12)</li>
            <li>Click one of the test buttons above</li>
            <li>Try to complete the payment process</li>
            <li>Check console for detailed error logs</li>
            <li>Note exactly where the process fails</li>
          </ol>
        </div>
        
        <div className="mt-6 flex space-x-4">
          <Button onClick={() => setLocation('/')} variant="outline">
            Back to Home
          </Button>
          <Button onClick={() => setLocation('/test-payment')}>
            System Diagnostics
          </Button>
        </div>
      </div>
    </div>
  );
}
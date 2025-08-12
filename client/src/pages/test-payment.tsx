import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function TestPayment() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const { toast } = useToast();

  const addResult = (title: string, result: any, success: boolean) => {
    setTestResults(prev => [...prev, { title, result, success, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setTestResults([]);
    
    // Test 1: Stripe connection
    try {
      const stripeTest = await apiRequest("GET", "/api/stripe-test");
      addResult("Stripe Connection", stripeTest.data, true);
    } catch (error: any) {
      addResult("Stripe Connection", error.response?.data || error.message, false);
    }

    // Test 2: Payment Intent Creation
    try {
      const paymentIntent = await apiRequest("POST", "/api/create-payment-intent", {
        amount: 5,
        donationType: "Test Payment",
        metadata: { test: true }
      });
      addResult("Payment Intent Creation", paymentIntent.data, true);
    } catch (error: any) {
      addResult("Payment Intent Creation", error.response?.data || error.message, false);
    }

    // Test 3: Apple Pay Domain Verification
    try {
      const domainVerification = await fetch('/.well-known/apple-developer-merchantid-domain-association');
      const content = await domainVerification.text();
      addResult("Apple Pay Domain Verification", { 
        status: domainVerification.status, 
        hasContent: content.length > 0 
      }, domainVerification.ok);
    } catch (error: any) {
      addResult("Apple Pay Domain Verification", error.message, false);
    }

    // Test 4: Stripe Public Key
    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    addResult("Stripe Public Key", { 
      exists: !!publicKey, 
      startsWithPk: publicKey?.startsWith('pk_'),
      length: publicKey?.length 
    }, !!publicKey && publicKey.startsWith('pk_'));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Payment System Diagnostics</h1>
        
        <Button onClick={runTests} className="mb-6">
          Run All Tests
        </Button>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{result.title}</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-sm ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {result.success ? 'PASS' : 'FAIL'}
                  </span>
                  <span className="text-gray-500 text-sm">{result.timestamp}</span>
                </div>
              </div>
              <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
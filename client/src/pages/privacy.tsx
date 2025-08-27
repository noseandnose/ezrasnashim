import { useEffect } from "react";
import { X, Minus, Plus } from "lucide-react";
import { useState } from "react";

export default function Privacy() {
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    // Prevent scrolling on the background
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.max(12, Math.min(24, prev + delta)));
  };

  const privacyContent = `Ezras Nashim — Privacy Policy

Last updated: August 27, 2025

Ezras Nashim ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and the choices you have. It applies to our website, PWA, and mobile apps (the "App").

**Quick summary:** We only collect what's needed to run the App (e.g., location for halachic times/compass if you allow it, basic analytics to improve features, and donation details via trusted payment processors). We don't sell your data or use third-party ads.

## Who we are & how to contact us

**Controller:** Ezras Nashim
**Email:** team@ezrasnashim.app

## Information we collect

### 1) Information you provide

**Donations:** Name, email, amount, currency, and receipt details. We never store full payment card numbers.

**Feedback & support:** Your email and the content of your message.

**Community inputs (optional):** If you submit names for the Global Tehillim system or similar features, those names may be visible to other users. Please avoid sensitive personal information.

### 2) Information we collect automatically

**Usage & analytics:** Event counts (e.g., features used, completions, streaks), performance & crash diagnostics, device type, and approximate IP-based region.

**Location (only with your permission):** Used to calculate zmanim and direction (e.g., compass). By default, location is processed on your device. If a server lookup is required, coordinates may be transmitted transiently and not stored.

**Notifications:** A device token so we can send reminders (e.g., a daily check-in). You can opt out in device settings.

**Local storage:** We use local storage/cookies to remember preferences and progress.

### 3) Donations & payments

We use trusted payment processors (e.g., Stripe, FundraiseUp) to process donations. They receive your payment details directly and act as independent controllers for that data. Please refer to their privacy policies for more information.

## How we use your information

**Provide the App:** Show halachic times, compass, Torah/Tefilla/Tzedaka flows, donation functionality, and your progress/stats.

**Improve & secure the App:** Debugging, analytics, and fraud prevention.

**Communicate with you:** Send receipts, support replies, and optional reminders/notifications.

**Legal & compliance:** Tax-compliant donation records and required disclosures.

**Legal bases (GDPR/UK GDPR):** performance of a contract, our legitimate interests in running and improving the App, your consent (e.g., location/notifications), and legal obligations (e.g., tax).

## Sharing your information

We do not sell your personal information. We share only with:

**Service providers:** Hosting, databases, analytics, crash/error reporting, and notifications (e.g., APNs/FCM).

**Payment processors:** To complete donations (e.g., Stripe, FundraiseUp).

**Legal & safety:** If required by law or to protect rights and safety.

If you choose community features (e.g., submitting names for Tehillim), the content you submit may be visible to others.

## Data retention

**Donation records:** Kept as required for tax and accounting (typically up to 7 years).

**Analytics & logs:** Kept for the shortest practical time (typically 12–24 months) and then aggregated or deleted.

**Local device data:** Remains on your device until you delete the App or clear storage.

## Your choices & rights

**Location & notifications:** Enable/disable anytime in your device settings.

**Access, correction, deletion:** You can request a copy or deletion of your data by emailing team@ezrasnashim.app. If you don't have an account, we may verify using your device token or donation email/receipt details.

**Do Not Track/Marketing:** We don't run third-party ads or sell data.

**GDPR/UK GDPR rights:** Access, rectification, erasure, portability, restriction, and objection; you may withdraw consent at any time.

**CCPA/CPRA (California):** Right to know, delete, correct, and opt-out of "sale"/"sharing" (not applicable—we don't sell/share). We will not discriminate for exercising rights.

## Children's privacy

The App is designed for adults. We do not knowingly collect personal information from children under 13 (or under the age required by local law). If you believe a child provided personal information, contact us and we will delete it.

## Security

We use industry-standard safeguards (e.g., HTTPS, access controls, encryption at rest by our providers). No method is 100% secure, but we continuously work to protect your data.

## International transfers

We operate from Israel and may use service providers in the EU, UK, and US. Where required, transfers rely on appropriate safeguards (e.g., Standard Contractual Clauses).

## Changes to this policy

We may update this Policy from time to time. We will change the "Last updated" date and, where appropriate, notify you in the App.

## Contact

Questions or requests? Email team@ezrasnashim.app.

---

**App Store/Play Store short summary (optional)**

**Privacy Summary:** We collect limited data to run Ezras Nashim—usage analytics, optional location for halachic times/compass, notification tokens for reminders, and donation details via trusted processors (no card storage). We don't sell data or show third-party ads. Manage location/notifications in device settings. Contact: team@ezrasnashim.app.`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blush to-sand rounded-t-xl">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-playfair font-bold text-white">
              Privacy Policy
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Font Size Controls */}
            <div className="flex items-center bg-white/20 rounded-full px-3 py-1 space-x-2">
              <button
                onClick={() => adjustFontSize(-2)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                disabled={fontSize <= 12}
              >
                <Minus className="w-4 h-4 text-white" />
              </button>
              <span className="text-white text-sm font-medium">A</span>
              <button
                onClick={() => adjustFontSize(2)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                disabled={fontSize >= 24}
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div 
            className="prose prose-gray max-w-none"
            style={{ fontSize: `${fontSize}px` }}
          >
            <div 
              className="whitespace-pre-line leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ 
                __html: privacyContent
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-900">$1</h2>')
                  .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800">$1</h3>')
              }}
            />
          </div>
        </div>
        
      </div>
    </div>
  );
}
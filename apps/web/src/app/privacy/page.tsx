import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 md:px-8 bg-background text-foreground">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: June 13, 2026</p>
      
      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p>
            We collect personal information necessary to deliver educational tracking and subscription services. This includes parent names, child enrolment details, transaction logs, and platform authentication data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Protect Your Payment Data</h2>
          <p>
            Your payment processing is handled securely by third-party payment gateways (Razorpay, Google Play Billing, and Apple App Store Billing). We do not store or process raw card details, CVVs, or payment passwords directly on our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Subscription Billing & Auto-Renewals</h2>
          <p>
            Subscriptions are billed on a recurring monthly, quarterly, or yearly cycle. By enabling subscription payments, you consent to automatic billing transitions in accordance with your respective mobile platform account preferences.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Cookies and Analytical Tracking</h2>
          <p>
            We use analytic tracking platforms such as PostHog to analyze application performance, interface bottlenecks, and subscription conversions. This data is strictly used to enhance the user experience of school administration and parent portals.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Contact Support</h2>
          <p>
            For privacy inquiries or payment resolution support, please contact our support desk through the support tickets panel in the application or email support@school-web.example.com.
          </p>
        </section>
      </div>
    </div>
  );
}

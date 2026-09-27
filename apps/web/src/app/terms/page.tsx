import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 md:px-8 bg-background text-foreground">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: June 13, 2026</p>
      
      <div className="space-y-8 text-sm md:text-base leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Agreement to Terms</h2>
          <p>
            By accessing and purchasing B2C parent premium subscriptions, you agree to comply with and be bound by these Terms of Service, along with Google Play Store and Apple App Store standard end-user license agreements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Cancellation Policy & Easy Management</h2>
          <p>
            You may cancel your subscription at any time. To cancel:
          </p>
          <ul className="list-disc list-inside mt-2 pl-4 space-y-1">
            <li>For Google Play: Manage subscriptions inside Play Store account settings.</li>
            <li>For Apple App Store: Manage subscriptions inside App Store account settings.</li>
            <li>For Web orders: Trigger cancellation directly in the Subscription Settings tab of the parent portal.</li>
          </ul>
          <p className="mt-3">
            Following cancellation, your premium features remain active until the end of the current billing cycle.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Refund Policy</h2>
          <p>
            Subscription payments are non-refundable. Exceptional refund queries must be resolved directly through the platform provider (Apple or Google) where payment was initiated.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Limitation of Liability</h2>
          <p>
            The B2C Parent premium features are provided on an "as-is" basis. We make no warranty that academic metrics, chat systems, or notifications will always be uninterrupted or error-free.
          </p>
        </section>
      </div>
    </div>
  );
}

import React from 'react';
import { Shield } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mt-1">Last updated: July 12, 2026</p>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-sm text-foreground">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Introduction</h2>
          <p className="text-muted-foreground">
            DecibelDash is created by R&R Gaming. It is a keyboard sound analysis tool that
            records, stores, and compares the acoustic profiles and typing speed of mechanical
            keyboards. Your privacy is important to us, and this policy explains how data is
            handled within the app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. What Data DecibelDash Collects</h2>
          <p className="text-muted-foreground mb-2">DecibelDash does NOT collect personal data such as:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Name</li>
            <li>Email</li>
            <li>Phone number</li>
            <li>Location</li>
            <li>Contacts</li>
            <li>Device identifiers</li>
            <li>Account information</li>
          </ul>
          <p className="text-muted-foreground mt-3">DecibelDash also:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Does NOT track users.</li>
            <li>Does NOT store audio recordings.</li>
            <li>Does NOT send audio to external servers.</li>
            <li>Does NOT use third-party analytics SDKs.</li>
            <li>Does NOT share data with advertisers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Microphone Access</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>The microphone is used only to analyze keystroke sounds.</li>
            <li>Audio is processed locally on the device.</li>
            <li>No audio is uploaded, stored, transmitted, or shared.</li>
            <li>Users can disable microphone access at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Keyboard Input Access</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Keystrokes are used only to detect keypress timing.</li>
            <li>Keystrokes are not stored, not transmitted, and not logged.</li>
            <li>No personal typing content is captured.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">5. Subscription &amp; Billing</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>DecibelDash uses Google Play Billing for subscriptions.</li>
            <li>Payment information is handled exclusively by Google Play.</li>
            <li>DecibelDash does not receive or store credit card details.</li>
            <li>Stripe is used only for backend business operations — not for in-app payments.</li>
            <li>Stripe does not collect user data from the app.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Third-Party Services</h2>
          <p className="text-muted-foreground mb-2">The services used are:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Google Play Billing</li>
            <li>Stripe (business backend only)</li>
            <li>Base44 (website hosting only)</li>
          </ul>
          <p className="text-muted-foreground mt-3">
            None of these services receive personal data from the app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">7. Children's Privacy</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>DecibelDash is not directed at children under 13.</li>
            <li>No personal data is collected from children.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">8. Security</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>All processing happens locally on the device.</li>
            <li>No personal data is transmitted.</li>
            <li>No cloud storage is used.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">9. User Rights</h2>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Users can revoke microphone permission.</li>
            <li>Users can uninstall the app at any time.</li>
            <li>Users can contact us for questions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">10. Contact Information</h2>
          <p className="text-muted-foreground">R&amp;R Gaming / DecibelDash Support</p>
          <p className="text-muted-foreground">Email: support@decibeldash.com</p>
          <p className="text-muted-foreground">Website: https://decibeldash.com</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">11. Policy Updates</h2>
          <p className="text-muted-foreground">
            We may update this privacy policy from time to time. Any changes will be posted on
            this page.
          </p>
        </section>
      </div>
    </div>
  );
}
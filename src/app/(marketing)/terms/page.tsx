import Link from 'next/link'
import { Logo } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | UGCFirst',
  description: 'Terms of Service for UGCFirst - AI-powered UGC video generation platform',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-border-default bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <Link href="/">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Terms of Service</h1>
          <p className="text-text-muted">Last updated: March 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          {/* Agreement */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">1. Agreement to Terms</h2>
            <p className="text-text-secondary leading-relaxed">
              By accessing or using UGCFirst (&quot;Service&quot;), operated by AZ Foundry LLC, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Service. These terms apply to all users, including visitors,
              free users, and paying subscribers.
            </p>
          </section>

          {/* Description of Service */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">2. Description of Service</h2>
            <p className="text-text-secondary leading-relaxed">
              UGCFirst is an AI-powered platform that helps businesses create user-generated content (UGC) style videos for marketing purposes.
              Our service includes video generation, script writing, social media scheduling, and related features. The Service uses artificial
              intelligence to generate content based on your inputs.
            </p>
          </section>

          {/* Accounts */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">3. Accounts</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              To use most features of UGCFirst, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>Provide accurate and complete information when creating your account</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Create only one account per person or business entity</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              We reserve the right to suspend or terminate accounts that violate these terms or engage in fraudulent activity.
            </p>
          </section>

          {/* Subscriptions & Billing */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">4. Subscriptions & Billing</h2>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Payment</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Subscriptions are billed monthly or annually in advance. Payment is processed securely through Stripe.
              By subscribing, you authorize us to charge your payment method on a recurring basis until you cancel.
            </p>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Cancellation</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your
              current billing period. You will retain access to paid features until that date.
            </p>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Refunds</h3>
            <p className="text-text-secondary leading-relaxed">
              Subscription fees are non-refundable, except as required by law. Credit packs are non-refundable once credits have been used.
              If you experience technical issues preventing use of the Service, contact support for assistance.
            </p>
          </section>

          {/* Credit System */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">5. Credit System</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              UGCFirst operates on a credit-based system. Different actions consume different amounts of credits:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>Video generation costs vary based on features (captions, mode, etc.)</li>
              <li>Social media scheduling may consume additional credits</li>
              <li>Credit costs are displayed before each action</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              Purchased credits are valid for 12 months from the date of purchase. Subscription credits reset each billing cycle and do not
              roll over to the next period. Unused subscription credits are forfeited when you downgrade or cancel.
            </p>
          </section>

          {/* Content & IP */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">6. Content & Intellectual Property</h2>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Your Content</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              You retain ownership of videos generated using UGCFirst. You may use these videos for any lawful commercial or personal purpose.
              You represent that you have the necessary rights to any product images, URLs, or other content you submit for video generation.
            </p>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Our Content</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              The UGCFirst platform, including its design, code, AI models, and documentation, is owned by AZ Foundry LLC.
              You may not copy, modify, or reverse-engineer any part of the Service.
            </p>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Usage Rights</h3>
            <p className="text-text-secondary leading-relaxed">
              We may use anonymized and aggregated data about service usage to improve our AI models and platform.
              We will not use your specific product content for purposes unrelated to providing the Service without your consent.
            </p>
          </section>

          {/* AI-Generated Content */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">7. AI-Generated Content</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Videos created by UGCFirst are generated using artificial intelligence. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>AI-generated content may not be perfect and may require review</li>
              <li>We do not guarantee specific results, conversion rates, or business outcomes</li>
              <li>Generated avatars and voices are synthetic and should be disclosed if required by applicable laws</li>
              <li>You are responsible for reviewing content before publishing</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">8. Acceptable Use</h2>
            <p className="text-text-secondary leading-relaxed mb-4">You agree NOT to use UGCFirst to:</p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>Generate illegal, harmful, defamatory, or obscene content</li>
              <li>Impersonate real individuals without their consent</li>
              <li>Create misleading or deceptive advertising</li>
              <li>Infringe on third-party intellectual property rights</li>
              <li>Abuse, spam, or overload our systems</li>
              <li>Resell or redistribute credits to third parties</li>
              <li>Circumvent usage limits or security measures</li>
              <li>Generate content for products or services that violate the law</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              Violation of these rules may result in immediate account termination without refund.
            </p>
          </section>

          {/* Social Scheduling */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">9. Social Media Scheduling</h2>
            <p className="text-text-secondary leading-relaxed">
              If you connect your social media accounts through our scheduling feature (powered by Late API), you authorize us to
              post content to those accounts on your behalf at the times you specify. You are solely responsible for the content
              posted to your social media accounts and for compliance with each platform&apos;s terms of service. We are not liable
              for any consequences of scheduled posts, including account suspensions or content removal by third-party platforms.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">10. Limitation of Liability</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT
              PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>We do not guarantee uninterrupted or error-free service</li>
              <li>We are not liable for any indirect, incidental, or consequential damages</li>
              <li>Our total liability is limited to the amount you paid us in the past 12 months</li>
              <li>We are not responsible for business losses resulting from AI-generated content</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">11. Termination</h2>
            <p className="text-text-secondary leading-relaxed">
              Either party may terminate this agreement at any time. You may delete your account through your account settings
              or by contacting support. We may terminate or suspend your account for violation of these terms. Upon termination,
              your right to use the Service ceases immediately. We will delete your personal data within 30 days of account deletion,
              subject to legal retention requirements.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">12. Governing Law</h2>
            <p className="text-text-secondary leading-relaxed">
              These Terms are governed by the laws of the United States. Any disputes arising from these Terms or your use of the
              Service shall be resolved in the courts of the United States. You agree to submit to the personal jurisdiction of
              such courts.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">13. Changes to Terms</h2>
            <p className="text-text-secondary leading-relaxed">
              We may update these Terms from time to time. We will notify you of material changes by email or by posting a notice
              on our website. Your continued use of UGCFirst after changes become effective constitutes acceptance of the new terms.
              If you do not agree to the updated terms, you must stop using the Service.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">14. Contact</h2>
            <p className="text-text-secondary leading-relaxed">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-surface rounded-lg border border-border-default">
              <p className="text-text-primary font-medium">AZ Foundry LLC (dba UGCFirst)</p>
              <p className="text-text-secondary">Email: support@ugcfirst.com</p>
              <p className="text-text-secondary">Website: ugcfirst.com</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-default py-8 px-6 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <p>&copy; 2026 UGCFirst. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-text-primary font-medium">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

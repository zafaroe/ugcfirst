import Link from 'next/link'
import { Logo } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | UGCFirst',
  description: 'Privacy Policy for UGCFirst - AI-powered UGC video generation platform',
}

export default function PrivacyPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">Privacy Policy</h1>
          <p className="text-text-muted">Last updated: March 2026</p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">1. Introduction</h2>
            <p className="text-text-secondary leading-relaxed">
              AZ Foundry LLC, doing business as UGCFirst (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), operates the UGCFirst platform at ugcfirst.com.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered
              video generation service. By using UGCFirst, you consent to the practices described in this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Account Information</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              When you create an account, we collect your name, email address, and authentication credentials.
              If you sign up using Google, we receive basic profile information from your Google account.
            </p>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Payment Information</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              Payment processing is handled by Stripe. We do not store your credit card numbers or banking details.
              Stripe provides us with limited information such as the last four digits of your card and billing address for record-keeping.
            </p>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Usage Data</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              We collect information about how you use UGCFirst, including videos generated, features accessed,
              product URLs submitted, and interaction patterns. This helps us improve our service.
            </p>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Product Content</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              When you generate videos, you may provide product URLs, images, and descriptions. These are processed
              by our AI models to create your videos. We store this content to deliver and improve our services.
            </p>

            <h3 className="text-lg font-medium text-text-primary mt-6 mb-3">Cookies</h3>
            <p className="text-text-secondary leading-relaxed">
              We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">3. How We Use Your Information</h2>
            <p className="text-text-secondary leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li>Provide and maintain the UGCFirst service</li>
              <li>Process your video generation requests</li>
              <li>Manage your account and subscription</li>
              <li>Process payments and send billing notifications</li>
              <li>Send important service updates and announcements</li>
              <li>Respond to your support requests</li>
              <li>Improve our AI models and service quality</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">4. Third-Party Services</h2>
            <p className="text-text-secondary leading-relaxed mb-4">We work with trusted third-party services:</p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li><strong>Stripe</strong> &mdash; Secure payment processing</li>
              <li><strong>Supabase</strong> &mdash; Authentication and database services</li>
              <li><strong>Cloudflare</strong> &mdash; Content delivery and media storage</li>
              <li><strong>AI Services</strong> &mdash; Video and content generation (product URLs and images are processed by AI models)</li>
              <li><strong>Late API</strong> &mdash; Social media scheduling (only if you connect your social accounts)</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              Each third-party service has its own privacy policy governing their use of your data.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">5. Data Retention</h2>
            <p className="text-text-secondary leading-relaxed">
              We retain your account data for as long as your account is active. Generated videos are stored in our cloud
              infrastructure so you can access them. When you delete your account, we delete your personal data within 30 days,
              though we may retain anonymized usage data for analytics.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">6. Your Rights</h2>
            <p className="text-text-secondary leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-text-secondary">
              <li><strong>Access</strong> &mdash; Request a copy of your personal data</li>
              <li><strong>Delete</strong> &mdash; Request deletion of your account and associated data</li>
              <li><strong>Opt Out</strong> &mdash; Unsubscribe from marketing emails at any time</li>
              <li><strong>Export</strong> &mdash; Download your generated videos and data</li>
              <li><strong>Correct</strong> &mdash; Update inaccurate personal information</li>
            </ul>
            <p className="text-text-secondary leading-relaxed mt-4">
              To exercise these rights, contact us at support@ugcfirst.com.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">7. Security</h2>
            <p className="text-text-secondary leading-relaxed">
              We implement industry-standard security measures to protect your data. All data is encrypted in transit using TLS.
              We use secure authentication methods and regularly review our security practices. However, no method of transmission
              over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
            <p className="text-text-secondary leading-relaxed mt-4 font-medium">
              We do not sell your personal data to third parties.
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-text-secondary leading-relaxed">
              UGCFirst is not intended for users under the age of 18. We do not knowingly collect personal information from children.
              If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">9. Changes to This Policy</h2>
            <p className="text-text-secondary leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by email or
              by posting a notice on our website. Your continued use of UGCFirst after changes become effective constitutes
              acceptance of the revised policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">10. Contact Us</h2>
            <p className="text-text-secondary leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
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
            <Link href="/privacy" className="text-text-primary font-medium">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

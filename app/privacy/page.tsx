'use client'
import PageShell from '@/components/PageShell'

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="Last updated: May 2026">
      <div className="bg-white rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(28,28,25,0.06)] text-[14px] leading-[1.8] text-[#4f4633] [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-[#1c1c19] [&_h2]:mt-7 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_li]:marker:text-[#fbbf24] [&_a]:font-semibold [&_a]:text-[#795900] [&_a:hover]:underline [&_strong]:text-[#1c1c19]">

        <h2>1. Information We Collect</h2>
        <p>When you use BuddyBooks, we collect the following information:</p>
        <ul>
          <li><strong>Account info:</strong> Your name, email address, and profile photo via Google Sign-In (through Clerk).</li>
          <li><strong>Phone number:</strong> Your WhatsApp number, which you provide when posting a listing. This is used so buyers can contact you directly.</li>
          <li><strong>Listing data:</strong> Photos, titles, prices, and descriptions you post.</li>
          <li><strong>Usage data:</strong> Pages visited, listings viewed, and actions taken on the platform.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Display your listings to potential buyers on the BuddyBooks marketplace.</li>
          <li>Allow buyers to contact you via WhatsApp when they tap the contact button on your listing.</li>
          <li>Send you notifications about your listings (approvals, inquiries).</li>
          <li>Improve the platform and prevent misuse.</li>
          <li>Process payments for featured listings and school kit bundles via Razorpay.</li>
        </ul>

        <h2>3. How We Share Your Information</h2>
        <p>We do not sell your personal information. Your WhatsApp number is only shared with buyers who explicitly tap the &quot;Contact on WhatsApp&quot; button on your listing. We share data with:</p>
        <ul>
          <li><strong>Clerk:</strong> For authentication (Google Sign-In).</li>
          <li><strong>Razorpay:</strong> For payment processing. Razorpay&apos;s privacy policy applies to payment data.</li>
          <li><strong>Supabase:</strong> For storing listing images.</li>
          <li><strong>Vercel / Neon:</strong> For hosting and database services.</li>
        </ul>

        <h2>4. Data Storage and Security</h2>
        <p>Your data is stored securely on Neon PostgreSQL and Supabase cloud infrastructure. We use industry-standard encryption for data in transit (HTTPS). While we take reasonable precautions, no system is 100% secure. Please do not share sensitive financial information on the platform.</p>

        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Request deletion of your account and associated data.</li>
          <li>Update or correct your information via your profile.</li>
          <li>Remove your listings at any time.</li>
        </ul>
        <p>To exercise these rights, contact us at <a href="mailto:support@buddybooks.in">support@buddybooks.in</a>.</p>

        <h2>6. Cookies</h2>
        <p>BuddyBooks uses cookies for authentication (via Clerk) and to remember your preferences. You can disable cookies in your browser settings, but this may affect functionality.</p>

        <h2>7. Children&apos;s Privacy</h2>
        <p>BuddyBooks is intended for users aged 13 and above. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.</p>

        <h2>8. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify users of significant changes via a notice on the platform. Continued use of BuddyBooks after changes constitutes acceptance of the updated policy.</p>
      </div>
      <div className="mt-6 text-center text-[12px] text-[#817661]">
        BuddyBooks · Bedi Book Store · Sector 40-C, Chandigarh
      </div>
    </PageShell>
  )
}

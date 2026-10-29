'use client'
import PageShell from '@/components/PageShell'

export default function TermsPage() {
  return (
    <PageShell title="Terms & Conditions" subtitle="Last updated: May 2026">
      <div className="bg-white rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(28,28,25,0.06)] text-[14px] leading-[1.8] text-[#4f4633] [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-[#1c1c19] [&_h2]:mt-7 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_li]:marker:text-[#fbbf24] [&_a]:font-semibold [&_a]:text-[#795900] [&_a:hover]:underline [&_strong]:text-[#1c1c19]">

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using BuddyBooks (buddybooks.in), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the platform. BuddyBooks is operated by Bedi Book Store, Sector 40-C, Chandigarh.</p>

        <h2>2. What BuddyBooks Is</h2>
        <p>BuddyBooks is a peer-to-peer marketplace for students in the Chandigarh Tricity area to buy and sell second-hand books, notebooks, and stationery. BuddyBooks also offers pre-assembled school kit bundles through Bedi Book Store. We are a platform — we do not own, inspect, or guarantee the quality of user-posted listings.</p>

        <h2>3. User Accounts</h2>
        <ul>
          <li>You must be at least 13 years old to create an account.</li>
          <li>You are responsible for maintaining the security of your account.</li>
          <li>You must provide accurate information, including a valid WhatsApp number when posting listings.</li>
          <li>You may not use another person's account or create multiple accounts to circumvent restrictions.</li>
        </ul>

        <h2>4. Listing Rules</h2>
        <p>When posting a listing, you agree that:</p>
        <ul>
          <li>You own the item and have the right to sell it.</li>
          <li>All information (title, price, condition, photos) is accurate and not misleading.</li>
          <li>You will only list books, notebooks, stationery, art supplies, and educational materials.</li>
          <li>You will not post offensive, fake, or spam listings.</li>
          <li>You understand listings are subject to review and may be rejected or removed at our discretion.</li>
          <li>At least 2 photos are required, including one showing the MRP/price tag.</li>
        </ul>

        <h2>5. Transactions & Safety</h2>
        <p>BuddyBooks does not process payments between buyers and sellers for peer-to-peer listings — all deals happen directly between parties via WhatsApp. We strongly recommend:</p>
        <ul>
          <li>Meeting in a public place (school campus, café, mall).</li>
          <li>Inspecting the item before paying.</li>
          <li>Never paying in advance or sharing OTPs or bank details.</li>
          <li>Bringing a friend when meeting a stranger.</li>
        </ul>
        <p>BuddyBooks is not responsible for any disputes, fraud, or losses arising from peer-to-peer transactions.</p>

        <h2>6. Payments (Featured Listings & School Kits)</h2>
        <p>Payments for featured listings and Bedi Book Store school kit bundles are processed securely via Razorpay. By making a payment, you agree to Razorpay's terms of service. Featured listing fees are non-refundable once the listing has been featured. School kit orders are subject to our refund policy below.</p>

        <h2>7. Refund Policy</h2>
        <ul>
          <li><strong>Featured listings:</strong> Non-refundable once activated.</li>
          <li><strong>School kit bundles:</strong> Full refund if cancelled before dispatch. No refund after delivery unless items are incorrect or damaged — contact us within 48 hours of delivery.</li>
          <li>To request a refund, contact <a href="mailto:support@buddybooks.in">support@buddybooks.in</a> or WhatsApp <a href="https://wa.me/919914735738">+91 99147 35738</a>.</li>
        </ul>

        <h2>8. Prohibited Conduct</h2>
        <p>You may not:</p>
        <ul>
          <li>Post false, misleading, or fraudulent listings.</li>
          <li>Harass, threaten, or abuse other users.</li>
          <li>Attempt to scrape, reverse-engineer, or exploit the platform.</li>
          <li>Use BuddyBooks to sell stolen or counterfeit goods.</li>
          <li>Create fake reviews or manipulate ratings.</li>
        </ul>
        <p>Violations may result in immediate account suspension and reporting to authorities if necessary.</p>

        <h2>9. Intellectual Property</h2>
        <p>The BuddyBooks name, logo, and platform design are owned by Bedi Book Store. User-uploaded content (photos, descriptions) remains your property, but by posting you grant BuddyBooks a non-exclusive licence to display it on the platform.</p>

        <h2>10. Disclaimer of Warranties</h2>
        <p>BuddyBooks is provided "as is" without warranties of any kind. We do not guarantee the accuracy of listings, the behaviour of users, or uninterrupted access to the platform.</p>

        <h2>11. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, BuddyBooks and Bedi Book Store shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including losses from peer-to-peer transactions.</p>

        <h2>12. Governing Law</h2>
        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Chandigarh, Punjab.</p>

        <h2>13. Contact</h2>
        <p>For any questions about these Terms, contact us at <a href="mailto:support@buddybooks.in">support@buddybooks.in</a> or visit Bedi Book Store, Sector 40-C, Chandigarh.</p>
      </div>
      <div className="mt-6 text-center text-[12px] text-[#817661]">
        BuddyBooks · Bedi Book Store · Sector 40-C, Chandigarh
      </div>
    </PageShell>
  )
}

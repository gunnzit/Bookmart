'use client'
import PageShell from '@/components/PageShell'

export default function RefundPage() {
  return (
    <PageShell title="Refund & Cancellation Policy" subtitle="Last updated: May 2026">

      <p className="text-[15px] text-[#4f4633] leading-relaxed mb-5">
        wrap&amp;read processes payments for two types of products — featured listings and Bedi Book Store school kit bundles. Our refund policy for each is outlined below.
      </p>

      <div className="bg-white rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(28,28,25,0.06)] text-[14px] leading-[1.8] text-[#4f4633] [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-[#1c1c19] [&_h2]:mt-7 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_li]:marker:text-[#fbbf24] [&_a]:font-semibold [&_a]:text-[#795900] [&_a:hover]:underline [&_strong]:text-[#1c1c19] !p-5 mb-3">
        <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#ffdf9f] text-[#5c4300] mb-2.5">⭐ Featured Listings</span>
        <h2 className="!mt-0">Featured Listing Fees</h2>
        <ul>
          <li>Featured listing fees (Basic ₹19, Standard ₹29, Premium ₹49) are <strong>non-refundable</strong> once the listing has been activated and is showing as featured on the marketplace.</li>
          <li>If your listing was not activated due to a technical error on our end, you are entitled to a full refund. Contact us within 24 hours.</li>
          <li>If payment was charged but the listing was rejected during review, a full refund will be processed within 5–7 business days.</li>
        </ul>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(28,28,25,0.06)] text-[14px] leading-[1.8] text-[#4f4633] [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-[#1c1c19] [&_h2]:mt-7 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_li]:marker:text-[#fbbf24] [&_a]:font-semibold [&_a]:text-[#795900] [&_a:hover]:underline [&_strong]:text-[#1c1c19] !p-5 mb-3">
        <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#ffdf9f] text-[#5c4300] mb-2.5">📦 School Kit Bundles</span>
        <h2 className="!mt-0">School Kit Bundle Orders</h2>
        <ul>
          <li><strong>Before dispatch:</strong> Full refund if you cancel before the kit is dispatched. Contact us immediately after placing your order.</li>
          <li><strong>After delivery — wrong items:</strong> If you receive incorrect books or items, we will replace or refund at no cost. Report within 48 hours of delivery with photos.</li>
          <li><strong>After delivery — damaged items:</strong> If items arrive damaged, report within 48 hours with photos for a replacement or refund.</li>
          <li><strong>After delivery — change of mind:</strong> We do not accept returns for change of mind once the kit has been delivered.</li>
          <li>Customised kits (where you selected specific items) are non-refundable unless items are wrong or damaged.</li>
        </ul>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(28,28,25,0.06)] text-[14px] leading-[1.8] text-[#4f4633] [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-[#1c1c19] [&_h2]:mt-7 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_li]:marker:text-[#fbbf24] [&_a]:font-semibold [&_a]:text-[#795900] [&_a:hover]:underline [&_strong]:text-[#1c1c19] !p-5 mb-3">
        <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#ffdf9f] text-[#5c4300] mb-2.5">🔄 Refund Process</span>
        <h2 className="!mt-0">How Refunds Are Processed</h2>
        <ul>
          <li>Approved refunds are credited back to the original payment method (UPI, card, net banking) via Razorpay.</li>
          <li>Refunds typically appear within <strong>5–7 business days</strong> after approval.</li>
          <li>You will receive a confirmation message on WhatsApp once your refund is initiated.</li>
        </ul>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(28,28,25,0.06)] text-[14px] leading-[1.8] text-[#4f4633] [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-[#1c1c19] [&_h2]:mt-7 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_li]:marker:text-[#fbbf24] [&_a]:font-semibold [&_a]:text-[#795900] [&_a:hover]:underline [&_strong]:text-[#1c1c19] !p-5 mb-3">
        <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#ffdf9f] text-[#5c4300] mb-2.5">❌ Peer-to-Peer Listings</span>
        <h2 className="!mt-0">Buying from Other Students</h2>
        <p>wrap&amp;read does not process payments for peer-to-peer listings between students. Payments happen directly between buyer and seller via cash on meeting. wrap&amp;read is not responsible for and cannot mediate disputes arising from student-to-student transactions. Please follow our safety guidelines and inspect items before paying.</p>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(28,28,25,0.06)] text-[14px] leading-[1.8] text-[#4f4633] [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-[#1c1c19] [&_h2]:mt-7 [&_h2]:mb-2 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_li]:mb-1 [&_li]:marker:text-[#fbbf24] [&_a]:font-semibold [&_a]:text-[#795900] [&_a:hover]:underline [&_strong]:text-[#1c1c19] !p-5 !bg-[#ffdf9f]/50 mt-2">
        <div className="text-[16px] font-bold text-[#1c1c19] mb-1">💬 Need help with a refund?</div>
        <p>Contact us and we'll resolve it quickly:</p>
        <ul>
          <li>Email: <a href="mailto:buddybookx@gmail.com">buddybookx@gmail.com</a></li>
          <li>WhatsApp: <a href="https://wa.me/919914735738">+91 99147 35738</a></li>
          <li>Visit: Bedi Book Store, Sector 40-C, Chandigarh</li>
        </ul>
      </div>
    </PageShell>
  )
}

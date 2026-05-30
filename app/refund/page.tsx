'use client'
import { useRouter } from 'next/navigation'

export default function RefundPage() {
  const router = useRouter()
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAFAF8; --bg-card: #FFFEF9; --nav-bg: #fff; --border: #EDE9E1;
      --text-primary: #1B2A4A; --text-secondary: #555; --text-muted: #999;
      --shadow-nav: 0 2px 12px rgba(27,42,74,0.06);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --bg-card: #1A1D27; --nav-bg: #13151F; --border: #2A2D3E;
        --text-primary: #E8E6F0; --text-secondary: #A0A4B8; --text-muted: #555878;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
    .kalam { font-family: 'Kalam', cursive; }
    h2 { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 28px 0 10px; }
    p, li { font-size: 14px; color: var(--text-secondary); line-height: 1.8; }
    ul { padding-left: 20px; margin: 8px 0; }
    li { margin-bottom: 4px; }
    a { color: #1D9E75; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .policy-card { background: var(--bg-card); border-radius: 14px; border: 1.5px solid var(--border); padding: 20px; margin-bottom: 12px; }
    .tag { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; margin-bottom: 10px; }
  `
  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 20px', height: '56px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => router.back()} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>←</button>
          <span className="kalam" style={{ fontSize: '17px', color: '#1D9E75', fontWeight: '700' }}>BuddyBooks</span>
        </nav>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '36px 20px 60px' }}>
          <h1 className="kalam" style={{ fontSize: '30px', color: 'var(--text-primary)', marginBottom: '6px' }}>Refund & Cancellation Policy</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>Last updated: May 2026</p>

          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.7 }}>
            BuddyBooks processes payments for two types of products — featured listings and Bedi Book Store school kit bundles. Our refund policy for each is outlined below.
          </p>

          <div className="policy-card">
            <span className="tag" style={{ background: 'rgba(245,158,11,0.12)', color: '#D97706' }}>⭐ Featured Listings</span>
            <h2 style={{ marginTop: 0 }}>Featured Listing Fees</h2>
            <ul>
              <li>Featured listing fees (Basic ₹19, Standard ₹29, Premium ₹49) are <strong>non-refundable</strong> once the listing has been activated and is showing as featured on the marketplace.</li>
              <li>If your listing was not activated due to a technical error on our end, you are entitled to a full refund. Contact us within 24 hours.</li>
              <li>If payment was charged but the listing was rejected during review, a full refund will be processed within 5–7 business days.</li>
            </ul>
          </div>

          <div className="policy-card">
            <span className="tag" style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}>📦 School Kit Bundles</span>
            <h2 style={{ marginTop: 0 }}>School Kit Bundle Orders</h2>
            <ul>
              <li><strong>Before dispatch:</strong> Full refund if you cancel before the kit is dispatched. Contact us immediately after placing your order.</li>
              <li><strong>After delivery — wrong items:</strong> If you receive incorrect books or items, we will replace or refund at no cost. Report within 48 hours of delivery with photos.</li>
              <li><strong>After delivery — damaged items:</strong> If items arrive damaged, report within 48 hours with photos for a replacement or refund.</li>
              <li><strong>After delivery — change of mind:</strong> We do not accept returns for change of mind once the kit has been delivered.</li>
              <li>Customised kits (where you selected specific items) are non-refundable unless items are wrong or damaged.</li>
            </ul>
          </div>

          <div className="policy-card">
            <span className="tag" style={{ background: 'rgba(59,130,246,0.12)', color: '#2563EB' }}>🔄 Refund Process</span>
            <h2 style={{ marginTop: 0 }}>How Refunds Are Processed</h2>
            <ul>
              <li>Approved refunds are credited back to the original payment method (UPI, card, net banking) via Razorpay.</li>
              <li>Refunds typically appear within <strong>5–7 business days</strong> after approval.</li>
              <li>You will receive a confirmation message on WhatsApp once your refund is initiated.</li>
            </ul>
          </div>

          <div className="policy-card">
            <span className="tag" style={{ background: 'rgba(239,68,68,0.1)', color: '#DC2626' }}>❌ Peer-to-Peer Listings</span>
            <h2 style={{ marginTop: 0 }}>Buying from Other Students</h2>
            <p>BuddyBooks does not process payments for peer-to-peer listings between students. Payments happen directly between buyer and seller via cash on meeting. BuddyBooks is not responsible for and cannot mediate disputes arising from student-to-student transactions. Please follow our safety guidelines and inspect items before paying.</p>
          </div>

          <div style={{ background: '#E1F5EE', borderRadius: '14px', padding: '20px', border: '1px solid rgba(29,158,117,0.2)', marginTop: '8px' }}>
            <div className="kalam" style={{ fontSize: '16px', color: '#0F6E56', marginBottom: '8px' }}>💬 Need help with a refund?</div>
            <p>Contact us and we'll resolve it quickly:</p>
            <ul>
              <li>Email: <a href="mailto:support@buddybooks.in">support@buddybooks.in</a></li>
              <li>WhatsApp: <a href="https://wa.me/919914735738">+91 99147 35738</a></li>
              <li>Visit: Bedi Book Store, Sector 40-C, Chandigarh</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
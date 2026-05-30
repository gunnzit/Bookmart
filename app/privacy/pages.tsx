'use client'
import { useRouter } from 'next/navigation'

export default function PrivacyPage() {
  const router = useRouter()
  return <LegalPage title="Privacy Policy" lastUpdated="May 2026" sections={privacySections} router={router} />
}

function LegalPage({ title, lastUpdated, sections, router }: any) {
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
          <h1 className="kalam" style={{ fontSize: '30px', color: 'var(--text-primary)', marginBottom: '6px' }}>{title}</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>Last updated: {lastUpdated}</p>
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1.5px solid var(--border)', padding: '28px 28px' }}>
            {sections.map((s: any, i: number) => (
              <div key={i}>
                <h2>{s.title}</h2>
                {s.content}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            Questions? Email us at <a href="mailto:support@buddybooks.in">support@buddybooks.in</a> or WhatsApp <a href="https://wa.me/919914735738">+91 99147 35738</a>
          </div>
        </div>
      </div>
    </>
  )
}

const privacySections = [
  {
    title: '1. Information We Collect',
    content: (
      <><p>When you use BuddyBooks, we collect the following information:</p>
      <ul>
        <li><strong>Account info:</strong> Your name, email address, and profile photo via Google Sign-In (through Clerk).</li>
        <li><strong>Phone number:</strong> Your WhatsApp number, which you provide when posting a listing. This is used so buyers can contact you directly.</li>
        <li><strong>Listing data:</strong> Photos, titles, prices, and descriptions you post.</li>
        <li><strong>Usage data:</strong> Pages visited, listings viewed, and actions taken on the platform.</li>
      </ul></>
    ),
  },
  {
    title: '2. How We Use Your Information',
    content: (
      <><p>We use the information we collect to:</p>
      <ul>
        <li>Display your listings to potential buyers on the BuddyBooks marketplace.</li>
        <li>Allow buyers to contact you via WhatsApp when they tap the contact button on your listing.</li>
        <li>Send you notifications about your listings (approvals, inquiries).</li>
        <li>Improve the platform and prevent misuse.</li>
        <li>Process payments for featured listings and school kit bundles via Razorpay.</li>
      </ul></>
    ),
  },
  {
    title: '3. How We Share Your Information',
    content: (
      <><p>We do not sell your personal information. Your WhatsApp number is only shared with buyers who explicitly tap the "Contact on WhatsApp" button on your listing. We share data with:</p>
      <ul>
        <li><strong>Clerk:</strong> For authentication (Google Sign-In).</li>
        <li><strong>Razorpay:</strong> For payment processing. Razorpay's privacy policy applies to payment data.</li>
        <li><strong>Supabase:</strong> For storing listing images.</li>
        <li><strong>Vercel / Neon:</strong> For hosting and database services.</li>
      </ul></>
    ),
  },
  {
    title: '4. Data Storage and Security',
    content: <p>Your data is stored securely on Neon PostgreSQL and Supabase cloud infrastructure. We use industry-standard encryption for data in transit (HTTPS). While we take reasonable precautions, no system is 100% secure. Please do not share sensitive financial information on the platform.</p>,
  },
  {
    title: '5. Your Rights',
    content: (
      <><p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request deletion of your account and associated data.</li>
        <li>Update or correct your information via your profile.</li>
        <li>Remove your listings at any time.</li>
      </ul>
      <p>To exercise these rights, contact us at <a href="mailto:support@buddybooks.in">support@buddybooks.in</a>.</p></>
    ),
  },
  {
    title: '6. Cookies',
    content: <p>BuddyBooks uses cookies for authentication (via Clerk) and to remember your preferences. You can disable cookies in your browser settings, but this may affect functionality.</p>,
  },
  {
    title: '7. Children\'s Privacy',
    content: <p>BuddyBooks is intended for users aged 13 and above. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us immediately.</p>,
  },
  {
    title: '8. Changes to This Policy',
    content: <p>We may update this Privacy Policy from time to time. We will notify users of significant changes via a notice on the platform. Continued use of BuddyBooks after changes constitutes acceptance of the updated policy.</p>,
  },
]
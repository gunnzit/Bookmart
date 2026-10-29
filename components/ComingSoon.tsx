import Logo from '@/components/Logo'

// Shown in place of a page that is not open yet.
export default function ComingSoon({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <div className="min-h-screen bg-[#fcf9f4] text-[#1c1c19] antialiased font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-md mx-auto px-4 pt-6 pb-32 flex flex-col gap-6">
        <header>
          <a href="/" aria-label="Home" className="inline-block active:scale-95 transition-transform">
            <Logo height={30} />
          </a>
        </header>

        <section className="bg-white rounded-[2rem] p-6 flex flex-col items-center text-center gap-3 shadow-[0_2px_12px_rgba(28,28,25,0.06)]">
          <div className="w-16 h-16 rounded-full bg-[#ffdf9f] text-[#795900] flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#fbbf24]/25 text-[#795900] text-[12px] font-bold">Coming soon</span>
          <h1 className="text-[20px] leading-[26px] font-bold tracking-tight">{title}</h1>
          <p className="text-[14px] text-[#4f4633] leading-relaxed">{text}</p>
          <a
            href="/marketplace"
            className="mt-2 w-full h-12 bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold rounded-full flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(251,191,36,0.35)] active:scale-[0.98] transition-transform"
          >
            Browse the marketplace
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </a>
        </section>
      </div>
    </div>
  )
}

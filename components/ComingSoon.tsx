// Shown in place of a page that is not open yet.
export default function ComingSoon({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <div
      className="min-h-screen text-[#1E1B19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
      style={{ background: 'linear-gradient(180deg, #FDEADF 0%, #FFF7F2 100%)' }}
    >
      <div className="max-w-md mx-auto px-5 pt-6 pb-32 flex flex-col gap-6">
        <header>
          <a href="/" className="text-[26px] font-extrabold tracking-tight leading-none">
            Page<span className="text-[#E8632B]">plus</span>
          </a>
        </header>

        <section className="bg-white rounded-[22px] p-6 flex flex-col items-center text-center gap-3 shadow-[0_6px_20px_rgba(120,70,40,0.08)]">
          <div className="w-16 h-16 rounded-full bg-[#FCE3D6] text-[#C4501A] flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">{icon}</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#FFF1EA] text-[#C4501A] text-[12px] font-semibold">Coming soon</span>
          <h1 className="text-[20px] font-bold leading-tight">{title}</h1>
          <p className="text-[14px] text-[#5E5650] leading-relaxed">{text}</p>
          <a
            href="/marketplace"
            className="mt-2 w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full flex items-center justify-center active:scale-[0.98] transition-transform"
          >
            Browse the marketplace
          </a>
        </section>
      </div>
    </div>
  )
}
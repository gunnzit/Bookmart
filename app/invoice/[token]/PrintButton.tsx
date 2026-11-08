'use client'

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="h-12 px-6 rounded-full bg-[#1c1c19] text-white text-[15px] font-bold">
      Print / Save as PDF
    </button>
  )
}

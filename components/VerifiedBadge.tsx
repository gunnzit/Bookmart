// Small green tick shown next to a seller whose WhatsApp number was verified with a code.
// Works in both server and client pages (no hooks).
export default function VerifiedBadge({ label = false, size = 17 }: { label?: boolean; size?: number }) {
  return (
    <span
      title="WhatsApp number verified"
      aria-label="Verified seller"
      className="inline-flex items-center gap-0.5 text-[#2E8B57] shrink-0 align-middle"
    >
      <span className="material-symbols-outlined" style={{ fontSize: size, fontVariationSettings: "'FILL' 1" }}>verified</span>
      {label && <span className="text-[12px] font-semibold">Verified</span>}
    </span>
  )
}
export default function Seal({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="19" className="stroke-evergreen" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="15" className="fill-evergreen" />
      <path
        d="M13 22.5 L18 27 L27 15"
        stroke="#FAF7F2"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="20" cy="20" r="19" className="stroke-gold" strokeWidth="0.6" strokeDasharray="1 3" />
    </svg>
  );
}

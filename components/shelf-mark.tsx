export function ShelfMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M5 23.5h22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 23.5V12.5A2.5 2.5 0 0 1 9.5 10h5A2.5 2.5 0 0 1 17 12.5v11" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.5 10c.2-2.4 5.3-2.4 5.5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="19" y="14" width="7" height="9.5" rx="1.6" fill="currentColor" />
      <path d="M22.5 14c.8-2 3.2-2 4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

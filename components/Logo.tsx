export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-brand/40">
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none" stroke="#22e06b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12 q1 -3 5 -3 l5 0 q3 0 5 2.5 l1.8 2.4 q1 1.5 3.3 2 l4.4 1 q2.5 0.6 2.5 3 l0 1.6 q0 1.2 -1.5 1.2 l-27 0 q-1.8 0 -1.8 -2 l0 -7.6 q0 -0.9 0.8 -0.9 z" />
          <path d="M4 22 l24 0" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight">
        Boots<span className="text-brand">baza</span>
      </span>
    </div>
  );
}

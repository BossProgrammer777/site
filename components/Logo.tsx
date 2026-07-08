export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="inline-flex h-9 w-9 overflow-hidden rounded-xl ring-1 ring-brand/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Bootsbaza" className="h-full w-full object-cover" />
      </span>
      <span className="text-xl font-extrabold tracking-tight">
        Boots<span className="text-brand">baza</span>
      </span>
    </div>
  );
}

export default function HodLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background">
      <div className="relative w-40 h-40 rounded-full border border-blue-500/30 overflow-hidden mb-8 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
        <div className="absolute inset-0 rounded-full border-4 border-blue-500/10" />
        <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 bg-gradient-to-tr from-transparent via-blue-500/40 to-blue-500 origin-top-left animate-spin" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-[2px] rounded-full bg-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] animate-pulse" />
      </div>
      <h2 className="text-xl font-semibold tracking-wider text-blue-600/90 dark:text-blue-400 animate-pulse uppercase text-sm">
        Initializing Governance Engine...
      </h2>
    </div>
  );
}

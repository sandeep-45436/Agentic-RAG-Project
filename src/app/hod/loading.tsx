export default function HodLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background text-foreground p-6 select-none relative overflow-hidden">
      {/* Blue Ambient Glow */}
      <div 
        className="absolute w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '3.5s' }}
      />

      {/* Institutional Operational Radar Screen (Medium Slow Motion 3.2s) */}
      <div className="relative w-44 h-44 rounded-full border-2 border-blue-500/40 bg-blue-950/20 backdrop-blur-md overflow-hidden mb-8 shadow-[0_0_35px_rgba(59,130,246,0.2)]">
        {/* Concentric Radar Distance Rings */}
        <div className="absolute inset-4 rounded-full border border-blue-500/25 pointer-events-none" />
        <div className="absolute inset-9 rounded-full border border-blue-500/20 pointer-events-none" />
        <div className="absolute inset-14 rounded-full border border-blue-500/15 pointer-events-none" />

        {/* Crosshair Grid Lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/30 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-blue-500/30 pointer-events-none" />

        {/* Continuous Medium-Slow Motion Sweeping Beam (3.2s) */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none animate-radar-sweep-continuous"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(59,130,246,0.15) 320deg, rgba(59,130,246,0.6) 360deg)",
          }}
        />

        {/* Radar Target Blips with Medium Slow-Motion Pulsing */}
        <div className="absolute top-8 right-10 w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)] animate-radar-blip" style={{ animationDelay: '0.4s' }} />
        <div className="absolute bottom-11 left-9 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)] animate-radar-blip" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-14 left-12 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)] animate-radar-blip" style={{ animationDelay: '2s' }} />

        {/* Center Station Pivot Point */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border border-white/60 shadow-[0_0_12px_rgba(59,130,246,1)]" />
      </div>

      <h2 
        className="text-base font-semibold tracking-wider text-blue-700 dark:text-blue-300 uppercase animate-pulse"
        style={{ animationDuration: '2.6s' }}
      >
        Initializing Governance Engine & Threat Radars...
      </h2>
      <p className="text-xs text-muted-foreground mt-2 font-medium tracking-widest uppercase">
        Department Head Intelligence Command
      </p>
    </div>
  );
}

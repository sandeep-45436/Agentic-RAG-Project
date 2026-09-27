export default function Loading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background text-foreground relative overflow-hidden select-none">
      {/* Ambient background glow orb */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-cyan-500/10 to-purple-500/10 blur-[120px] pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '4s' }}
      />

      {/* Concentric Medium-Slow Motion Gyroscopic Orbital Rings */}
      <div className="relative flex items-center justify-center w-52 h-52 mb-8">
        {/* Ring 1 - Outer slow revolution (4.5s) */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 border-r-indigo-400 animate-spin"
          style={{ animationDuration: '4.5s' }}
        />
        
        {/* Ring 2 - Middle reverse revolution (3.5s) */}
        <div 
          className="absolute inset-4 rounded-full border-2 border-cyan-400/20 border-b-cyan-400 border-l-cyan-300 animate-spin"
          style={{ animationDuration: '3.5s', animationDirection: 'reverse' }}
        />
        
        {/* Ring 3 - Inner revolution (2.6s) */}
        <div 
          className="absolute inset-8 rounded-full border-2 border-purple-400/20 border-t-purple-400 border-l-purple-400/50 animate-spin"
          style={{ animationDuration: '2.6s' }}
        />

        {/* Central Core Emblem with gentle slow-motion breathing (3.2s) */}
        <div 
          className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/15 via-cyan-500/10 to-purple-500/15 border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.25)] animate-breathe"
          style={{ animationDuration: '3.2s' }}
        >
          <span className="text-3xl font-black bg-gradient-to-br from-indigo-500 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            N
          </span>
        </div>
      </div>
      
      {/* Platform Branding */}
      <div className="flex flex-col items-center gap-2 text-center max-w-sm px-4">
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Nexus<span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">IQ</span>
        </h1>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-pulse" style={{ animationDuration: '2.8s' }}>
          Autonomous Campus Intelligence
        </p>

        {/* Medium-slow looping progress bar indicator */}
        <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-3 relative">
          <div 
            className="absolute inset-y-0 w-24 bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 rounded-full animate-shimmer"
            style={{ animationDuration: '2.4s' }}
          />
        </div>
      </div>
    </div>
  );
}

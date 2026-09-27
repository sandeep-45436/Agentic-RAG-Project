export default function PrincipalLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background text-foreground p-6 select-none relative overflow-hidden">
      {/* Warm Amber Ambient Glow */}
      <div 
        className="absolute w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '3.6s' }}
      />

      {/* Gyroscopic Executive Rings (Medium Slow Motion 4.2s / 3.2s) */}
      <div className="relative flex items-center justify-center w-36 h-36 mb-8">
        {/* Outer Ring */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-amber-500/20 border-t-amber-500 border-r-amber-400 animate-spin"
          style={{ animationDuration: '4.2s' }}
        />
        
        {/* Inner Counter-Rotating Ring */}
        <div 
          className="absolute inset-3.5 rounded-full border-2 border-amber-400/20 border-b-amber-500 border-l-amber-300 animate-spin"
          style={{ animationDuration: '3.2s', animationDirection: 'reverse' }}
        />

        {/* Center Executive Crest Diamond (3.2s breathing) */}
        <div 
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rotate-45 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.35)] animate-breathe"
          style={{ animationDuration: '3.2s' }}
        >
          <div className="w-5 h-5 rounded-md border border-white/50 -rotate-45" />
        </div>
      </div>

      <h2 
        className="text-base font-bold tracking-widest text-amber-700 dark:text-amber-400 uppercase animate-pulse"
        style={{ animationDuration: '2.8s' }}
      >
        Loading Executive Command Cockpit...
      </h2>
      <p className="text-xs text-muted-foreground mt-2 font-medium tracking-wider uppercase">
        Office of the Principal • ALITS University
      </p>
    </div>
  );
}

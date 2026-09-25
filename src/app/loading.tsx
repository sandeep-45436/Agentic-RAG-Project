export default function Loading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="relative flex items-center justify-center h-48 w-48 mb-8">
        {/* Outer Ring */}
        <div 
          className="absolute inset-0 rounded-full border-b-2 border-indigo-500/50 animate-spin"
          style={{ animationDuration: '3s' }}
        />
        {/* Middle Ring */}
        <div 
          className="absolute inset-4 rounded-full border-t-2 border-cyan-400/60 animate-spin"
          style={{ animationDuration: '2s', animationDirection: 'reverse' }}
        />
        {/* Inner Ring */}
        <div 
          className="absolute inset-8 rounded-full border-r-2 border-indigo-400/80 animate-spin"
          style={{ animationDuration: '1.5s' }}
        />
        {/* Center */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.2)] animate-pulse">
          <span className="text-3xl font-bold bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            N
          </span>
        </div>
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight text-foreground animate-pulse mb-2">
        NexusIQ
      </h1>
      <p className="text-sm text-muted-foreground font-medium tracking-widest uppercase">
        Autonomous Campus Intelligence
      </p>
    </div>
  );
}

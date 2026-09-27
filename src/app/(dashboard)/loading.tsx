export default function DashboardLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background text-foreground p-6 sm:p-8 select-none">
      {/* Ambient soft glow */}
      <div 
        className="w-24 h-24 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none mb-4 animate-pulse"
        style={{ animationDuration: '3s' }}
      />

      {/* Medium Slow-Motion Wave Dots */}
      <div className="flex items-center space-x-3 mb-6">
        <div 
          className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-bounce" 
          style={{ animationDuration: '1.6s', animationDelay: '0ms' }} 
        />
        <div 
          className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-bounce" 
          style={{ animationDuration: '1.6s', animationDelay: '250ms' }} 
        />
        <div 
          className="w-3.5 h-3.5 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)] animate-bounce" 
          style={{ animationDuration: '1.6s', animationDelay: '500ms' }} 
        />
      </div>

      <h2 
        className="text-base font-semibold text-foreground/80 mb-10 tracking-wide animate-pulse"
        style={{ animationDuration: '2.5s' }}
      >
        Synchronizing Student Academic Workspace...
      </h2>
      
      {/* Medium slow-motion skeleton cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="h-44 rounded-2xl border border-border/60 bg-card/60 p-5 flex flex-col justify-between shadow-xs animate-pulse"
            style={{ animationDuration: `${2.2 + i * 0.3}s` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted/80" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-muted/80" />
                <div className="h-2.5 w-1/2 rounded bg-muted/60" />
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-border/40">
              <div className="h-2 w-full rounded bg-muted/60" />
              <div className="h-2 w-4/5 rounded bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

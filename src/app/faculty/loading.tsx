export default function FacultyLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background text-foreground p-6 select-none relative overflow-hidden">
      {/* Soft Purple Ambient Background Glow */}
      <div 
        className="absolute w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '3.6s' }}
      />

      {/* Dual Concentric Medium Slow-Motion Rings */}
      <div className="relative flex items-center justify-center w-36 h-36 mb-8">
        {/* Outer Ring (3.6s) */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-600 border-r-purple-500 animate-spin"
          style={{ animationDuration: '3.6s' }}
        />
        
        {/* Inner Counter-Rotating Ring (2.6s) */}
        <div 
          className="absolute inset-3 rounded-full border-2 border-indigo-400/20 border-b-indigo-500 animate-spin"
          style={{ animationDuration: '2.6s', animationDirection: 'reverse' }}
        />

        {/* Center Academic Emblem with Gentle Breathing (3s) */}
        <div 
          className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-400/30 shadow-[0_0_25px_rgba(168,85,247,0.2)] animate-breathe"
          style={{ animationDuration: '3s' }}
        >
          {/* Stylized Book Glyph */}
          <div className="w-8 h-7 rounded-sm bg-purple-100 dark:bg-purple-900/50 border border-purple-400/60 relative overflow-hidden flex flex-col justify-between p-1 shadow-xs">
            <div className="w-full h-1 bg-purple-400 rounded-full" />
            <div className="w-full h-1 bg-purple-300 dark:bg-purple-400/70 rounded-full" />
            <div className="w-2/3 h-1 bg-purple-300 dark:bg-purple-400/70 rounded-full" />
          </div>
        </div>
      </div>

      <h2 
        className="text-base font-semibold tracking-wide text-purple-700 dark:text-purple-300 animate-pulse"
        style={{ animationDuration: '2.8s' }}
      >
        Preparing Faculty Workspace & Timetables...
      </h2>
      <p className="text-xs text-muted-foreground mt-2 font-medium tracking-wider uppercase">
        ALITS Academic Administration Subsystem
      </p>
    </div>
  );
}

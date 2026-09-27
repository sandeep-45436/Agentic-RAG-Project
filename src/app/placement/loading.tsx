export default function PlacementLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background text-foreground p-6 select-none relative overflow-hidden">
      {/* Cyan Ambient Glow */}
      <div 
        className="absolute w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '3.6s' }}
      />

      {/* Career Equalizer / Skill Frequency Bars (Medium Slow Motion 1.8s - 2.4s) */}
      <div className="flex items-end justify-center h-20 space-x-2.5 mb-8 px-4">
        {[
          { color: "bg-cyan-500", duration: "1.8s", delay: "0s" },
          { color: "bg-teal-400", duration: "2.2s", delay: "0.3s" },
          { color: "bg-cyan-400", duration: "1.9s", delay: "0.6s" },
          { color: "bg-emerald-400", duration: "2.4s", delay: "0.2s" },
          { color: "bg-teal-500", duration: "2.0s", delay: "0.5s" },
        ].map((bar, idx) => (
          <div
            key={idx}
            className={`w-3.5 h-16 rounded-full ${bar.color} shadow-[0_0_15px_rgba(6,182,212,0.4)] origin-bottom`}
            style={{
              animation: `soundwaveBar ${bar.duration} ease-in-out infinite`,
              animationDelay: bar.delay,
            }}
          />
        ))}
      </div>

      <h2 
        className="text-base font-semibold tracking-wide text-cyan-700 dark:text-cyan-300 animate-pulse"
        style={{ animationDuration: '2.8s' }}
      >
        Connecting to Placement Drives & Skills Radar...
      </h2>
      <p className="text-xs text-muted-foreground mt-2 font-medium tracking-wider uppercase">
        ALITS Career Competency & Recruitment Accelerator
      </p>
    </div>
  );
}

export default function AuthLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background text-foreground p-6 select-none relative overflow-hidden">
      {/* Indigo Ambient Soft Glow */}
      <div 
        className="absolute w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '3.6s' }}
      />

      {/* Security Emblem with Medium Slow-Motion Orbit (4.2s) */}
      <div className="relative flex items-center justify-center w-28 h-28 mb-8">
        {/* Rotating Dashed Security Orbit */}
        <div 
          className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/50 animate-spin"
          style={{ animationDuration: '4.2s' }}
        />

        {/* Outer Hexagon/Diamond Badge */}
        <div 
          className="absolute inset-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-400/40 rotate-45 animate-breathe"
          style={{ animationDuration: '3s' }}
        />

        {/* Center Glowing Dot Core */}
        <div className="w-3.5 h-3.5 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-full shadow-[0_0_16px_rgba(99,102,241,1)] z-10" />
      </div>

      <h2 
        className="text-sm font-semibold tracking-widest text-indigo-700 dark:text-indigo-300 uppercase animate-pulse"
        style={{ animationDuration: '2.6s' }}
      >
        Establishing Secure Campus Session...
      </h2>
      <p className="text-xs text-muted-foreground mt-2 font-medium tracking-wider uppercase">
        Role-Based Access Control • Institutional SSO
      </p>
    </div>
  );
}

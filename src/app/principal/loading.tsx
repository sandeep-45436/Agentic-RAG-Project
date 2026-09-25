export default function PrincipalLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background bg-gradient-to-b from-background to-amber-950/10">
      <div className="relative flex items-center justify-center h-32 w-32 mb-8">
        <div className="absolute inset-0 rounded-full border-y-2 border-amber-500/80 animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-4 rounded-full border-x-2 border-amber-400/60 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
        <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-amber-300 to-amber-600 rotate-45 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
      </div>
      <h2 className="text-lg font-bold tracking-widest text-amber-600 dark:text-amber-500 animate-pulse uppercase">
        Loading Executive Command Center...
      </h2>
    </div>
  );
}

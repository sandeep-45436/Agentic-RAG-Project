export default function AuthLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        <div className="absolute inset-0 bg-indigo-500/20 rounded-xl rotate-45 animate-pulse shadow-[0_0_30px_rgba(99,102,241,0.2)]" />
        <div className="absolute inset-2 border-2 border-indigo-500/50 rounded-lg rotate-45" />
        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
      </div>
      <h2 className="text-sm font-medium tracking-widest text-muted-foreground uppercase animate-pulse">
        Securing Connection...
      </h2>
    </div>
  );
}

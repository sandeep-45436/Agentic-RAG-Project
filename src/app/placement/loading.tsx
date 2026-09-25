export default function PlacementLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background">
      <div className="flex items-end h-16 space-x-2 mb-8">
        <div className="w-3 bg-cyan-500 rounded-t-sm animate-[bounce_1s_infinite_ease-in-out]" style={{ animationDelay: '0ms', height: '100%' }} />
        <div className="w-3 bg-teal-500 rounded-t-sm animate-[bounce_1s_infinite_ease-in-out]" style={{ animationDelay: '150ms', height: '70%' }} />
        <div className="w-3 bg-cyan-500 rounded-t-sm animate-[bounce_1s_infinite_ease-in-out]" style={{ animationDelay: '300ms', height: '40%' }} />
        <div className="w-3 bg-teal-500 rounded-t-sm animate-[bounce_1s_infinite_ease-in-out]" style={{ animationDelay: '450ms', height: '80%' }} />
      </div>
      <h2 className="text-xl font-medium tracking-wide text-cyan-600 dark:text-cyan-400 animate-pulse">
        Connecting to Career Engine...
      </h2>
    </div>
  );
}

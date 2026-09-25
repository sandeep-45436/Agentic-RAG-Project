export default function DashboardLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background p-8">
      <div className="flex items-center space-x-2 mb-8">
        <div className="w-4 h-4 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-4 h-4 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-4 h-4 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <h2 className="text-xl font-semibold text-indigo-600/80 mb-12 animate-pulse">Loading Student Portal...</h2>
      
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-xl border border-border bg-card/50 p-6 flex flex-col gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

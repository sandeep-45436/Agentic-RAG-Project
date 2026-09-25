export default function FacultyLoading() {
  return (
    <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-background bg-gradient-to-br from-background to-indigo-950/5">
      <div className="relative flex items-center justify-center h-32 w-32 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin" />
        <div className="w-12 h-10 rounded-sm bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-400 relative overflow-hidden flex flex-col justify-between p-1">
          <div className="w-full h-1 bg-indigo-300 rounded-full" />
          <div className="w-full h-1 bg-indigo-300 rounded-full" />
          <div className="w-3/4 h-1 bg-indigo-300 rounded-full" />
        </div>
      </div>
      <h2 className="text-xl font-medium tracking-wide text-indigo-600 dark:text-indigo-400 animate-pulse">
        Preparing Faculty Workspace...
      </h2>
    </div>
  );
}

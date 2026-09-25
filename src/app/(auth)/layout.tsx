export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-blob-1" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] animate-blob-2" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-primary/4 blur-[80px] animate-blob-3" />
      </div>
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 -z-10 subtle-grid opacity-50" />
      {/* Content with pop-in animation */}
      <div className="animate-pop-in-bounce w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

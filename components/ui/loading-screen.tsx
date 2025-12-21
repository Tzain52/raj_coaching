interface LoadingScreenProps {
  label?: string;
  description?: string;
  fullscreen?: boolean;
}

export function LoadingScreen({
  label = "Loading content",
  description = "Hang tight while we set things up for you.",
  fullscreen = true,
}: LoadingScreenProps) {
  const containerClasses = fullscreen
    ? "min-h-screen"
    : "min-h-[320px] rounded-xl border border-white/20";

  return (
    <div className={`${containerClasses} flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white px-6`}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-white/20" />
          <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-white animate-spin" />
          <div className="absolute inset-3 w-14 h-14 rounded-full bg-white/10 blur-xl animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold tracking-wide">{label}</p>
          <p className="text-sm text-white/70 animate-pulse">{description}</p>
        </div>
      </div>
    </div>
  );
}

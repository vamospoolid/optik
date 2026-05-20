export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1a] p-6 md:p-10 relative overflow-hidden font-sans">
      {/* Premium Mesh Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse duration-[10s]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse duration-[15s]"></div>
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Glassmorphic Container Wrapper */}
      <div className="w-full max-w-sm relative z-10">
        <div className="animate-in fade-in zoom-in slide-in-from-bottom-4 duration-1000 ease-out">
          {children}
        </div>
      </div>
      
      {/* Refined Footer */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2 opacity-30 select-none">
        <div className="h-px w-12 bg-white/50"></div>
        <span className="text-[9px] font-black text-white tracking-[0.4em] uppercase">
          Optik88 Management <span className="text-blue-400">v2.0</span>
        </span>
      </div>
    </div>
  )
}

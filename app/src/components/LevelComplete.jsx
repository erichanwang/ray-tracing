export default function LevelComplete({ levelName, levelIndex, onNext }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dungeon relative overflow-hidden">
      {/* Emerald celebration glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/30 via-transparent to-black/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06)_0%,transparent_60%)]" />

      {/* Sparkle particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: 0.4 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 animate-float">
        {/* Portal icon */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 w-20 h-20 mx-auto bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <svg viewBox="0 0 64 64" className="w-20 h-20 mx-auto relative fill-emerald-400/50">
            <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.6"/>
            <circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
            <circle cx="32" cy="32" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M28 24l8 8-8 8" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
          </svg>
        </div>

        <div className="text-emerald-400/40 text-[10px] tracking-[0.3em] uppercase mb-2">
          Chamber {levelIndex + 1} Complete
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-amber-100/80 mb-3 tracking-tight">{levelName}</h2>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent mx-auto mb-5" />
        
        <p className="text-amber-300/30 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
          You found the exit portal and escaped the darkness. The path continues deeper.
        </p>

        <button
          onClick={onNext}
          className="group relative px-10 py-4 bg-emerald-500/[0.07] border border-emerald-500/20 rounded-xl text-emerald-300/80 font-semibold text-lg transition-all duration-300 hover:border-emerald-400/40 hover:bg-emerald-500/[0.12] hover:text-emerald-200 hover:scale-105 active:scale-95 cursor-pointer overflow-hidden"
        >
          <span className="relative z-10">{levelIndex >= 4 ? 'Finish' : 'Next Chamber →'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>

        <div className="mt-8 text-emerald-500/10 text-xs">Your light grows stronger</div>
      </div>
    </div>
  )
}

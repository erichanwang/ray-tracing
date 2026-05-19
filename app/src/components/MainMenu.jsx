export default function MainMenu({ onStart, onLevelSelect, hasGame }) {
  return (
    <div className="w-dvw h-dvh flex flex-col items-center justify-center bg-dungeon relative overflow-hidden">
      {/* Animated radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.04)_0%,transparent_50%,rgba(0,0,0,0.5)_100%)]" />
      
      {/* Ambient particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              backgroundColor: i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#78350f' : '#fbbf24',
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${2 + Math.random() * 5}s`,
              opacity: 0.15 + Math.random() * 0.2,
              boxShadow: i % 2 === 0 ? `0 0 ${4 + Math.random() * 6}px currentColor` : 'none',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Subtitle */}
        <div className="mb-3 text-amber-500/30 text-xs md:text-sm tracking-[0.35em] uppercase font-medium">
          A Lantern-Lit Dungeon Crawler
        </div>
        
        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold mb-3 tracking-tight">
          <span className="bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            Lanternlight
          </span>
        </h1>
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto mb-8" />

        {/* Lantern Icon */}
        <div className="mb-8 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 w-28 h-28 rounded-full bg-amber-500/10 blur-3xl animate-pulse-slow" />
            <svg viewBox="0 0 64 80" className="w-28 h-28 relative z-10 drop-shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              {/* Handle */}
              <path d="M22 4 Q32 -4 42 4" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
              {/* Top cap */}
              <rect x="18" y="6" width="28" height="6" rx="2" fill="#78350f" />
              <rect x="16" y="11" width="32" height="3" rx="1" fill="#92400e" />
              {/* Glass body */}
              <path d="M20 14 L16 56 Q16 60 20 60 L44 60 Q48 60 48 56 L44 14 Z" fill="#fbbf24" opacity="0.2" stroke="#78350f" strokeWidth="2" />
              {/* Glass panels */}
              <line x1="32" y1="14" x2="32" y2="58" stroke="#78350f" strokeWidth="1.5" />
              <line x1="16" y1="14" x2="16" y2="56" stroke="#78350f" strokeWidth="2" />
              <line x1="48" y1="14" x2="48" y2="56" stroke="#78350f" strokeWidth="2" />
              {/* Flame */}
              <path d="M26 50 Q24 42 28 36 Q30 32 32 28 Q34 32 36 36 Q40 42 38 50 Q38 54 34 55 Q30 56 28 54 Q26 52 26 50 Z" fill="#f59e0b" opacity="0.9" />
              <path d="M28 48 Q27 42 29 38 Q31 34 32 30 Q33 34 35 38 Q37 42 36 48 Q36 52 34 53 Q31 54 29 52 Q28 50 28 48 Z" fill="#fbbf24" opacity="0.8" />
              {/* Base */}
              <rect x="18" y="58" width="28" height="4" rx="2" fill="#78350f" />
              <rect x="16" y="62" width="32" height="3" rx="1" fill="#92400e" />
              {/* Light rays */}
              <line x1="32" y1="68" x2="32" y2="78" stroke="#fbbf24" strokeWidth="1" opacity="0.25" />
              <line x1="22" y1="66" x2="18" y2="74" stroke="#fbbf24" strokeWidth="1" opacity="0.15" />
              <line x1="42" y1="66" x2="46" y2="74" stroke="#fbbf24" strokeWidth="1" opacity="0.15" />
            </svg>
          </div>
        </div>

        {/* Description */}
        <p className="text-amber-300/40 max-w-md mx-auto mb-10 text-sm md:text-base leading-relaxed">
          Navigate through dark maze chambers by lantern light. Collect emerald crystals, 
          find golden keys to unlock sealed doors, and escape through the portal.
        </p>

        {/* Buttons */}
        <div className="flex flex-col items-center gap-3.5">
          <button
            onClick={onStart}
            className="group relative px-12 py-4 bg-amber-500/[0.08] border border-amber-500/25 rounded-xl text-amber-200 font-semibold text-lg tracking-wide overflow-hidden transition-all duration-300 hover:border-amber-400/40 hover:bg-amber-500/[0.15] hover:text-amber-100 hover:scale-105 active:scale-95 cursor-pointer w-64 shadow-lg shadow-amber-500/[0.03]"
          >
            <span className="relative z-10">Enter the Dungeon</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
          
          {hasGame && onLevelSelect && (
            <button
              onClick={onLevelSelect}
              className="px-12 py-3 border border-white/[0.06] rounded-xl text-amber-400/25 text-sm transition-all duration-300 hover:border-amber-500/20 hover:text-amber-300/45 hover:bg-white/[0.02] cursor-pointer w-64"
            >
              Select Chamber
            </button>
          )}
        </div>

        <div className="mt-10 text-amber-500/12 text-xs tracking-wide">Click to lock pointer · ESC to pause</div>
      </div>
    </div>
  )
}

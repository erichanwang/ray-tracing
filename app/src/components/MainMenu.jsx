export default function MainMenu({ onStart, onLevelSelect, hasGame }) {
  return (
    <div className="w-dvw h-dvh flex flex-col items-center justify-center bg-dungeon relative overflow-hidden">
      {/* Ambient particles */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6">
        {/* Title */}
        <div className="mb-2 text-amber-400/50 text-sm tracking-[0.3em] uppercase">A Ray-Traced Dungeon Crawler</div>
        <h1 className="text-5xl md:text-7xl font-bold text-amber-200 mb-2 tracking-tight animate-glow">
          Lanternlight
        </h1>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-6" />

        {/* Lantern Icon */}
        <div className="mb-8 flex items-center justify-center">
          <div className="relative">
            {/* Glow behind lantern */}
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-amber-500/20 blur-xl animate-pulse-slow" />
            {/* Lantern SVG */}
            <svg viewBox="0 0 64 80" className="w-24 h-24 relative z-10">
              {/* Handle */}
              <path d="M22 4 Q32 -4 42 4" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
              {/* Top cap */}
              <rect x="18" y="6" width="28" height="6" rx="2" fill="#78350f" />
              <rect x="16" y="11" width="32" height="3" rx="1" fill="#92400e" />
              {/* Glass body */}
              <path d="M20 14 L16 56 Q16 60 20 60 L44 60 Q48 60 48 56 L44 14 Z" fill="#fbbf24" opacity="0.25" stroke="#78350f" strokeWidth="2" />
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
              <line x1="32" y1="68" x2="32" y2="78" stroke="#fbbf24" strokeWidth="1" opacity="0.3" />
              <line x1="22" y1="66" x2="18" y2="74" stroke="#fbbf24" strokeWidth="1" opacity="0.2" />
              <line x1="42" y1="66" x2="46" y2="74" stroke="#fbbf24" strokeWidth="1" opacity="0.2" />
            </svg>
          </div>
        </div>

        {/* Description */}
        <p className="text-amber-300/60 max-w-md mx-auto mb-10 text-sm leading-relaxed">
          Navigate through dark maze chambers. Collect emerald crystals, find keys
          to unlock doors, and escape through the golden portal.
        </p>

        {/* Buttons */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            className="group relative px-10 py-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-lg text-amber-300 font-semibold text-lg tracking-wide overflow-hidden transition-all duration-300 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-200 hover:scale-105 active:scale-95 cursor-pointer w-64"
          >
            <span className="relative z-10">Enter the Dungeon</span>
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </button>
          {hasGame && onLevelSelect && (
            <button
              onClick={onLevelSelect}
              className="px-10 py-3 border border-amber-700/20 rounded-lg text-amber-400/40 text-sm transition-all duration-300 hover:border-amber-500/30 hover:text-amber-300/60 cursor-pointer w-64"
            >
              Select Level
            </button>
          )}
        </div>

        <div className="mt-8 text-amber-500/20 text-xs">Click to lock pointer · ESC to pause</div>
      </div>
    </div>
  )
}

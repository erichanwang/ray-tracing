export default function MainMenu({ onStart }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dungeon relative overflow-hidden">
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

        {/* Character/Logo */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-12 h-12 text-amber-400">
              <circle cx="20" cy="20" r="6" fill="currentColor" opacity="0.8" />
              <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
              <line x1="20" y1="10" x2="20" y2="2" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="30" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="20" y1="30" x2="20" y2="38" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="10" y1="20" x2="2" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>
          <div className="text-amber-500/20 text-4xl">◆</div>
        </div>

        {/* Description */}
        <p className="text-amber-300/60 max-w-md mx-auto mb-10 text-sm leading-relaxed">
          Navigate through dark maze chambers. Collect emerald crystals with your
          lantern light to unlock the golden portal and escape.
        </p>

        {/* Start button */}
        <button
          onClick={onStart}
          className="group relative px-10 py-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-lg text-amber-300 font-semibold text-lg tracking-wide overflow-hidden transition-all duration-300 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="relative z-10">Enter the Dungeon</span>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </button>

        <div className="mt-8 text-amber-500/20 text-xs">Click to lock pointer · ESC to pause</div>
      </div>
    </div>
  )
}

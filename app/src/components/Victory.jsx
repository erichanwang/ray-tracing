export default function Victory({ onMenu }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dungeon relative overflow-hidden">
      {/* Golden celebration overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-950/30 via-transparent to-black/80" />
      
      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08)_0%,transparent_60%)]" />

      {/* Celebration particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 4 === 0 ? '#f59e0b' : i % 4 === 1 ? '#10b981' : i % 4 === 2 ? '#fbbf24' : '#fde68a',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${1.5 + Math.random() * 4}s`,
              boxShadow: i % 3 === 0 ? '0 0 8px currentColor' : 'none',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 animate-float">
        {/* Crown icon */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 w-20 h-20 mx-auto bg-amber-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <svg viewBox="0 0 64 64" className="w-20 h-20 mx-auto relative fill-amber-400/60">
            <path d="M8 48l8-32 10 12 6-20 6 20 10-12 8 32H8zm4-4h40l-4-16-6 8-6-18-6 18-6-8-4 16z"/>
            <rect x="12" y="44" width="40" height="4" />
            <circle cx="22" cy="46" r="2" fill="#f59e0b"/>
            <circle cx="32" cy="48" r="3" fill="#fbbf24"/>
            <circle cx="42" cy="46" r="2" fill="#f59e0b"/>
            <path d="M20 52h24v4H20z" opacity="0.5"/>
          </svg>
        </div>

        <div className="text-amber-300/40 text-[10px] tracking-[0.3em] uppercase mb-2">Victory</div>
        <h1 className="text-4xl md:text-6xl font-bold mb-2 tracking-tight">
          <span className="bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-transparent">Darkness</span>
          {' '}
          <span className="bg-gradient-to-b from-amber-100 to-amber-400 bg-clip-text text-transparent">Conquered</span>
        </h1>
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-4" />

        <p className="text-amber-300/50 max-w-md mx-auto mb-2 text-sm leading-relaxed">
          You navigated all five chambers, gathered every crystal, unlocked every door,
          and escaped the depths.
        </p>
        <p className="text-emerald-400/50 text-sm mb-10 italic">
          The lantern's light prevails.
        </p>

        <button
          onClick={onMenu}
          className="group relative px-10 py-4 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl text-amber-300/80 font-semibold text-lg transition-all duration-300 hover:border-amber-400/40 hover:bg-amber-500/[0.14] hover:text-amber-200 hover:scale-105 active:scale-95 cursor-pointer overflow-hidden"
        >
          <span className="relative z-10">Play Again</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>

        <div className="mt-10 text-amber-500/15 text-xs">Thank you for playing Lanternlight</div>
      </div>
    </div>
  )
}

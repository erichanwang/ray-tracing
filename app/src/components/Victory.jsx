export default function Victory({ onMenu }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dungeon relative overflow-hidden">
      {/* Celebration particles */}
      <div className="absolute inset-0 opacity-30">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#10b981' : '#fbbf24',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1.5 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 animate-float">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-emerald-400 text-4xl">◆</span>
          <span className="text-amber-400 text-4xl">◆</span>
          <span className="text-emerald-400 text-4xl">◆</span>
        </div>

        <div className="text-amber-300/50 text-xs tracking-[0.3em] uppercase mb-1">Victory</div>
        <h1 className="text-4xl md:text-6xl font-bold text-amber-200 mb-2">Darkness Conquered</h1>
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto mb-4" />

        <p className="text-amber-300/60 max-w-md mx-auto mb-2 text-sm">
          You have navigated all five chambers, gathered every crystal,
          and escaped the depths.
        </p>
        <p className="text-emerald-400/60 text-sm mb-10">
          The lantern's light prevails.
        </p>

        <button
          onClick={onMenu}
          className="px-10 py-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-lg text-amber-300 font-semibold text-lg transition-all duration-300 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          Play Again
        </button>
      </div>
    </div>
  )
}

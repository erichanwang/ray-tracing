export default function HUD({ crystals, crystalsNeeded, levelName, levelIndex, totalLevels }) {
  const allCollected = crystals >= crystalsNeeded

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
        <div className="bg-dungeon/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-700/30">
          <div className="text-amber-300/60 text-xs uppercase tracking-widest">Level {levelIndex + 1}/{totalLevels}</div>
          <div className="text-amber-200 font-semibold text-sm">{levelName}</div>
        </div>

        <div className={`bg-dungeon/80 backdrop-blur-sm rounded-lg px-4 py-2 border transition-colors duration-500 ${allCollected ? 'border-emerald-500/50' : 'border-amber-700/30'}`}>
          <div className="text-amber-300/60 text-xs uppercase tracking-widest">Crystals</div>
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-lg ${allCollected ? 'text-emerald-400' : 'text-amber-200'}`}>
              {crystals}
            </span>
            <span className="text-amber-500/50">/</span>
            <span className="text-amber-500/50 text-sm">{crystalsNeeded}</span>
            {allCollected && (
              <span className="text-emerald-400 text-xs animate-pulse ml-1">✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-dungeon/70 backdrop-blur-sm rounded-full px-5 py-2 border border-amber-700/20 text-amber-300/50 text-xs">
          {allCollected
            ? 'Find the golden portal to escape!'
            : 'WASD to move · Mouse to look · Find crystals'}
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-0.5 h-4 bg-amber-400/30 rounded-full absolute" />
          <div className="h-0.5 w-4 bg-amber-400/30 rounded-full absolute" />
        </div>
      </div>
    </div>
  )
}

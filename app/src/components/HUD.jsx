export default function HUD({ crystals, crystalsNeeded, health, maxHealth, levelName, levelIndex, totalLevels, devMode }) {
  const allCollected = crystals >= crystalsNeeded
  const healthPct = Math.max(0, (health / maxHealth) * 100)
  const healthColor = healthPct > 50 ? 'bg-emerald-500/60' : healthPct > 25 ? 'bg-amber-500/60' : 'bg-red-500/60'

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 flex justify-between items-start gap-2">
        <div className="bg-dungeon/80 backdrop-blur-sm rounded-lg px-3 py-2 md:px-4 md:py-2 border border-amber-700/30">
          <div className="text-amber-300/60 text-[10px] md:text-xs uppercase tracking-widest">Level {levelIndex + 1}/{totalLevels}</div>
          <div className="text-amber-200 font-semibold text-xs md:text-sm">{levelName}</div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {/* Health bar */}
          <div className="bg-dungeon/80 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2 border border-amber-700/30 w-32 md:w-40">
            <div className="text-amber-300/60 text-[10px] md:text-xs uppercase tracking-widest mb-1">Lantern</div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${healthColor}`}
                style={{ width: `${healthPct}%` }}
              />
            </div>
          </div>

          {/* Crystal counter */}
          <div className={`bg-dungeon/80 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2 border transition-colors duration-500 ${allCollected ? 'border-emerald-500/50' : 'border-amber-700/30'}`}>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold text-sm md:text-lg ${allCollected ? 'text-emerald-400' : 'text-amber-200'}`}>
                {crystals}
              </span>
              <span className="text-amber-500/50 text-xs">/</span>
              <span className="text-amber-500/50 text-xs md:text-sm">{crystalsNeeded}</span>
              {allCollected && (
                <span className="text-emerald-400 text-xs animate-pulse ml-1">✓</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-dungeon/70 backdrop-blur-sm rounded-full px-4 py-1.5 md:px-5 md:py-2 border border-amber-700/20 text-amber-300/50 text-[10px] md:text-xs">
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

      {/* Dev mode indicator */}
      {devMode && (
        <div className="absolute top-20 left-3 md:left-4 bg-dungeon/80 backdrop-blur-sm rounded px-2 py-0.5 border border-amber-500/20">
          <span className="text-amber-400/40 text-[10px] tracking-widest uppercase">DEV</span>
        </div>
      )}
    </div>
  )
}

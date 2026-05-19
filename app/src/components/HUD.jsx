export default function HUD({ crystals, crystalsNeeded, health, maxHealth, levelName, levelIndex, totalLevels, devMode, keys = 0, totalDoors = 0, doorsOpened = 0, musicVol = 1, ambientVol = 1, onChangeMusicVolume, onChangeAmbientVolume }) {
  const allCollected = crystals >= crystalsNeeded && (totalDoors === 0 || doorsOpened >= totalDoors)
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

          {/* Key inventory */}
          {totalDoors > 0 && (
            <div className="bg-dungeon/80 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2 border border-amber-500/30 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="currentColor">
                <path d="M7 14a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M16.45 2.05a1 1 0 00-1.4.2l-5.1 6.8a5 5 0 101.4 1.2l4.9-6.5 2.5 1.9a1 1 0 001.4-.2l1.2-1.6a1 1 0 00-.2-1.4l-4.7-2.4zm-5.1 14.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="text-amber-300 font-bold text-sm">×{keys}</span>
            </div>
          )}

          {/* Crystal counter */}
          <div className={`bg-dungeon/80 backdrop-blur-sm rounded-lg px-3 py-1.5 md:px-4 md:py-2 border transition-colors duration-500 ${crystals >= crystalsNeeded ? 'border-emerald-500/50' : 'border-amber-700/30'}`}>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold text-sm md:text-lg ${crystals >= crystalsNeeded ? 'text-emerald-400' : 'text-amber-200'}`}>
                {crystals}
              </span>
              <span className="text-amber-500/50 text-xs">/</span>
              <span className="text-amber-500/50 text-xs md:text-sm">{crystalsNeeded}</span>
              {crystals >= crystalsNeeded && (
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
            : totalDoors > 0 && doorsOpened < totalDoors
              ? 'WASD to move · Find keys to unlock doors'
              : 'WASD to move · Mouse to look · Find crystals'}
        </div>
      </div>

      {/* Volume controls — subtle, bottom-right */}
      <div className="absolute bottom-4 right-4 bg-dungeon/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-amber-700/30 flex flex-col gap-2 min-w-[140px]">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-400/60 shrink-0" fill="currentColor">
              <path d="M9 4v16l-4-4H2V8h3l4-4zm3 2.5v11a3.5 3.5 0 000-11zm2 0v11a5.5 5.5 0 000-11z" />
            </svg>
            <span className="text-amber-400/50 text-[10px] uppercase tracking-wider">Music</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVol}
              onChange={(e) => onChangeMusicVolume?.(parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none bg-amber-700/30 rounded-full accent-amber-500 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-400/60 shrink-0" fill="currentColor">
              <path d="M3 10h2v4H3v-4zm5-4h2v12H8V6zm5 2h2v8h-2V8zm5-4h2v16h-2V4z" />
            </svg>
            <span className="text-amber-400/50 text-[10px] uppercase tracking-wider">Ambient</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambientVol}
              onChange={(e) => onChangeAmbientVolume?.(parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none bg-amber-700/30 rounded-full accent-amber-500 cursor-pointer"
            />
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

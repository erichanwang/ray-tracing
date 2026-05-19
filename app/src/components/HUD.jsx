export default function HUD({ crystals, crystalsNeeded, health, maxHealth, levelName, levelIndex, totalLevels, devMode, keys = 0, totalDoors = 0, doorsOpened = 0, musicVol = 1, ambientVol = 1, onChangeMusicVolume, onChangeAmbientVolume }) {
  const allCollected = crystals >= crystalsNeeded && (totalDoors === 0 || doorsOpened >= totalDoors)
  const healthPct = Math.max(0, (health / maxHealth) * 100)
  const healthColor = healthPct > 50 ? 'from-emerald-500/70 to-emerald-400/50' : healthPct > 25 ? 'from-amber-500/70 to-amber-400/50' : 'from-red-500/70 to-red-400/50'
  const isLowHealth = healthPct <= 25

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-3 md:p-4 flex justify-between items-start gap-2">
        {/* Level info */}
        <div className="bg-black/40 backdrop-blur-xl rounded-xl px-4 py-2.5 border border-white/5 shadow-lg ring-1 ring-white/[0.03]">
          <div className="text-amber-400/40 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium">Chamber {levelIndex + 1}</div>
          <div className="text-amber-100/80 font-semibold text-xs md:text-sm tracking-wide">{levelName}</div>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {/* Health bar */}
          <div className="bg-black/40 backdrop-blur-xl rounded-xl px-3.5 py-2.5 border border-white/5 shadow-lg ring-1 ring-white/[0.03] w-36 md:w-44">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-amber-400/40 text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-medium">Lantern</span>
              <span className={`text-[10px] font-bold ${healthPct > 50 ? 'text-emerald-400/60' : healthPct > 25 ? 'text-amber-400/60' : 'text-red-400/60'}`}>
                {Math.round(healthPct)}%
              </span>
            </div>
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/[0.03]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${healthColor} transition-all duration-500 ${isLowHealth ? 'animate-pulse-slow' : ''}`}
                style={{ width: `${healthPct}%`, boxShadow: isLowHealth ? '0 0 8px rgba(239,68,68,0.4)' : '0 0 4px rgba(245,158,11,0.2)' }}
              />
            </div>
          </div>

          {/* Key inventory */}
          {totalDoors > 0 && (
            <div className="bg-black/40 backdrop-blur-xl rounded-xl px-3.5 py-2 border border-amber-500/10 shadow-lg ring-1 ring-amber-500/[0.03] flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400/80" fill="currentColor">
                <path d="M7 14a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M16.45 2.05a1 1 0 00-1.4.2l-5.1 6.8a5 5 0 101.4 1.2l4.9-6.5 2.5 1.9a1 1 0 001.4-.2l1.2-1.6a1 1 0 00-.2-1.4l-4.7-2.4zm-5.1 14.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="text-amber-200 font-bold text-sm">{keys}</span>
              {doorsOpened > 0 && (
                <span className="text-amber-500/30 text-[10px]">({doorsOpened}/{totalDoors})</span>
              )}
            </div>
          )}

          {/* Crystal counter */}
          <div className={`bg-black/40 backdrop-blur-xl rounded-xl px-3.5 py-2 border shadow-lg ring-1 transition-all duration-700 ${crystals >= crystalsNeeded ? 'border-emerald-500/30 ring-emerald-500/[0.05]' : 'border-white/5 ring-white/[0.03]'}`}>
            <div className="flex items-center gap-1.5">
              {/* Crystal icon */}
              <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-colors duration-700 ${crystals >= crystalsNeeded ? 'text-emerald-400' : 'text-amber-500/30'}`} fill="currentColor">
                <path d="M12 2l2.5 7H22l-6 4.5 2.5 7L12 16l-6.5 4.5L8 13.5 2 9h7.5L12 2z" />
              </svg>
              <span className={`font-bold text-sm md:text-base transition-colors duration-700 ${crystals >= crystalsNeeded ? 'text-emerald-300' : 'text-amber-100/80'}`}>
                {crystals}
              </span>
              <span className="text-amber-500/25 text-xs">/</span>
              <span className="text-amber-500/25 text-xs md:text-sm">{crystalsNeeded}</span>
              {crystals >= crystalsNeeded && (
                <span className="text-emerald-400 text-xs animate-pulse ml-0.5">✓</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-black/40 backdrop-blur-xl rounded-full px-5 py-2 border border-white/5 shadow-lg ring-1 ring-white/[0.03]">
          <span className="text-amber-300/40 text-[10px] md:text-[11px] tracking-wide">
            {allCollected
              ? 'Find the golden portal to escape!'
              : totalDoors > 0 && doorsOpened < totalDoors
                ? 'Find keys to unlock doors · WASD to move · Mouse to look'
                : 'WASD to move · Mouse to look · Find crystals'}
          </span>
        </div>
      </div>

      {/* Volume controls — subtle, bottom-right */}
      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-xl rounded-xl px-3.5 py-2.5 border border-white/5 shadow-lg ring-1 ring-white/[0.03] flex flex-col gap-2.5 min-w-[150px]">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-400/40 shrink-0" fill="currentColor">
              <path d="M9 4v16l-4-4H2V8h3l4-4zm3 2.5v11a3.5 3.5 0 000-11zm2 0v11a5.5 5.5 0 000-11z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVol}
              onChange={(e) => onChangeMusicVolume?.(parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none bg-white/5 rounded-full accent-amber-500 cursor-pointer hover:accent-amber-400 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-400/40 shrink-0" fill="currentColor">
              <path d="M3 10h2v4H3v-4zm5-4h2v12H8V6zm5 2h2v8h-2V8zm5-4h2v16h-2V4z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambientVol}
              onChange={(e) => onChangeAmbientVolume?.(parseFloat(e.target.value))}
              className="flex-1 h-1 appearance-none bg-white/5 rounded-full accent-amber-500 cursor-pointer hover:accent-amber-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-6 h-6 flex items-center justify-center">
          <div className="absolute w-px h-5 bg-amber-400/20 rounded-full" />
          <div className="absolute h-px w-5 bg-amber-400/20 rounded-full" />
          <div className="absolute w-0.5 h-0.5 bg-amber-400/40 rounded-full" />
        </div>
      </div>

      {/* Dev mode indicator */}
      {devMode && (
        <div className="absolute top-24 left-3 md:left-4 bg-black/40 backdrop-blur-xl rounded-lg px-2.5 py-1 border border-amber-500/10 shadow-lg">
          <span className="text-amber-400/30 text-[10px] tracking-[0.2em] uppercase font-medium">DEV</span>
        </div>
      )}
    </div>
  )
}

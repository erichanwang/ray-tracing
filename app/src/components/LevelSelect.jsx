export default function LevelSelect({ levels, unlockedLevel, onSelectLevel, onBack }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dungeon overflow-y-auto p-6">
      {/* Subtle radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.03)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="max-w-lg w-full relative z-10">
        <div className="text-center mb-8">
          <div className="text-amber-500/30 text-xs tracking-[0.3em] uppercase mb-3 font-medium">Select Chamber</div>
          <h1 className="text-4xl font-bold text-amber-100/80 tracking-tight">The Dungeon</h1>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mx-auto mt-5" />
        </div>

        <div className="space-y-3">
          {levels.map((level, i) => {
            const unlocked = i <= unlockedLevel
            return (
              <button
                key={i}
                onClick={() => unlocked && onSelectLevel(i)}
                disabled={!unlocked}
                className={`w-full text-left p-5 rounded-xl border transition-all duration-300 ${
                  unlocked
                    ? 'border-white/[0.06] bg-white/[0.02] hover:border-amber-500/20 hover:bg-amber-500/[0.03] cursor-pointer active:scale-[0.98] shadow-sm'
                    : 'border-white/[0.02] bg-transparent opacity-30 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Chamber icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      unlocked ? 'bg-amber-500/[0.06] border border-amber-500/15 text-amber-400/60' : 'bg-white/[0.02] border border-white/[0.03] text-white/15'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className={`font-semibold ${unlocked ? 'text-amber-100/70' : 'text-white/15'}`}>
                        {level.name}
                      </div>
                      <p className={`text-xs mt-0.5 ${unlocked ? 'text-amber-400/25' : 'text-white/8'}`}>
                        {level.description}
                      </p>
                    </div>
                  </div>
                  <div className={`text-[10px] tracking-wider ${unlocked ? 'text-emerald-400/30' : 'text-white/8'}`}>
                    {level.crystalsNeeded} crystals
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={onBack}
          className="mt-8 w-full py-3.5 border border-white/[0.06] rounded-xl text-amber-500/20 text-sm hover:text-amber-400/35 hover:border-white/[0.1] hover:bg-white/[0.01] transition-all cursor-pointer"
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}

export default function LevelSelect({ levels, unlockedLevel, onSelectLevel, onBack }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dungeon overflow-y-auto p-6">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="text-amber-400/50 text-sm tracking-[0.3em] uppercase mb-2">Select Chamber</div>
          <h1 className="text-4xl font-bold text-amber-200">The Dungeon</h1>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mt-4" />
        </div>

        <div className="space-y-3">
          {levels.map((level, i) => {
            const unlocked = i <= unlockedLevel
            return (
              <button
                key={i}
                onClick={() => unlocked && onSelectLevel(i)}
                disabled={!unlocked}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
                  unlocked
                    ? 'border-amber-700/30 bg-dungeon-light/60 hover:border-amber-500/40 hover:bg-dungeon-light cursor-pointer active:scale-[0.98]'
                    : 'border-gray-800/30 bg-dungeon/40 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${unlocked ? 'text-amber-300' : 'text-gray-600'}`}>
                        {unlocked ? '◆' : '◇'}
                      </span>
                      <span className={`font-semibold ${unlocked ? 'text-amber-200' : 'text-gray-600'}`}>
                        Level {i + 1}: {level.name}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ml-7 ${unlocked ? 'text-amber-400/40' : 'text-gray-700'}`}>
                      {level.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={unlocked ? 'text-emerald-400/60' : 'text-gray-700'}>
                      {level.crystalsNeeded} crystals
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={onBack}
          className="mt-8 w-full py-3 border border-amber-700/20 rounded-lg text-amber-400/40 text-sm hover:text-amber-300/60 hover:border-amber-500/30 transition-all cursor-pointer"
        >
          ← Back to Menu
        </button>
      </div>
    </div>
  )
}

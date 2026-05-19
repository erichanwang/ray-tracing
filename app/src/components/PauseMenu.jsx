export default function PauseMenu({ onResume, onExit, musicVol, ambientVol, onChangeMusicVolume, onChangeAmbientVolume }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-dungeon/90 backdrop-blur-md rounded-xl border border-amber-700/40 px-8 py-8 min-w-[300px] max-w-[360px] w-full mx-4 shadow-2xl">
        {/* Title */}
        <h2 className="text-2xl font-bold text-amber-200 text-center mb-1 tracking-tight">Paused</h2>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent mx-auto mb-6" />

        {/* Volume Controls */}
        <div className="space-y-4 mb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="currentColor">
                <path d="M9 4v16l-4-4H2V8h3l4-4zm3 2.5v11a3.5 3.5 0 000-11zm2 0v11a5.5 5.5 0 000-11z" />
              </svg>
              <span className="text-amber-300 text-sm">Music</span>
              <span className="text-amber-500/40 text-xs ml-auto">{Math.round(musicVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVol}
              onChange={(e) => onChangeMusicVolume?.(parseFloat(e.target.value))}
              className="w-full h-1.5 appearance-none bg-amber-700/20 rounded-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="currentColor">
                <path d="M3 10h2v4H3v-4zm5-4h2v12H8V6zm5 2h2v8h-2V8zm5-4h2v16h-2V4z" />
              </svg>
              <span className="text-amber-300 text-sm">Ambient</span>
              <span className="text-amber-500/40 text-xs ml-auto">{Math.round(ambientVol * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={ambientVol}
              onChange={(e) => onChangeAmbientVolume?.(parseFloat(e.target.value))}
              className="w-full h-1.5 appearance-none bg-amber-700/20 rounded-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="px-8 py-3 bg-amber-500/10 border-2 border-amber-500/40 rounded-lg text-amber-300 font-semibold tracking-wide transition-all duration-300 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Resume
          </button>
          <button
            onClick={onExit}
            className="px-8 py-2.5 border border-red-800/30 rounded-lg text-red-400/50 text-sm transition-all duration-300 hover:border-red-600/40 hover:text-red-300/60 hover:bg-red-900/10 cursor-pointer"
          >
            Exit to Menu
          </button>
        </div>

        <div className="mt-5 text-center text-amber-500/20 text-xs">
          Press Escape or click Resume to continue
        </div>
      </div>
    </div>
  )
}

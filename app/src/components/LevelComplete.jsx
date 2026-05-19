export default function LevelComplete({ levelName, levelIndex, onNext }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dungeon">
      <div className="text-center px-6 animate-float">
        <div className="text-emerald-400 text-5xl mb-4">◆</div>
        <div className="text-amber-300/50 text-xs tracking-[0.3em] uppercase mb-1">
          Level {levelIndex + 1} Complete
        </div>
        <h2 className="text-3xl font-bold text-amber-200 mb-4">{levelName}</h2>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mx-auto mb-6" />
        <p className="text-amber-300/50 text-sm mb-8">
          You found the exit portal and escaped the darkness.
        </p>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-lg text-emerald-300 font-semibold text-lg transition-all duration-300 hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-200 hover:scale-105 active:scale-95 cursor-pointer"
        >
          {levelIndex >= 4 ? 'Finish' : 'Next Level →'}
        </button>
      </div>
    </div>
  )
}

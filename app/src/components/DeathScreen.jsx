import { useEffect, useState } from 'react'

export default function DeathScreen({ onRetry, onMenu }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dungeon relative overflow-hidden">
      {/* Death flash animation - red overlay */}
      <div className="absolute inset-0 bg-red-900/40 animate-death-flash" />

      {/* Particles */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${1.5 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 text-center px-6 transition-all duration-1000 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-red-400/60 text-6xl mb-6 animate-pulse-slow">☠</div>
        <div className="text-red-300/40 text-xs tracking-[0.3em] uppercase mb-2">The darkness consumed you</div>
        <h1 className="text-3xl font-bold text-red-200/80 mb-4">Light Fades</h1>
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent mx-auto mb-6" />
        <p className="text-amber-300/30 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
          Your lantern dimmed. Without light, the shadows claimed you.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRetry}
            className="px-8 py-3 bg-amber-500/10 border-2 border-amber-500/40 rounded-lg text-amber-300 font-semibold transition-all duration-300 hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            Retry Level
          </button>
          <button
            onClick={onMenu}
            className="px-8 py-3 border border-amber-700/20 rounded-lg text-amber-400/40 font-semibold transition-all duration-300 hover:border-amber-500/30 hover:text-amber-300/60 cursor-pointer"
          >
            Menu
          </button>
        </div>
      </div>
    </div>
  )
}

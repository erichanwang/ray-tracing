import { useEffect, useState } from 'react'

export default function DeathScreen({ onRetry, onMenu }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-dungeon relative overflow-hidden">
      {/* Death flash animation */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/60 via-red-950/20 to-black/80 animate-death-flash" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.7)_70%)]" />

      {/* Ember particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 3 === 0 ? '#7f1d1d' : i % 3 === 1 ? '#991b1b' : '#450a0a',
              animation: `float ${1.5 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.5 + Math.random() * 0.3,
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 text-center px-6 transition-all duration-1000 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Skull icon */}
        <div className="mb-6 relative">
          <div className="absolute inset-0 w-16 h-16 mx-auto bg-red-500/10 rounded-full blur-2xl animate-pulse-slow" />
          <svg viewBox="0 0 64 64" className="w-16 h-16 mx-auto relative fill-red-400/50">
            <path d="M32 4C18 4 8 18 8 32c0 6 2 12 6 16l2 8h36l2-8c4-4 6-10 6-16C60 18 46 4 32 4zm-16 24c2-2 4 0 4 2s-2 4-4 2-4 0-2-2c0-2 2-4 4-2l-2-2zm28 2c0-2 2-4 4-2 2 2 0 4-2 4s-4 0-4-2c0-2 2-2 4-2l-2-2zM20 44c4 4 8 8 12 8s8-4 12-8c2-2 4 0 2 2-4 4-10 8-14 8s-10-4-14-8c-2-2 0-4 2-2z"/>
          </svg>
        </div>

        <div className="text-red-400/30 text-[10px] tracking-[0.3em] uppercase mb-2">The darkness consumed you</div>
        <h1 className="text-3xl md:text-4xl font-bold text-red-200/70 mb-3 tracking-tight">Light Fades</h1>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent mx-auto mb-5" />
        
        <p className="text-amber-300/25 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
          Your lantern dimmed beyond recovery. Without its light, the shadows claimed your soul.
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRetry}
            className="group relative px-8 py-3 bg-amber-500/[0.07] border border-amber-500/20 rounded-xl text-amber-300/80 font-semibold transition-all duration-300 hover:border-amber-400/40 hover:bg-amber-500/[0.12] hover:text-amber-200 hover:scale-105 active:scale-95 cursor-pointer overflow-hidden"
          >
            <span className="relative z-10">Retry Level</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </button>
          <button
            onClick={onMenu}
            className="px-8 py-3 border border-white/5 rounded-xl text-amber-500/25 text-sm transition-all duration-300 hover:border-white/10 hover:text-amber-400/40 cursor-pointer"
          >
            Menu
          </button>
        </div>

        <div className="mt-8 text-red-500/10 text-xs">Press any button to continue</div>
      </div>
    </div>
  )
}

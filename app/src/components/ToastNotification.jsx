import { useState, useCallback, useRef, useEffect } from 'react'

let toastIdCounter = 0
let globalAddToast = null

export function addToast(message, type = 'achievement', duration = 3000) {
  if (globalAddToast) {
    globalAddToast({ id: ++toastIdCounter, message, type, duration })
  }
}

// Achievement types: 'achievement', 'info', 'warning', 'secret'
const TYPE_STYLES = {
  achievement: {
    bg: 'from-amber-500/15 to-amber-600/5',
    border: 'border-amber-500/25',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400 shrink-0" fill="currentColor">
        <path d="M12 2l2.5 7H22l-6 4.5 2.5 7L12 16l-6.5 4.5L8 13.5 2 9h7.5L12 2z" />
      </svg>
    ),
  },
  info: {
    bg: 'from-blue-500/15 to-blue-600/5',
    border: 'border-blue-500/25',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-400 shrink-0" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    ),
  },
  warning: {
    bg: 'from-red-500/15 to-red-600/5',
    border: 'border-red-500/25',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-400 shrink-0" fill="currentColor">
        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
      </svg>
    ),
  },
  secret: {
    bg: 'from-purple-500/15 to-purple-600/5',
    border: 'border-purple-500/25',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4 text-purple-400 shrink-0" fill="currentColor">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
      </svg>
    ),
  },
}

export default function ToastNotification() {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const addToastFn = useCallback((toast) => {
    const id = toast.id
    setToasts(prev => [...prev, { ...toast, exiting: false }])
    timersRef.current[id] = setTimeout(() => {
      // Start exit animation
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
        delete timersRef.current[id]
      }, 300)
    }, toast.duration)
  }, [])

  useEffect(() => {
    globalAddToast = addToastFn
    return () => { globalAddToast = null }
  }, [addToastFn])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info
        return (
          <div
            key={toast.id}
            className={`bg-gradient-to-r ${style.bg} backdrop-blur-xl ${style.border} rounded-xl px-4 py-2.5 shadow-2xl ring-1 ring-white/[0.03] transition-all duration-300 max-w-sm ${
              toast.exiting ? 'opacity-0 translate-y-[-12px] scale-95' : 'opacity-100 translate-y-0 scale-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {style.icon}
              <span className="text-amber-100/80 text-sm font-medium">{toast.message}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

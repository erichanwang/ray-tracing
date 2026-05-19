import { useRef, useEffect, useCallback } from 'react'

export default function MobileControls({ onMove, onLookDelta }) {
  const joystickRef = useRef(null)
  const lookRef = useRef(null)
  const joystickActive = useRef(false)
  const lookActive = useRef(false)
  const joystickId = useRef(null)
  const lookId = useRef(null)
  const joystickBase = useRef({ x: 0, y: 0 })
  const lastLook = useRef({ x: 0, y: 0 })
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      if (joystickRef.current) {
        joystickRef.current.style.display = isMobile ? 'flex' : 'none'
      }
      if (lookRef.current) {
        lookRef.current.style.display = isMobile ? 'flex' : 'none'
      }
    }
    checkMobile()
  }, [])

  const handleJoystickStart = useCallback((e) => {
    e.preventDefault()
    const touch = e.touches[0]
    joystickActive.current = true
    joystickId.current = touch.identifier
    const rect = joystickRef.current.getBoundingClientRect()
    joystickBase.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }
  }, [])

  const handleJoystickMove = useCallback((e) => {
    e.preventDefault()
    if (!joystickActive.current) return
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === joystickId.current) {
        const dx = e.touches[i].clientX - joystickBase.current.x
        const dy = e.touches[i].clientY - joystickBase.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = 50
        const clamped = Math.min(dist, maxDist)
        const mx = dist > 0 ? (dx / dist) * (clamped / maxDist) : 0
        const my = dist > 0 ? (dy / dist) * (clamped / maxDist) : 0
        if (onMove) onMove(mx, my)

        const knob = joystickRef.current.querySelector('.joystick-knob')
        if (knob) {
          knob.style.transform = `translate(${(dx / maxDist) * 30}px, ${(dy / maxDist) * 30}px)`
        }
        return
      }
    }
  }, [onMove])

  const handleJoystickEnd = useCallback((e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickId.current) {
        joystickActive.current = false
        joystickId.current = null
        if (onMove) onMove(0, 0)
        const knob = joystickRef.current?.querySelector('.joystick-knob')
        if (knob) knob.style.transform = 'translate(0, 0)'
      }
    }
  }, [onMove])

  const handleLookStart = useCallback((e) => {
    e.preventDefault()
    const touch = e.touches[0]
    lookActive.current = true
    lookId.current = touch.identifier
    lastLook.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleLookMove = useCallback((e) => {
    e.preventDefault()
    if (!lookActive.current) return
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === lookId.current) {
        const dx = e.touches[i].clientX - lastLook.current.x
        const dy = e.touches[i].clientY - lastLook.current.y
        lastLook.current = { x: e.touches[i].clientX, y: e.touches[i].clientY }
        if (onLookDelta) onLookDelta(dx, dy)
        return
      }
    }
  }, [onLookDelta])

  const handleLookEnd = useCallback((e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookId.current) {
        lookActive.current = false
        lookId.current = null
      }
    }
  }, [])

  return (
    <>
      {/* Joystick - bottom left */}
      <div
        ref={joystickRef}
        className="fixed bottom-20 left-8 w-28 h-28 rounded-full border-2 border-amber-500/30 bg-dungeon/40 backdrop-blur-sm items-center justify-center z-30 hidden"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      >
        <div className="joystick-knob w-12 h-12 rounded-full bg-amber-400/40 border border-amber-300/50 transition-transform duration-75" />
      </div>

      {/* Look area - bottom right */}
      <div
        ref={lookRef}
        className="fixed bottom-20 right-8 w-28 h-28 rounded-full border-2 border-amber-500/20 bg-dungeon/20 backdrop-blur-sm items-center justify-center z-30 hidden"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-amber-400/30">
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </div>
    </>
  )
}

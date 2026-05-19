import { useRef, useCallback } from 'react'

export default function MobileControls({ onMove, onLookDelta, onJump }) {
  const joystickRef = useRef(null)
  const lookRef = useRef(null)
  const joystickActive = useRef(false)
  const lookActive = useRef(false)
  const joystickId = useRef(null)
  const lookId = useRef(null)
  const joystickBase = useRef({ x: 0, y: 0 })
  const lastLook = useRef({ x: 0, y: 0 })
  const jumpPressed = useRef(false)

  const resetJoystick = useCallback(() => {
    joystickActive.current = false
    joystickId.current = null
    jumpPressed.current = false
    if (onMove) onMove(0, 0)
    const knob = joystickRef.current?.querySelector('.joystick-knob')
    if (knob) knob.style.transform = 'translate(0, 0)'
  }, [onMove])

  const resetLook = useCallback(() => {
    lookActive.current = false
    lookId.current = null
  }, [])

  const handleJoystickStart = useCallback((e) => {
    e.preventDefault()
    const touch = e.changedTouches[0]
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
        // Dead zone — ignore very small movements
        if (dist < 8) {
          if (onMove) onMove(0, 0)
          const knob = joystickRef.current.querySelector('.joystick-knob')
          if (knob) knob.style.transform = 'translate(0, 0)'
          return
        }
        const clamped = Math.min(dist, maxDist)
        const mx = (dx / dist) * (clamped / maxDist)
        const my = (dy / dist) * (clamped / maxDist)
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
        resetJoystick()
      }
    }
    // If all touches ended, clean up everything
    if (e.touches.length === 0) {
      resetJoystick()
      resetLook()
    }
  }, [resetJoystick, resetLook])

  const handleLookStart = useCallback((e) => {
    e.preventDefault()
    const touch = e.changedTouches[0]
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
        // Dead zone — ignore tiny deltas (noise)
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
        if (onLookDelta) onLookDelta(dx, dy)
        return
      }
    }
  }, [onLookDelta])

  const handleLookEnd = useCallback((e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === lookId.current) {
        resetLook()
      }
    }
  }, [resetLook])

  // touchcancel fires when the system cancels touches (e.g., notification)
  const handleJoystickCancel = useCallback(() => {
    resetJoystick()
  }, [resetJoystick])

  const handleLookCancel = useCallback(() => {
    resetLook()
  }, [resetLook])

  // Jump button — fires onJump when pressed
  const handleJumpDown = useCallback((e) => {
    e.preventDefault()
    if (!jumpPressed.current && onJump) {
      onJump(true)
      jumpPressed.current = true
    }
  }, [onJump])

  const handleJumpUp = useCallback((e) => {
    e.preventDefault()
    if (onJump) onJump(false)
    jumpPressed.current = false
  }, [onJump])

  return (
    <>
      {/* Joystick - bottom left */}
      <div
        ref={joystickRef}
        className="fixed bottom-20 left-8 w-28 h-28 rounded-full border-2 border-amber-500/30 bg-dungeon/40 backdrop-blur-sm items-center justify-center z-30 flex"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickCancel}
      >
        <div className="joystick-knob w-12 h-12 rounded-full bg-amber-400/40 border border-amber-300/50 transition-transform duration-75" />
      </div>

      {/* Jump button — center bottom */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-2 border-amber-400/30 bg-dungeon/40 backdrop-blur-sm flex items-center justify-center z-30 active:scale-90 transition-transform duration-100 select-none"
        onTouchStart={handleJumpDown}
        onTouchEnd={handleJumpUp}
        onTouchCancel={handleJumpUp}
      >
        <svg viewBox="0 0 24 24" className="w-10 h-10 text-amber-400/50">
          <path d="M12 4l-8 8h5v8h6v-8h5z" fill="currentColor" />
        </svg>
      </div>

      {/* Look area - bottom right */}
      <div
        ref={lookRef}
        className="fixed bottom-20 right-8 w-28 h-28 rounded-full border-2 border-amber-500/20 bg-dungeon/20 backdrop-blur-sm items-center justify-center z-30 flex"
        onTouchStart={handleLookStart}
        onTouchMove={handleLookMove}
        onTouchEnd={handleLookEnd}
        onTouchCancel={handleLookCancel}
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-amber-400/30">
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4" stroke="currentColor" strokeWidth="1" fill="none" />
        </svg>
      </div>
    </>
  )
}

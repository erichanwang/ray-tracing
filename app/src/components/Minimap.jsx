import { useRef, useEffect } from 'react'

const MAP_SIZE = 140
const CELL_SCALE = 2

export default function Minimap({ grid, playerPos, crystals, exitPos, devMode }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = MAP_SIZE * dpr
    canvas.height = MAP_SIZE * dpr
    canvas.style.width = MAP_SIZE + 'px'
    canvas.style.height = MAP_SIZE + 'px'
    ctx.scale(dpr, dpr)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !devMode) return
    const ctx = canvas.getContext('2d')
    const rows = grid.length
    const cols = grid[0].length

    const cellW = MAP_SIZE / cols
    const cellH = MAP_SIZE / rows

    // Background
    ctx.fillStyle = 'rgba(5, 5, 3, 0.85)'
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE)

    // Map offset
    const offsetX = (cols * 4) / 2
    const offsetZ = (rows * 4) / 2

    // Draw walls
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[z][x]
        if (cell === 1) {
          ctx.fillStyle = '#3a3a2a'
          ctx.fillRect(x * cellW + 1, z * cellH + 1, cellW - 2, cellH - 2)
        } else if (cell === 2 && crystals.some(c => {
          const cx = (c.pos[0] + offsetX) / 4
          const cz = (c.pos[2] + offsetZ) / 4
          return Math.abs(cx - x) < 0.5 && Math.abs(cz - z) < 0.5
        })) {
          // Crystal - green dot
          ctx.fillStyle = '#10b981'
          ctx.beginPath()
          ctx.arc(x * cellW + cellW / 2, z * cellH + cellH / 2, 3, 0, Math.PI * 2)
          ctx.fill()
        } else if (cell === 3) {
          // Exit - gold dot
          ctx.fillStyle = '#f59e0b'
          ctx.beginPath()
          ctx.arc(x * cellW + cellW / 2, z * cellH + cellH / 2, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Draw player
    if (playerPos) {
      const px = ((playerPos[0] + offsetX) / 4) * cellW
      const pz = ((playerPos[2] + offsetZ) / 4) * cellH
      // Player glow
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)'
      ctx.beginPath()
      ctx.arc(px, pz, 6, 0, Math.PI * 2)
      ctx.fill()
      // Player dot
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(px, pz, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Border
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE)
  }, [grid, playerPos, crystals, exitPos, devMode])

  if (!devMode) return null

  return (
    <div className="fixed bottom-4 right-4 z-20 opacity-70 hover:opacity-100 transition-opacity">
      <canvas ref={canvasRef} className="rounded-lg border border-amber-700/20" />
      <div className="text-amber-500/30 text-[10px] text-center mt-1 tracking-widest uppercase">Minimap</div>
    </div>
  )
}

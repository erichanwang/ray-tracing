import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, useTexture } from '@react-three/drei'
import { Vector3, Euler, DoubleSide, RepeatWrapping, BufferGeometry, BufferAttribute, AdditiveBlending, CanvasTexture } from 'three'
import { playFootstep, playCrystalCollect, playPortalActivate, playDeath, playKeyCollect, playDoorOpen, playSpikeHurt, playWallBump, playJump, playLanding, playSlide, playDash, playHeartbeat, playPickup, playSecret, playAchievement, playChestOpen, playPotBreak } from '../game/sound'
import { addToast } from './ToastNotification'

const CELL_SIZE = 4
const WALL_HEIGHT = 3
const PLAYER_SPEED = 8
const PLAYER_RADIUS = 0.35
const COLLECT_DISTANCE = 1.8
const HEALTH_DRAIN_RATE = 1.0
const HEALTH_PER_CRYSTAL = 30
const HEALTH_PER_PICKUP = 15
const FOOTSTEP_INTERVAL = 0.4
const LANTERN_MIN_INTENSITY = 6
const LANTERN_MIN_DISTANCE = 25
const DOOR_SLIDE_DURATION = 0.8
const SPIKES_DAMAGE_RATE = 15
const SPIKE_HURT_COOLDOWN = 0.5
const WALL_BUMP_COOLDOWN = 0.3
const GRAVITY = 15
const JUMP_VELOCITY = 6
const PLAYER_EYE_HEIGHT = 1.6
const DASH_COOLDOWN = 0.8
const DASH_DURATION = 0.15
const DASH_SPEED_MULT = 3.0
const COMBO_WINDOW = 1.2
const BOUNCE_VELOCITY = 12
const WEB_SLOW_MULT = 0.4
const ICE_FRICTION_MULT = 0.1

// Grid value constants — see levels.js grid legend
const WALL = 1
const CRYSTAL = 2
const EXIT = 3
const SPAWN = 4
const KEY = 5
const DOOR = 6
const STAIR_UP = 7
const PLATFORM = 8
const SPIKE = 9
const ICE = 10
const BOUNCE = 11
const WEB = 12
const SECRET_WALL = 13
const CHEST = 14
const TELEPORTER = 15
const HEALTH_PICKUP = 16
const MUSHROOM = 17
const POT = 18
const POWERUP_DOUBLE_JUMP = 19

function MazeWalls({ grid }) {
  const wallTex = useTexture('/textures/wall.svg')
  wallTex.wrapS = RepeatWrapping
  wallTex.wrapT = RepeatWrapping
  wallTex.repeat.set(1, 1)

  const walls = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === WALL) {
          const hueShift = ((x * 17 + z * 31) % 100) / 100 * 0.08 - 0.04
          const wallColor = `hsl(60, 8%, ${9 + hueShift * 100}%)`
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, WALL_HEIGHT / 2, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `${z}-${x}`,
            color: wallColor,
          })
        }
      }
    }
    return items
  }, [grid])

  return (
    <group>
      {walls.map((w) => (
        <mesh key={w.key} position={w.pos} castShadow receiveShadow>
          <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
          <meshStandardMaterial map={wallTex} roughness={0.85} metalness={0.1} color={w.color} />
        </mesh>
      ))}
    </group>
  )
}

// ---- Secret/Illusory Walls (passable, slightly transparent) ----
function SecretWalls({ grid, secretsRevealed }) {
  const secrets = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === SECRET_WALL) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, WALL_HEIGHT / 2, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `secret-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  // Show secret walls as shimmering translucent when not yet walked through
  const visibleWalls = useMemo(() => {
    return secrets.filter(s => !secretsRevealed.current.has(s.key))
  }, [secrets, secretsRevealed])

  return (
    <group>
      {visibleWalls.map((w) => (
        <mesh key={w.key} position={w.pos}>
          <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
          <meshStandardMaterial color="#4a4a3a" transparent opacity={0.3} roughness={0.9} metalness={0.5} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

// ---- Module-level reusable objects (avoid per-frame GC) ----
const _forward = new Vector3()
const _right = new Vector3()
const _euler = new Euler(0, 0, 0, 'YXZ')

// ---- Wall torches ----
function WallTorches({ grid }) {
  const torches = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    const half = CELL_SIZE / 2
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] !== WALL && grid[z][x] !== SECRET_WALL) continue
        dirs.forEach(([dx, dz], di) => {
          const nx = x + dx
          const nz = z + dz
          if (nz < 0 || nz >= rows || nx < 0 || nx >= cols) return
          if (grid[nz][nx] !== 0 && grid[nz][nx] !== SPAWN) return
          if (((x * 7 + z * 13 + di * 23) % 10) > 3) return
          const cx = x * CELL_SIZE - offsetX + CELL_SIZE / 2
          const cz = z * CELL_SIZE - offsetZ + CELL_SIZE / 2
          const faceX = cx + dx * half
          const faceZ = cz + dz * half
          items.push({
            pos: [faceX, WALL_HEIGHT * 0.7, faceZ],
            dir: [dx, dz],
            key: `torch-${z}-${x}-${di}`,
          })
        })
      }
    }
    return items
  }, [grid])

  return (
    <group>
      {torches.map((t) => (
        <TorchFlame key={t.key} pos={t.pos} dir={t.dir} />
      ))}
    </group>
  )
}

function TorchFlame({ pos, dir }) {
  const lightRef = useRef()
  const flameRef = useRef()
  const mountX = pos[0] - dir[0] * 1.2
  const mountZ = pos[2] - dir[1] * 1.2

  useFrame(() => {
    const t = Date.now() * 0.005
    const noise = (Math.sin(t * 47.1 + pos[0] * 23.7 + pos[2] * 31.3) * 0.5 + 0.5) * 0.05
    const flicker = 0.7 + Math.sin(t * 13.7 + pos[0] * 7.3) * 0.15 + Math.sin(t * 19.3 + pos[2] * 11.1) * 0.1 + noise
    if (lightRef.current) lightRef.current.intensity = flicker * 2.5
    if (flameRef.current) flameRef.current.scale.setScalar(0.85 + flicker * 0.3)
  })

  return (
    <group position={[mountX, pos[1], mountZ]}>
      <mesh position={[dir[0] * 0.3, -0.15, dir[1] * 0.3]} rotation={[0, Math.atan2(dir[0], dir[1]), 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 6]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.6} metalness={0.8} />
      </mesh>
      <mesh position={[dir[0] * 0.7, 0.0, dir[1] * 0.7]}>
        <cylinderGeometry args={[0.1, 0.07, 0.12, 8]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.5} metalness={0.9} />
      </mesh>
      <mesh ref={flameRef} position={[dir[0] * 0.7, 0.1, dir[1] * 0.7]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <mesh position={[dir[0] * 0.7, 0.06, dir[1] * 0.7]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <pointLight ref={lightRef} position={[dir[0] * 0.7, 0.1, dir[1] * 0.7]} color="#f59e0b" intensity={2} distance={8} decay={1.2} />
    </group>
  )
}

// ---- Canvas-generated circular sprite texture for dust particles ----
function createDustSprite() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2)
  gradient.addColorStop(0, 'rgba(255,232,192,1)')
  gradient.addColorStop(0.15, 'rgba(255,232,192,0.85)')
  gradient.addColorStop(0.4, 'rgba(255,220,160,0.4)')
  gradient.addColorStop(0.7, 'rgba(255,200,120,0.05)')
  gradient.addColorStop(1, 'rgba(255,180,100,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return canvas
}

let dustSpriteCanvas = null
function getDustSprite() {
  if (!dustSpriteCanvas) dustSpriteCanvas = createDustSprite()
  return dustSpriteCanvas
}

// ---- Footstep puff particle system ----
const MAX_PUFFS = 60
const puffPool = []
for (let i = 0; i < MAX_PUFFS; i++) {
  puffPool.push({ active: false, x: 0, y: 0, z: 0, vy: 0, life: 0, maxLife: 0, size: 0 })
}

let puffIndex = 0

function emitFootstepPuff(wx, wy, wz) {
  const p = puffPool[puffIndex % MAX_PUFFS]
  puffIndex++
  p.active = true
  p.x = wx + (Math.random() - 0.5) * 0.3
  p.y = wy + 0.05
  p.z = wz + (Math.random() - 0.5) * 0.3
  p.vy = 0.3 + Math.random() * 0.3
  p.life = 0
  p.maxLife = 0.4 + Math.random() * 0.2
  p.size = 0.02 + Math.random() * 0.04
}

function FootstepParticles({ gameState }) {
  const pointsRef = useRef()
  const posArr = useMemo(() => new Float32Array(MAX_PUFFS * 3), [])
  const sizeArr = useMemo(() => new Float32Array(MAX_PUFFS), [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const pos = pointsRef.current.geometry.attributes.position.array
    const sizes = pointsRef.current.geometry.attributes.size.array
    for (let i = 0; i < MAX_PUFFS; i++) {
      const p = puffPool[i]
      if (!p.active) {
        pos[i * 3] = 0; pos[i * 3 + 1] = -100; pos[i * 3 + 2] = 0
        sizes[i] = 0
        continue
      }
      p.life += delta
      const t = p.life / p.maxLife
      if (t >= 1) { p.active = false; pos[i * 3 + 1] = -100; sizes[i] = 0; continue }
      p.y += p.vy * delta
      p.vy -= 1.5 * delta
      pos[i * 3] = p.x
      pos[i * 3 + 1] = p.y
      pos[i * 3 + 2] = p.z
      sizes[i] = p.size * (1 - t)
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.size.needsUpdate = true
  })

  // Emit puffs when player is moving and grounded
  const footstepPuffTimer = useRef(0)
  useFrame((_, delta) => {
    if (!gameState.isMoving || !gameState.playerPos || !gameState.playerOnFloor !== undefined) return
    const footY = (gameState.playerOnFloor ?? 0)
    footstepPuffTimer.current -= delta
    if (footstepPuffTimer.current <= 0 && gameState.isMoving && gameState.playerPos) {
      footstepPuffTimer.current = 0.25
      const [px, py, pz] = gameState.playerPos
      emitFootstepPuff(px, footY, pz)
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={MAX_PUFFS} array={posArr} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={MAX_PUFFS} array={sizeArr} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial color="#8a7a5a" size={0.04} transparent opacity={0.3} depthWrite={false} sizeAttenuation blending={AdditiveBlending} />
    </points>
  )
}

// ---- Atmospheric dust particles ----
function DustParticles({ grid }) {
  const rows = grid.length
  const cols = grid[0].length

  const [positions] = useMemo(() => {
    const count = 400
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    let i = 0
    while (i < count) {
      const wx = (Math.random() - 0.5) * cols * CELL_SIZE
      const wz = (Math.random() - 0.5) * rows * CELL_SIZE
      const gx = Math.floor((wx + offsetX) / CELL_SIZE)
      const gz = Math.floor((wz + offsetZ) / CELL_SIZE)
      if (gz >= 0 && gz < rows && gx >= 0 && gx < cols && grid[gz][gx] === 0) {
        pos[i * 3] = wx
        pos[i * 3 + 1] = Math.random() * WALL_HEIGHT
        pos[i * 3 + 2] = wz
        sz[i] = Math.random() * 0.06 + 0.015
        i++
      }
    }
    return [pos, sz]
  }, [grid])

  const spriteTexture = useMemo(() => {
    const canvas = getDustSprite()
    const tex = new CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  const pointsRef = useRef()
  useFrame((_, delta) => {
    if (pointsRef.current) {
      const posArr = pointsRef.current.geometry.attributes.position.array
      for (let i = 0; i < posArr.length; i += 3) {
        posArr[i + 1] += delta * 0.15
        if (posArr[i + 1] > WALL_HEIGHT) posArr[i + 1] = 0
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={spriteTexture}
        color="#ffe8c0"
        size={0.08}
        transparent
        opacity={0.35}
        blending={AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// ---- Water drip particles from ceiling ----
function WaterDrips({ grid }) {
  const rows = grid.length
  const cols = grid[0].length

  const drips = useMemo(() => {
    const items = []
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    const count = 15 + Math.floor(Math.random() * 10)
    for (let i = 0; i < count; i++) {
      const wx = (Math.random() - 0.5) * cols * CELL_SIZE
      const wz = (Math.random() - 0.5) * rows * CELL_SIZE
      const gx = Math.floor((wx + offsetX) / CELL_SIZE)
      const gz = Math.floor((wz + offsetZ) / CELL_SIZE)
      if (gz >= 0 && gz < rows && gx >= 0 && gx < cols && grid[gz][gx] === 0) {
        items.push({
          x: wx, z: wz,
          delay: Math.random() * 5,
          speed: 2 + Math.random() * 2,
          key: `drip-${i}`,
        })
      }
    }
    return items
  }, [grid, rows, cols])

  const dripRef = useRef({})

  useFrame((_, delta) => {
    drips.forEach(d => {
      const state = dripRef.current[d.key]
      if (!state) {
        dripRef.current[d.key] = { y: WALL_HEIGHT - 0.1, timer: d.delay, active: true }
        return
      }
      if (!state.active) return
      state.timer -= delta
      if (state.timer > 0) return
      state.y -= d.speed * delta
      if (state.y < 0) {
        state.y = WALL_HEIGHT - 0.1
        state.timer = 1 + Math.random() * 3
      }
    })
  })

  // Simple point-based drips using separate spheres
  return (
    <group>
      {drips.map(d => {
        const state = dripRef.current[d.key]
        if (!state || !state.active || state.timer > 0) return null
        return (
          <mesh key={d.key} position={[d.x, state?.y ?? 2.9, d.z]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshBasicMaterial color="#8ab4d4" transparent opacity={0.3} />
          </mesh>
        )
      })}
    </group>
  )
}

function Floor({ grid }) {
  const floorTex = useTexture('/textures/floor.svg')
  floorTex.wrapS = RepeatWrapping
  floorTex.wrapT = RepeatWrapping
  floorTex.repeat.set(4, 4)

  const rows = grid.length
  const cols = grid[0].length

  // Ice overlay cells
  const iceCells = useMemo(() => {
    const items = []
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === ICE) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `ice-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  // Web overlay cells
  const webCells = useMemo(() => {
    const items = []
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === WEB) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0.02, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `web-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[cols * CELL_SIZE, rows * CELL_SIZE]} />
        <meshStandardMaterial map={floorTex} roughness={0.7} metalness={0.05} color="#2a2a18" />
      </mesh>
      {/* Ice patches - blue tint overlay */}
      {iceCells.map((ic) => (
        <mesh key={ic.key} position={ic.pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CELL_SIZE * 0.95, CELL_SIZE * 0.95]} />
          <meshStandardMaterial color="#6ab4d4" transparent opacity={0.25} roughness={0.1} metalness={0.3} />
        </mesh>
      ))}
      {/* Web patches - white/gray overlay */}
      {webCells.map((wc) => (
        <mesh key={wc.key} position={wc.pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[CELL_SIZE * 0.95, CELL_SIZE * 0.95]} />
          <meshBasicMaterial color="#d4c8b0" transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  )
}

function Ceiling({ grid }) {
  const rows = grid.length
  const cols = grid[0].length
  const cracks = useMemo(() => {
    const items = []
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let i = 0; i < 12; i++) {
      const cx = (Math.random() - 0.5) * cols * CELL_SIZE * 0.8
      const cz = (Math.random() - 0.5) * rows * CELL_SIZE * 0.8
      const angle = Math.random() * Math.PI
      const len = 2 + Math.random() * 5
      items.push({ pos: [cx, WALL_HEIGHT + 0.02, cz], angle, len, key: `crack-${i}` })
    }
    return items
  }, [cols, rows])

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT + 0.015, 0]}>
        <planeGeometry args={[cols * CELL_SIZE, rows * CELL_SIZE]} />
        <meshStandardMaterial color="#030302" roughness={1} side={DoubleSide} />
      </mesh>
      {cracks.map((c) => (
        <mesh key={c.key} position={c.pos} rotation={[0, c.angle, 0]}>
          <boxGeometry args={[c.len, 0.005, 0.02]} />
          <meshBasicMaterial color="#010100" />
        </mesh>
      ))}
    </group>
  )
}

function PlatformFloors({ grid }) {
  const floorTex = useTexture('/textures/floor.svg')
  floorTex.wrapS = RepeatWrapping
  floorTex.wrapT = RepeatWrapping

  const platforms = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === PLATFORM) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, WALL_HEIGHT, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `plat-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  return (
    <group>
      {platforms.map((p) => (
        <mesh key={p.key} position={p.pos} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[CELL_SIZE * 0.98, CELL_SIZE * 0.98]} />
          <meshStandardMaterial map={floorTex} roughness={0.7} metalness={0.05} color="#2a2a18" />
        </mesh>
      ))}
    </group>
  )
}

function PlatformWalls({ grid }) {
  const wallTex = useTexture('/textures/wall.svg')
  wallTex.wrapS = RepeatWrapping
  wallTex.wrapT = RepeatWrapping

  const segments = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] !== PLATFORM) continue
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]
        dirs.forEach(([dx, dz]) => {
          const nx = x + dx
          const nz = z + dz
          if (nz < 0 || nz >= rows || nx < 0 || nx >= cols) return
          const neighbor = grid[nz][nx]
          if (neighbor === PLATFORM || neighbor === STAIR_UP) return
          const cx = x * CELL_SIZE - offsetX + CELL_SIZE / 2
          const cz = z * CELL_SIZE - offsetZ + CELL_SIZE / 2
          const half = CELL_SIZE / 2
          const wallX = cx + dx * half
          const wallZ = cz + dz * half
          const isX = dx !== 0
          items.push({
            pos: [wallX, WALL_HEIGHT + 0.5, wallZ],
            size: isX ? [0.2, 1, CELL_SIZE * 0.96] : [CELL_SIZE * 0.96, 1, 0.2],
            key: `pw-${z}-${x}-${dx}-${dz}`,
          })
        })
      }
    }
    return items
  }, [grid])

  return (
    <group>
      {segments.map((s) => (
        <mesh key={s.key} position={s.pos} castShadow receiveShadow>
          <boxGeometry args={s.size} />
          <meshStandardMaterial map={wallTex} roughness={0.85} metalness={0.1} color="#2a2a18" />
        </mesh>
      ))}
    </group>
  )
}

function StairsDisplay({ grid }) {
  const floorTex = useTexture('/textures/floor.svg')
  floorTex.wrapS = RepeatWrapping
  floorTex.wrapT = RepeatWrapping

  const stairs = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === STAIR_UP) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `stair-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  return (
    <group>
      {stairs.map((s) => (
        <RampMesh key={s.key} pos={s.pos} />
      ))}
    </group>
  )
}

function RampMesh({ pos }) {
  const half = CELL_SIZE / 2
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const h = WALL_HEIGHT
    const vertices = new Float32Array([
      -half, 0, -half,
       half, 0, -half,
       half, h,  half,
      -half, 0, -half,
       half, h,  half,
      -half, h,  half,
    ])
    const uvs = new Float32Array([
      0, 1, 1, 1, 1, 0,
      0, 1, 1, 0, 0, 0,
    ])
    geo.setAttribute('position', new BufferAttribute(vertices, 3))
    geo.setAttribute('uv', new BufferAttribute(uvs, 2))
    geo.computeVertexNormals()
    return geo
  }, [])

  const tex = useTexture('/textures/floor.svg')
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping

  return (
    <mesh geometry={geometry} position={pos} receiveShadow>
      <meshStandardMaterial map={tex} roughness={0.7} metalness={0.05} color="#2a2a18" side={DoubleSide} />
    </mesh>
  )
}

function CrystalsDisplay({ crystals }) {
  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current) {
      const t = Date.now() * 0.002
      groupRef.current.children.forEach((child, i) => {
        if (child.isMesh && child.material) {
          const pulse = 0.8 + Math.sin(t + i * 1.5) * 0.2
          child.material.emissiveIntensity = pulse * 1.5
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {crystals.map((c) => (
        <mesh key={c.key} position={c.pos}>
          <dodecahedronGeometry args={[0.3, 1]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#059669"
            emissiveIntensity={1.5}
            roughness={0.2}
            metalness={0.1}
          />
          <pointLight color="#10b981" intensity={2} distance={6} />
        </mesh>
      ))}
    </group>
  )
}

// ---- Glowing Mushrooms ----
function MushroomsDisplay({ grid }) {
  const mushrooms = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === MUSHROOM) {
          const yOff = getFloorHeightForCell(x, z, grid)
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, yOff, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `mushroom-${z}-${x}`,
            hue: Math.random() * 0.15 + 0.5, // blue-green hue
          })
        }
      }
    }
    return items
  }, [grid])

  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current) {
      const t = Date.now() * 0.003
      groupRef.current.children.forEach((child, i) => {
        if (child.isMesh && child.material) {
          child.material.emissiveIntensity = 0.5 + Math.sin(t + i * 2.1) * 0.2
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {mushrooms.map((m) => (
        <group key={m.key} position={[m.pos[0], m.pos[1], m.pos[2]]}>
          {/* Stem */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.05, 0.08, 0.3, 6]} />
            <meshStandardMaterial color="#8a7a5a" roughness={0.9} />
          </mesh>
          {/* Cap */}
          <mesh position={[0, 0.35, 0]}>
            <sphereGeometry args={[0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial
              color="#4ad4f5"
              emissive="#3ac4e5"
              emissiveIntensity={0.6}
              roughness={0.4}
            />
          </mesh>
          {/* Glow */}
          <pointLight color="#4ad4f5" intensity={1.5} distance={4} decay={1.5} />
        </group>
      ))}
    </group>
  )
}

// ---- Treasure Chests ----
function ChestsDisplay({ chests, onOpenChest }) {
  return (
    <group>
      {chests.map((c) => (
        <ChestItem key={c.key} chest={c} onOpen={onOpenChest} />
      ))}
    </group>
  )
}

function ChestItem({ chest, onOpen }) {
  const [opened, setOpened] = useState(false)
  const lidRef = useRef()

  useFrame(() => {
    if (lidRef.current && opened) {
      lidRef.current.rotation.x += (Math.PI / -4 - lidRef.current.rotation.x) * 0.1
    }
  })

  const handleClick = useCallback(() => {
    if (!opened) {
      setOpened(true)
      playChestOpen()
      if (onOpen) onOpen(chest)
    }
  }, [opened, chest, onOpen])

  // Collision detection in GameLogic instead
  return (
    <group position={chest.pos}>
      {/* Chest body */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.5, 0.3, 0.4]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Lid */}
      <mesh ref={lidRef} position={[0, 0.35, 0.05]}>
        <boxGeometry args={[0.52, 0.1, 0.22]} />
        <meshStandardMaterial color="#7a5a3a" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Gold trim */}
      <mesh position={[0, 0.2, 0.2]}>
        <boxGeometry args={[0.44, 0.04, 0.04]} />
        <meshStandardMaterial color="#d4a030" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Lock */}
      {!opened && (
        <mesh position={[0, 0.2, 0.22]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      )}
      <pointLight color="#d4a030" intensity={1.5} distance={3} />
    </group>
  )
}

// ---- Breakable Pots ----
function PotsDisplay({ pots, brokenPots }) {
  return (
    <group>
      {pots.map((p) => {
        if (brokenPots.current.has(p.key)) return null
        return (
          <mesh key={p.key} position={p.pos}>
            <cylinderGeometry args={[0.15, 0.2, 0.3, 8]} />
            <meshStandardMaterial color="#8a5a3a" roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

// ---- Bouncy Pads ----
function BouncyPadsDisplay({ grid }) {
  const pads = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === BOUNCE) {
          const yOff = getFloorHeightForCell(x, z, grid)
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0.02 + yOff, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `bounce-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current) {
      const t = Date.now() * 0.005
      groupRef.current.children.forEach((child, i) => {
        if (child.isMesh) {
          child.material.emissiveIntensity = 0.3 + Math.sin(t + i * 1.3) * 0.2
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {pads.map((p) => (
        <mesh key={p.key} position={p.pos} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.45, 16]} />
          <meshStandardMaterial color="#4a8af5" emissive="#2a6af5" emissiveIntensity={0.4} roughness={0.3} metalness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ---- Teleporters ----
function TeleporterDisplay({ grid, teleportEffects }) {
  const teleporters = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === TELEPORTER) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0.05, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `teleporter-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])
  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current) {
      const t = Date.now() * 0.002
      groupRef.current.children.forEach((child, i) => {
        if (child.isMesh && child.material) {
          const phase = 0.5 + Math.sin(t + i * 2.5) * 0.3
          child.material.opacity = 0.3 + phase * 0.3
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {teleporters.filter(tp => !teleportEffects.current.has(tp.key + '-used')).map((tp) => (
        <group key={tp.key} position={tp.pos}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.1, 0.4, 16]} />
            <meshBasicMaterial color="#c084fc" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#c084fc" transparent opacity={0.6} />
          </mesh>
          <pointLight color="#c084fc" intensity={2} distance={5} decay={1.5} />
        </group>
      ))}
    </group>
  )
}

// ---- Health Pickups ----
function HealthPickupsDisplay({ healthPickups }) {
  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current) {
      const t = Date.now() * 0.003
      groupRef.current.children.forEach((child, i) => {
        if (child.isMesh) {
          child.position.y = child.userData.baseY + Math.sin(t + i * 1.7) * 0.05
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {healthPickups.map((h) => (
        <group key={h.key} position={h.pos} userData={{ baseY: h.pos[1] }}>
          <mesh>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#e84a6a" emissive="#d43a5a" emissiveIntensity={0.5} roughness={0.3} />
          </mesh>
          {/* Cross symbol */}
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[0.12, 0.04]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.06]}>
            <planeGeometry args={[0.12, 0.04]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          <pointLight color="#e84a6a" intensity={1.5} distance={4} />
        </group>
      ))}
    </group>
  )
}

// ---- Double-Jump Powerup ----
function PowerupDisplay({ powerups }) {
  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current) {
      const t = Date.now() * 0.003
      groupRef.current.rotation.y += 0.02
      groupRef.current.children.forEach((child, i) => {
        if (child.isMesh) {
          child.material.emissiveIntensity = 0.5 + Math.sin(t + i * 2.3) * 0.3
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {powerups.map((p) => (
        <group key={p.key} position={p.pos}>
          <mesh>
            <torusGeometry args={[0.18, 0.06, 8, 16]} />
            <meshStandardMaterial color="#f472b6" emissive="#ec4899" emissiveIntensity={0.8} roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <torusGeometry args={[0.12, 0.05, 8, 16]} />
            <meshStandardMaterial color="#f9a8d4" emissive="#f472b6" emissiveIntensity={0.6} roughness={0.2} metalness={0.2} />
          </mesh>
          <pointLight color="#f472b6" intensity={2} distance={5} />
        </group>
      ))}
    </group>
  )
}

function ExitPortalDisplay({ position, activated }) {
  const groupRef = useRef()

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 1.5
      const s = 1 + Math.sin(Date.now() * 0.003) * 0.1
      groupRef.current.scale.setScalar(s)
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <torusGeometry args={[0.7, 0.15, 16, 32]} />
        <meshStandardMaterial
          color={activated ? '#f59e0b' : '#4a4a3a'}
          emissive={activated ? '#fbbf24' : '#2a2a1a'}
          emissiveIntensity={activated ? 2 : 0.3}
          roughness={0.3}
        />
      </mesh>
      <pointLight
        color={activated ? '#f59e0b' : '#3a3a2a'}
        intensity={activated ? 4 : 0.5}
        distance={activated ? 12 : 3}
      />
      {!activated && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}
    </group>
  )
}

function KeysDisplay({ keys }) {
  return (
    <group>
      {keys.map((k) => (
        <group key={k.key}>
          <mesh position={k.pos}>
            <torusGeometry args={[0.15, 0.05, 8, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#d97706"
              emissiveIntensity={1.0}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
          <mesh position={[0, -0.25, 0]}>
            <boxGeometry args={[0.06, 0.3, 0.04]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#d97706"
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
          <pointLight color="#fbbf24" intensity={1.5} distance={5} />
        </group>
      ))}
    </group>
  )
}

function LockedDoorsDisplay({ doors, doorSlideStates }) {
  const doorTex = useTexture('/textures/door.svg')
  doorTex.wrapS = RepeatWrapping
  doorTex.wrapT = RepeatWrapping

  const { clock } = useThree()
  const groupRefs = useRef({})

  useFrame(() => {
    const now = clock.getElapsedTime()
    doors.forEach((d) => {
      const state = doorSlideStates.current[d.key]
      if (!state) return
      if (state.done) {
        const gr = groupRefs.current[d.key]
        if (gr) gr.visible = false
        return
      }
      const elapsed = (now - state.startTime) / DOOR_SLIDE_DURATION
      const t = Math.min(1, elapsed)
      if (t >= 1) {
        state.done = true
        const gr = groupRefs.current[d.key]
        if (gr) gr.visible = false
        return
      }
      const eased = 1 - Math.pow(1 - t, 3)
      const slideY = eased * (WALL_HEIGHT + 1)
      const gr = groupRefs.current[d.key]
      if (gr) {
        gr.position.y = d.pos[1] + slideY
        gr.children.forEach((child) => {
          if (child.material && child.material.opacity !== undefined) {
            child.material.opacity = 0.7 * (1 - t)
          }
        })
      }
    })
  })

  return (
    <group>
      {doors.map((d) => {
        const state = doorSlideStates.current[d.key]
        if (state && state.done) return null
        return (
          <group
            key={d.key}
            ref={(el) => { groupRefs.current[d.key] = el }}
            position={d.pos}
          >
            <mesh position={[0, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[CELL_SIZE * 0.85, WALL_HEIGHT * 0.9, 0.2]} />
              <meshStandardMaterial map={doorTex} roughness={0.6} metalness={0.4} color="#4a3728" />
            </mesh>
            <mesh position={[0, WALL_HEIGHT / 2, 0.15]}>
              <sphereGeometry args={[0.25, 16, 16]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
            </mesh>
            <pointLight color="#ef4444" intensity={2} distance={5} position={[0, WALL_HEIGHT / 2, 0.3]} />
          </group>
        )
      })}
    </group>
  )
}

function LanternLight({ healthPct }) {
  const { camera } = useThree()
  const lightRef = useRef()

  const intensity = Math.max(LANTERN_MIN_INTENSITY, 3 + (healthPct / 100) * 8)
  const distance = Math.max(LANTERN_MIN_DISTANCE, 20 + (healthPct / 100) * 20)

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position)
      lightRef.current.intensity = intensity
      lightRef.current.distance = distance
    }
  })

  return (
    <pointLight
      ref={lightRef}
      color="#fbbf24"
      intensity={intensity}
      distance={distance}
      decay={0.8}
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      castShadow
    />
  )
}

function SpikesDisplay({ grid }) {
  const spikes = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] !== SPIKE) continue
        const yOff = getFloorHeightForCell(x, z, grid)
        for (let sx = 0; sx < 3; sx++) {
          for (let sz = 0; sz < 3; sz++) {
            const fx = x * CELL_SIZE - offsetX + CELL_SIZE / 2 + (sx - 1) * (CELL_SIZE / 3)
            const fz = z * CELL_SIZE - offsetZ + CELL_SIZE / 2 + (sz - 1) * (CELL_SIZE / 3)
            const angle = ((sx * 13 + sz * 7 + x * 31 + z * 17) * 0.618) % (Math.PI * 2)
            items.push({ pos: [fx, 0.05 + yOff, fz], angle, key: `spike-${z}-${x}-${sx}-${sz}` })
          }
        }
      }
    }
    return items
  }, [grid])

  // Pulsing animation
  const groupRef = useRef()
  useFrame(() => {
    if (groupRef.current) {
      const t = Date.now() * 0.004
      groupRef.current.children.forEach((child, i) => {
        if (child.isMesh && child.material) {
          child.material.emissiveIntensity = 0.2 + Math.sin(t + i * 0.7) * 0.2
        }
      })
    }
  })

  return (
    <group ref={groupRef}>
      {spikes.map((s) => (
        <mesh key={s.key} position={s.pos} rotation={[0, s.angle, 0]} castShadow receiveShadow>
          <coneGeometry args={[0.12, 0.35, 4]} />
          <meshStandardMaterial
            color="#8b0000"
            emissive="#cc0000"
            emissiveIntensity={0.4}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}

function getFloorHeightAt(wx, wz, grid) {
  const rows = grid.length
  const cols = grid[0].length
  const offsetX = (cols * CELL_SIZE) / 2
  const offsetZ = (rows * CELL_SIZE) / 2
  const gx = (wx + offsetX) / CELL_SIZE
  const gz = (wz + offsetZ) / CELL_SIZE
  const ix = Math.floor(gx)
  const iz = Math.floor(gz)
  if (iz < 0 || iz >= rows || ix < 0 || ix >= cols) return 0

  const cell = grid[iz][ix]
  if (cell === PLATFORM) return WALL_HEIGHT
  if (cell === STAIR_UP) {
    const cellWorldZ = iz * CELL_SIZE - offsetZ + CELL_SIZE / 2
    const southEdge = cellWorldZ - CELL_SIZE / 2
    const t = (wz - southEdge) / CELL_SIZE
    return Math.max(0, Math.min(WALL_HEIGHT, t * WALL_HEIGHT))
  }
  return 0
}

// ---- Player shadow disc ----
function PlayerShadow({ gameState }) {
  const shadowRef = useRef()
  useFrame(() => {
    if (!shadowRef.current || !gameState.playerPos) return
    const [px, py, pz] = gameState.playerPos
    const floorH = gameState.playerOnFloor ?? 0
    shadowRef.current.position.set(px, floorH + 0.03, pz)
    const heightAbove = py - floorH - 1.6 + 1.6
    const s = Math.max(0.3, 1 - Math.abs(heightAbove - 1.6) * 0.2)
    shadowRef.current.scale.setScalar(s)
    shadowRef.current.material.opacity = Math.max(0.1, 0.35 * s)
  })
  return (
    <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
      <ringGeometry args={[0.15, 0.35, 32]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.35} depthWrite={false} />
    </mesh>
  )
}

// ---- Screen shake helper ----
let screenShakeAmount = 0
export function triggerScreenShake(amount = 0.1) {
  screenShakeAmount = Math.max(screenShakeAmount, amount)
}

function ScreenShake({ camera }) {
  useFrame((_, delta) => {
    if (screenShakeAmount > 0.001) {
      camera.position.x += (Math.random() - 0.5) * screenShakeAmount * 0.5
      camera.position.y += (Math.random() - 0.5) * screenShakeAmount * 0.5
      camera.position.z += (Math.random() - 0.5) * screenShakeAmount * 0.5
      screenShakeAmount *= Math.max(0, 1 - delta * 12)
    } else {
      screenShakeAmount = 0
    }
  })
  return null
}

function getCellAt(wx, wz, grid) {
  const rows = grid.length
  const cols = grid[0].length
  const offsetX = (cols * CELL_SIZE) / 2
  const offsetZ = (rows * CELL_SIZE) / 2
  const gx = Math.floor((wx + offsetX) / CELL_SIZE)
  const gz = Math.floor((wz + offsetZ) / CELL_SIZE)
  if (gz >= 0 && gz < rows && gx >= 0 && gx < cols) return grid[gz][gx]
  return -1
}

function Player({ grid, gameState, mobileMove, mobileLookRef, doorsOpenedRef, paused, mobileJump, secretsRevealed, hasDoubleJump, onDoubleJumpCollected, onDashUsed, onHealthPickup, onChestOpen, onTeleport, gameStats }) {
  const { camera } = useThree()
  const keys = useRef({})
  const footstepTimer = useRef(0)
  const wallBumpTimer = useRef(0)
  const bobPhase = useRef(0)
  const verticalVel = useRef(0)
  const jumpHeld = useRef(false)
  const prevMobileJump = useRef(false)
  const prevGrounded = useRef(true)
  const landingDip = useRef(0)
  const strafeTilt = useRef(0)
  const velocityX = useRef(0)
  const velocityZ = useRef(0)
  const mobileSprintingRef = useRef(false)
  const wallRunTilt = useRef(0)
  const isSliding = useRef(false)
  const slideTimer = useRef(0)
  const slideCooldown = useRef(0)
  const dashCooldown = useRef(0)
  const dashing = useRef(false)
  const dashDirX = useRef(0)
  const dashDirZ = useRef(0)
  const jumpsLeft = useRef(1)
  const comboCount = useRef(0)
  const comboTimer = useRef(0)
  const lastCell = useRef(-1)
  const heartBeatTimer = useRef(0)
  const landingSoundPlayed = useRef(true)
  const teleportCooldown = useRef(0)
  const lastCellHealthPickups = useRef(new Set())

  const spawnPos = useMemo(() => {
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === SPAWN) {
          return [x * CELL_SIZE - offsetX + CELL_SIZE / 2, PLAYER_EYE_HEIGHT, z * CELL_SIZE - offsetZ + CELL_SIZE / 2]
        }
      }
    }
    return [0, PLAYER_EYE_HEIGHT, 0]
  }, [grid])

  const checkCollision = useCallback((x, z) => {
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    const gridX = Math.round((x + offsetX) / CELL_SIZE)
    const gridZ = Math.round((z + offsetZ) / CELL_SIZE)
    const half = CELL_SIZE / 2

    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = gridX + dx
        const cz = gridZ + dz
        if (cz >= 0 && cz < rows && cx >= 0 && cx < cols) {
          const cell = grid[cz][cx]
          const blocks = cell === WALL || (cell === DOOR && !(doorsOpenedRef?.current?.has(`${cz}-${cx}`))) || cell === SECRET_WALL
          if (blocks) {
            const wcx = cx * CELL_SIZE - offsetX + CELL_SIZE / 2
            const wcz = cz * CELL_SIZE - offsetZ + CELL_SIZE / 2
            const closestX = Math.max(wcx - half, Math.min(x, wcx + half))
            const closestZ = Math.max(wcz - half, Math.min(z, wcz + half))
            if (Math.sqrt((x - closestX) ** 2 + (z - closestZ) ** 2) < PLAYER_RADIUS) {
              return true
            }
          }
        }
      }
    }
    return false
  }, [grid])

  // Secret walls - detect when player walks through them
  const checkSecretWall = useCallback((x, z) => {
    const cell = getCellAt(x, z, grid)
    return cell === SECRET_WALL
  }, [grid])

  // Teleporter check
  const checkTeleporter = useCallback((x, z) => {
    const cell = getCellAt(x, z, grid)
    return cell === TELEPORTER
  }, [grid])

  // Surface type for sounds
  const getSurfaceType = useCallback((x, z) => {
    return getCellAt(x, z, grid)
  }, [grid])

  useEffect(() => {
    camera.position.set(spawnPos[0], spawnPos[1], spawnPos[2])
  }, [spawnPos, camera])

  useEffect(() => {
    const onKeyDown = (e) => {
      keys.current[e.code] = true
      // Dash on F key
      if (e.code === 'KeyF' && dashCooldown.current <= 0 && !dashing.current) {
        e.preventDefault()
        dashCooldown.current = DASH_COOLDOWN
        dashing.current = true
        // Direction: use current movement direction or camera forward
        _forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
        _forward.y = 0
        _forward.normalize()
        _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
        _right.y = 0
        _right.normalize()
        let dx = 0, dz = 0
        if (keys.current['KeyW'] || keys.current['ArrowUp']) { dx += _forward.x; dz += _forward.z }
        if (keys.current['KeyS'] || keys.current['ArrowDown']) { dx -= _forward.x; dz -= _forward.z }
        if (keys.current['KeyA'] || keys.current['ArrowLeft']) { dx -= _right.x; dz -= _right.z }
        if (keys.current['KeyD'] || keys.current['ArrowRight']) { dx += _right.x; dz += _right.z }
        const len = Math.sqrt(dx * dx + dz * dz)
        if (len > 0.1) { dashDirX.current = dx / len; dashDirZ.current = dz / len }
        else { dashDirX.current = _forward.x; dashDirZ.current = _forward.z }
        playDash()
        if (onDashUsed) onDashUsed()
      }
    }
    const onKeyUp = (e) => { keys.current[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [camera, onDashUsed])

  useFrame((_, delta) => {
    if (paused) return
    const k = keys.current
    const dt = Math.min(delta, 0.1)
    _forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
    _forward.y = 0
    _forward.normalize()
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    _right.y = 0
    _right.normalize()

    // ---- Ground & surface state ----
    const floorH = getFloorHeightAt(camera.position.x, camera.position.z, grid)
    const footY = camera.position.y - PLAYER_EYE_HEIGHT
    const isGrounded = footY <= floorH + 0.05 && verticalVel.current <= 0
    const currentCell = getCellAt(camera.position.x, camera.position.z, grid)
    const onIce = currentCell === ICE
    const onWeb = currentCell === WEB
    const onBounce = currentCell === BOUNCE

    // Secret wall detection (with duplicate guard)
    if (checkSecretWall(camera.position.x, camera.position.z)) {
      const secretKey = `secret-${Math.floor((camera.position.x + (grid[0].length * CELL_SIZE) / 2) / CELL_SIZE)}-${Math.floor((camera.position.z + (grid.length * CELL_SIZE) / 2) / CELL_SIZE)}`
      if (!secretsRevealed.current.has(secretKey)) {
        secretsRevealed.current.add(secretKey)
        if (gameStats?.current) gameStats.current.secretsFound = (gameStats.current.secretsFound || 0) + 1
        addToast('Secret passage discovered!', 'secret')
        playSecret()
      }
    }

    // Teleporter detection
    teleportCooldown.current = Math.max(0, teleportCooldown.current - dt)
    if (checkTeleporter(camera.position.x, camera.position.z) && isGrounded && teleportCooldown.current <= 0) {
      // Find all teleporter cells and teleport to a different one
      const rows = grid.length
      const cols = grid[0].length
      const offsetX_ = (cols * CELL_SIZE) / 2
      const offsetZ_ = (rows * CELL_SIZE) / 2
      let targets = []
      for (let tz = 0; tz < rows; tz++) {
        for (let tx = 0; tx < cols; tx++) {
          if (grid[tz][tx] === TELEPORTER) {
            targets.push({
              x: tx * CELL_SIZE - offsetX_ + CELL_SIZE / 2,
              z: tz * CELL_SIZE - offsetZ_ + CELL_SIZE / 2,
              key: `teleporter-${tz}-${tx}`,
            })
          }
        }
      }
      if (targets.length > 1) {
        const currentIdx = targets.findIndex(t =>
          Math.abs(t.x - camera.position.x) < CELL_SIZE / 2 &&
          Math.abs(t.z - camera.position.z) < CELL_SIZE / 2
        )
        const nextIdx = (currentIdx + 1) % targets.length
        if (nextIdx !== currentIdx && nextIdx >= 0) {
          camera.position.x = targets[nextIdx].x
          camera.position.z = targets[nextIdx].z
          teleportCooldown.current = 1.0
          addToast('Teleported!', 'info')
          playSecret()
        }
      }
      if (onTeleport) onTeleport(camera.position.x, camera.position.z)
    }

    // Health pickup detection (one-time per cell)
    const cellKey = `health-${Math.floor((camera.position.x + (grid[0].length * CELL_SIZE) / 2) / CELL_SIZE)}-${Math.floor((camera.position.z + (grid.length * CELL_SIZE) / 2) / CELL_SIZE)}`
    if (currentCell === HEALTH_PICKUP && isGrounded && !lastCellHealthPickups.current.has(cellKey)) {
      lastCellHealthPickups.current.add(cellKey)
      if (onHealthPickup) onHealthPickup(HEALTH_PER_PICKUP)
    }

    // Landing impact
    if (isGrounded && !prevGrounded.current) {
      const fallSpeed = Math.abs(verticalVel.current)
      if (fallSpeed > 2) {
        landingDip.current = Math.min(0.12, fallSpeed * 0.015)
        playLanding(fallSpeed)
      }
      // Reset double jump on landing
      jumpsLeft.current = hasDoubleJump ? 2 : 1
    }
    prevGrounded.current = isGrounded

    if (isGrounded) {
      camera.position.y = floorH + (isSliding.current ? PLAYER_EYE_HEIGHT * 0.55 : PLAYER_EYE_HEIGHT)
      verticalVel.current = 0
    }

    lastCell.current = currentCell

    // ---- Dash update ----
    dashCooldown.current = Math.max(0, dashCooldown.current - dt)
    if (dashing.current) {
      const dashSpeed = PLAYER_SPEED * DASH_SPEED_MULT
      camera.position.x += dashDirX.current * dashSpeed * dt
      camera.position.z += dashDirZ.current * dashSpeed * dt
      // Break pots on dash
      dashing.current = false // will be re-set if F key held, but dash is one-shot
      // Re-check collision to resolve
      if (checkCollision(camera.position.x, camera.position.z)) {
        camera.position.x -= dashDirX.current * dashSpeed * dt * 1.5
        camera.position.z -= dashDirZ.current * dashSpeed * dt * 1.5
      }
    }

    // ---- Input direction ----
    let mx = 0, mz = 0
    if (k['KeyW'] || k['ArrowUp']) { mx += _forward.x; mz += _forward.z }
    if (k['KeyS'] || k['ArrowDown']) { mx -= _forward.x; mz -= _forward.z }
    if (k['KeyA'] || k['ArrowLeft']) { mx -= _right.x; mz -= _right.z }
    if (k['KeyD'] || k['ArrowRight']) { mx += _right.x; mz += _right.z }

    let mobileEdge = false
    if (mobileMove) {
      const mobileMag = Math.sqrt(mobileMove[0] * mobileMove[0] + mobileMove[1] * mobileMove[1])
      if (mobileMag > 0.85) mobileSprintingRef.current = true
      else if (mobileMag < 0.7) mobileSprintingRef.current = false
      mobileEdge = mobileSprintingRef.current
      mx += mobileMove[1] * _forward.x + mobileMove[0] * _right.x
      mz += mobileMove[1] * _forward.z + mobileMove[0] * _right.z
    }

    const inputLen = Math.sqrt(mx * mx + mz * mz)
    if (inputLen > 1) { mx /= inputLen; mz /= inputLen }
    const isMoving = inputLen > 0.05

    const sprinting = (k['ShiftLeft'] || k['ShiftRight']) || mobileEdge
    const sprintMult = sprinting ? 1.6 : 1.0

    // ---- Speed modifiers ----
    let speedMult = sprintMult
    if (onWeb) speedMult *= WEB_SLOW_MULT
    const targetSpeed = PLAYER_SPEED * speedMult

    // ---- Acceleration (ice reduces friction) ----
    const accelRate = onIce ? 3 : 12
    const decelRate = onIce ? 2 : 16

    if (isMoving) {
      const targetVX = mx * targetSpeed
      const targetVZ = mz * targetSpeed
      const rate = accelRate * dt
      velocityX.current += (targetVX - velocityX.current) * Math.min(rate, 1)
      velocityZ.current += (targetVZ - velocityZ.current) * Math.min(rate, 1)
    } else {
      const rate = decelRate * dt
      velocityX.current += (0 - velocityX.current) * Math.min(rate, 1)
      velocityZ.current += (0 - velocityZ.current) * Math.min(rate, 1)
      if (Math.abs(velocityX.current) < 0.05) velocityX.current = 0
      if (Math.abs(velocityZ.current) < 0.05) velocityZ.current = 0
    }

    let airMult = 1.0
    if (!isGrounded) airMult = 0.4

    const vx = velocityX.current * dt * airMult
    const vz = velocityZ.current * dt * airMult

    // ---- Slide ----
    const ctrlDown = k['ControlLeft'] || k['ControlRight']
    slideCooldown.current = Math.max(0, slideCooldown.current - dt)
    slideTimer.current = Math.max(0, slideTimer.current - dt)

    if (ctrlDown && sprinting && isGrounded && isMoving && slideCooldown.current <= 0 && !isSliding.current) {
      isSliding.current = true
      slideTimer.current = 0.5
      slideCooldown.current = 1.0
      playSlide()
    }
    if (isSliding.current && slideTimer.current <= 0) {
      isSliding.current = false
    }

    const slideMult = isSliding.current ? 1.3 : 1.0

    // ---- Collision with wall-running ----
    const nx = camera.position.x + vx * slideMult
    const nz = camera.position.z + vz * slideMult

    let bumped = false
    let wallRunActive = false
    const wallRunSpeed = PLAYER_SPEED * speedMult * 1.2

    if (!checkCollision(nx, camera.position.z)) {
      camera.position.x = nx
    } else {
      bumped = true
      if (sprinting && isGrounded && isMoving) {
        const vzOnly = camera.position.z + vz * slideMult
        if (!checkCollision(camera.position.x, vzOnly)) {
          camera.position.z = vzOnly
          const zSign = Math.abs(velocityZ.current) > 0.1 ? Math.sign(velocityZ.current) : (Math.abs(mz) > 0.01 ? Math.sign(mz) : 1)
          velocityZ.current = zSign * Math.min(Math.abs(velocityZ.current) * 1.05 + 0.8, wallRunSpeed)
          velocityX.current *= 0.3
          wallRunActive = true
        } else {
          velocityX.current = 0
        }
      } else {
        velocityX.current = 0
      }
    }

    if (!checkCollision(camera.position.x, nz)) {
      camera.position.z = nz
    } else {
      bumped = true
      if (sprinting && isGrounded && isMoving) {
        const vxOnly = camera.position.x + vx * slideMult
        if (!checkCollision(vxOnly, camera.position.z)) {
          camera.position.x = vxOnly
          const xSign = Math.abs(velocityX.current) > 0.1 ? Math.sign(velocityX.current) : (Math.abs(mx) > 0.01 ? Math.sign(mx) : 1)
          velocityX.current = xSign * Math.min(Math.abs(velocityX.current) * 1.05 + 0.8, wallRunSpeed)
          velocityZ.current *= 0.3
          wallRunActive = true
        } else {
          velocityZ.current = 0
        }
      } else {
        velocityZ.current = 0
      }
    }

    const targetWallTilt = wallRunActive ? 0.06 : 0
    wallRunTilt.current += (targetWallTilt - wallRunTilt.current) * Math.min(12 * dt, 1)

    if (bumped && isMoving && !wallRunActive) {
      wallBumpTimer.current -= delta
      if (wallBumpTimer.current <= 0) {
        wallBumpTimer.current = WALL_BUMP_COOLDOWN
        playWallBump()
      }
    } else if (!bumped) {
      wallBumpTimer.current = 0
    }

    // ---- Jump with double jump support ----
    const spaceJump = k['Space']
    let mobileJumpEdge = false
    if (mobileJump !== undefined) {
      if (mobileJump && !prevMobileJump.current) mobileJumpEdge = true
      prevMobileJump.current = mobileJump
    }

    const jumpKeyDown = spaceJump || mobileJumpEdge

    if (jumpKeyDown && !jumpHeld.current) {
      if (isGrounded) {
        verticalVel.current = JUMP_VELOCITY
        jumpHeld.current = true
        jumpsLeft.current = hasDoubleJump ? 2 : 1
        playJump()
      } else if (jumpsLeft.current > 1) {
        // Double jump
        verticalVel.current = JUMP_VELOCITY * 0.85
        jumpHeld.current = true
        jumpsLeft.current--
        playJump()
      }
    }

    if (!jumpKeyDown && jumpHeld.current && verticalVel.current > JUMP_VELOCITY * 0.3) {
      verticalVel.current *= 0.45
    }

    if (!jumpKeyDown) {
      jumpHeld.current = false
    }

    // ---- Bouncy pad ----
    if (onBounce && isGrounded) {
      verticalVel.current = BOUNCE_VELOCITY
      screenShakeAmount = Math.max(screenShakeAmount, 0.08)
      playJump()
    }

    // Apply gravity
    verticalVel.current -= GRAVITY * dt
    camera.position.y += verticalVel.current * dt

    const newFootY = camera.position.y - PLAYER_EYE_HEIGHT
    if (newFootY < floorH && verticalVel.current < 0) {
      camera.position.y = floorH + PLAYER_EYE_HEIGHT
      verticalVel.current = 0
    }

    if (camera.position.y > WALL_HEIGHT - 0.2) {
      camera.position.y = WALL_HEIGHT - 0.2
      if (verticalVel.current > 0) verticalVel.current = 0
    }

    if (landingDip.current > 0.001) {
      camera.position.y -= landingDip.current
      landingDip.current *= Math.exp(-20 * dt)
    }

    gameState.playerPos = [camera.position.x, camera.position.y, camera.position.z]
    gameState.isMoving = isMoving
    gameState.playerOnFloor = floorH

    // Mobile look
    if (mobileLookRef && (mobileLookRef.current[0] !== 0 || mobileLookRef.current[1] !== 0)) {
      _euler.setFromQuaternion(camera.quaternion)
      _euler.y -= mobileLookRef.current[0] * 0.003
      _euler.x -= mobileLookRef.current[1] * 0.003
      _euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, _euler.x))
      camera.quaternion.setFromEuler(_euler)
      mobileLookRef.current = [0, 0]
    }

    // Camera tilt
    const lateralComponent = velocityX.current * _right.x + velocityZ.current * _right.z
    const tiltRatio = Math.max(-1, Math.min(1, lateralComponent / Math.max(targetSpeed, 0.1)))
    const targetTilt = tiltRatio * 0.04 + wallRunTilt.current * (tiltRatio > 0 ? 1 : -1)
    strafeTilt.current += (targetTilt - strafeTilt.current) * Math.min(9 * dt, 1)
    camera.rotation.z = strafeTilt.current

    // Footstep sounds
    const actualSpeed = Math.sqrt(velocityX.current ** 2 + velocityZ.current ** 2)
    if (actualSpeed > 0.5 && isGrounded) {
      const stepInterval = (sprinting || isSliding.current) ? FOOTSTEP_INTERVAL * 0.6 : FOOTSTEP_INTERVAL
      footstepTimer.current -= delta
      if (footstepTimer.current <= 0) {
        footstepTimer.current = stepInterval
        playFootstep()
      }
    } else {
      footstepTimer.current = 0
    }

    // Camera bob
    if (actualSpeed > 0.5 && isGrounded) {
      bobPhase.current += delta * ((sprinting || isSliding.current) ? 16 : 10)
      const bobAmount = (sprinting || isSliding.current) ? 0.04 * Math.sin(bobPhase.current) : 0.025 * Math.sin(bobPhase.current)
      camera.position.y += bobAmount
    }

    // Slide FOV
    const targetFov = isSliding.current ? 100 : 90
    if (Math.abs(targetFov - camera.fov) > 0.01) {
      camera.fov += (targetFov - camera.fov) * Math.min(8 * dt, 1)
      camera.updateProjectionMatrix()
    }
  })

  return <ScreenShake camera={camera} />
}

function GameLogic({
  grid,
  crystalsNeeded,
  gameState,
  health,
  onCrystalCollected,
  onHealthChange,
  onLevelComplete,
  onDeath,
  onMinimapUpdate,
  onKeyCollected,
  onDoorOpened,
  doorsOpenedRef,
  paused,
  onComboUpdate,
  onSecretFound,
  onDoubleJumpCollected,
  hasDoubleJump,
  chestsCollected,
  onChestCollect,
  brokenPots,
  onPotBreak,
  onGoldCollected,
  collectedSet,
  keysTakenSet,
  doorsOpenedSet,
  healthPickupsCollected,
  onHealthPickup,
  powerupsCollected,
}) {
  const crystalData = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === CRYSTAL) {
          const yOff = getFloorHeightForCell(x, z, grid)
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 1.2 + yOff, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `crystal-${z}-${x}`,
            gx: x, gz: z,
          })
        }
      }
    }
    return items
  }, [grid])

  const keyData = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === KEY) {
          const yOff = getFloorHeightForCell(x, z, grid)
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 1.0 + yOff, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `key-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  const doorData = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === DOOR) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `door-${z}-${x}`,
            gx: x, gz: z,
          })
        }
      }
    }
    return items
  }, [grid])

  const chestData = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === CHEST) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0.2, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `chest-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  const potData = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === POT) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0.15, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `pot-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  const healthPickupData = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === HEALTH_PICKUP) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0.3, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `health-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  const powerupData = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === POWERUP_DOUBLE_JUMP) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 0.6, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `powerup-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  const exitPos = useMemo(() => {
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === EXIT) {
          return [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 1, z * CELL_SIZE - offsetZ + CELL_SIZE / 2]
        }
      }
    }
    return [0, 1, 0]
  }, [grid])

  const exitTriggered = useRef(false)
  const deadRef = useRef(false)
  const [collectedCount, setCollectedCount] = useState(0)
  const [keysTakenCount, setKeysTakenCount] = useState(0)
  const [doorsOpenedCount, setDoorsOpenedCount] = useState(0)
  const healthRef = useRef(health)
  healthRef.current = health

  // Combo tracking
  const comboTimer = useRef(0)
  const comboCount = useRef(0)

  const doorSlideStates = useRef({})
  const { clock } = useThree()

  const activeCrystals = useMemo(() => {
    return crystalData.filter((_, i) => !collectedSet.current.has(i))
  }, [crystalData, collectedCount])

  const activeKeys = useMemo(() => {
    return keyData.filter((_, i) => !keysTakenSet.current.has(i))
  }, [keyData, keysTakenCount])

  const activeHealthPickups = useMemo(() => {
    return healthPickupData.filter((_, i) => !healthPickupsCollected.current.has(i))
  }, [healthPickupData, healthPickupsCollected])

  const activePowerups = useMemo(() => {
    return powerupData.filter((_, i) => !powerupsCollected.current.has(i))
  }, [powerupData, powerupsCollected])

  const activeDoors = useMemo(() => {
    return doorData.filter((_, i) => {
      if (doorsOpenedSet.current.has(i)) {
        const state = doorSlideStates.current[`door-${doorData[i].gz}-${doorData[i].gx}`]
        if (state && !state.done) return true
        return false
      }
      return true
    })
  }, [doorData, doorsOpenedCount])

  const allDoorsOpen = doorsOpenedSet.current.size >= doorData.length
  const activatedRef = useRef(false)
  activatedRef.current = collectedCount >= crystalsNeeded && allDoorsOpen
  const activated = activatedRef.current

  const minimapTimer = useRef(0)
  const spikeHurtTimer = useRef(0)
  const heartBeatTimer = useRef(0)
  const heartBeatWarningShown = useRef(false)

  useFrame((_, delta) => {
    minimapTimer.current += delta
    if (minimapTimer.current > 0.25 && onMinimapUpdate) {
      minimapTimer.current = 0
      onMinimapUpdate({
        playerPos: gameState.playerPos,
        crystals: activeCrystals,
        exitPos,
      })
    }
  })

  useFrame((_, delta) => {
    if (paused) return
    const pp = gameState.playerPos
    if (!pp) return

    // Health drain
    if (!deadRef.current) {
      const rows = grid.length
      const cols = grid[0].length
      const offsetX = (cols * CELL_SIZE) / 2
      const offsetZ = (rows * CELL_SIZE) / 2
      const gx = Math.floor((pp[0] + offsetX) / CELL_SIZE)
      const gz = Math.floor((pp[2] + offsetZ) / CELL_SIZE)
      const onSpikes = gz >= 0 && gz < rows && gx >= 0 && gx < cols && grid[gz][gx] === SPIKE
      if (onSpikes) {
        spikeHurtTimer.current -= delta
        if (spikeHurtTimer.current <= 0) {
          spikeHurtTimer.current = SPIKE_HURT_COOLDOWN
          playSpikeHurt()
          screenShakeAmount = Math.max(screenShakeAmount, 0.15)
        }
      } else {
        spikeHurtTimer.current = 0
      }
      const drainRate = HEALTH_DRAIN_RATE + (onSpikes ? SPIKES_DAMAGE_RATE : 0)
      const newHealth = Math.max(0, healthRef.current - drainRate * delta)
      if (newHealth !== healthRef.current) {
        // Low health heartbeat sound
        const healthPct = (newHealth / 100)
        if (healthPct < 0.3) {
          heartBeatTimer.current -= delta
          if (heartBeatTimer.current <= 0) {
            heartBeatTimer.current = 0.5 + healthPct * 0.5
            if (healthPct < 0.3 && healthPct > 0.15) {
          if (!heartBeatWarningShown.current) {
            heartBeatWarningShown.current = true
            addToast('Low health! Find healing...', 'warning', 3000)
          }
        }
        playHeartbeat()
          }
        }
        if (onHealthChange) onHealthChange(newHealth)
        if (newHealth <= 0) {
          deadRef.current = true
          playDeath()
          if (onDeath) onDeath()
          return
        }
      }
    }

    // Crystal collection with combo
    crystalData.forEach((c, i) => {
      if (collectedSet.current.has(i)) return
      const dx = pp[0] - c.pos[0]
      const dy = pp[1] - c.pos[1]
      const dz = pp[2] - c.pos[2]
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < COLLECT_DISTANCE) {
        collectedSet.current.add(i)
        const newCount = collectedSet.current.size
        setCollectedCount(newCount)
        if (onCrystalCollected) onCrystalCollected(newCount)

        // Combo
        comboTimer.current = COMBO_WINDOW
        comboCount.current++
        if (onComboUpdate) onComboUpdate(comboCount.current)

        // Extra health for combos
        const comboBonus = Math.min(comboCount.current - 1, 5) * 2
        const healed = Math.min(100, healthRef.current + HEALTH_PER_CRYSTAL + comboBonus)
        if (onHealthChange) onHealthChange(healed)
        playCrystalCollect()

        if (comboCount.current === 5) {
          addToast('Combo x5 — Crystal Rush!', 'achievement')
          if (onSecretFound) onSecretFound('combo5')
        }
        if (comboCount.current === 10) {
          addToast('Combo x10 — Crystal Fury!', 'achievement')
          if (onSecretFound) onSecretFound('combo10')
        }
      }
    })

    // Combo timer
    if (comboTimer.current > 0) {
      comboTimer.current -= delta
      if (comboTimer.current <= 0) {
        comboCount.current = 0
        if (onComboUpdate) onComboUpdate(0)
      }
    }

    // Key collection
    keyData.forEach((k, i) => {
      if (keysTakenSet.current.has(i)) return
      const dx = pp[0] - k.pos[0]
      const dy = pp[1] - k.pos[1]
      const dz = pp[2] - k.pos[2]
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < COLLECT_DISTANCE) {
        keysTakenSet.current.add(i)
        const newCount = keysTakenSet.current.size
        setKeysTakenCount(newCount)
        if (onKeyCollected) onKeyCollected(newCount)
        if (newCount === 1) addToast('Key acquired! Find the locked door.', 'info')
        playKeyCollect()
      }
    })

    // Door opening
    let spareKeys = keysTakenSet.current.size - doorsOpenedSet.current.size
    doorData.forEach((d, i) => {
      if (doorsOpenedSet.current.has(i)) return
      if (spareKeys <= 0) return
      const dx = pp[0] - d.pos[0]
      const dy = pp[1] - (d.pos[1] + WALL_HEIGHT / 2)
      const dz = pp[2] - d.pos[2]
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < COLLECT_DISTANCE) {
        doorsOpenedSet.current.add(i)
        spareKeys--
        if (doorsOpenedRef) doorsOpenedRef.current.add(`${d.gz}-${d.gx}`)
        doorSlideStates.current[d.key] = { startTime: clock.getElapsedTime(), done: false }
        const newDoorsCount = doorsOpenedSet.current.size
        setDoorsOpenedCount(newDoorsCount)
        if (onDoorOpened) onDoorOpened(newDoorsCount)
        playDoorOpen()
      }
    })

    // Health pickup collection
    healthPickupData.forEach((h, i) => {
      if (healthPickupsCollected.current.has(i)) return
      const dx = pp[0] - h.pos[0]
      const dy = pp[1] - h.pos[1]
      const dz = pp[2] - h.pos[2]
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < COLLECT_DISTANCE) {
        healthPickupsCollected.current.add(i)
        const healed = Math.min(100, healthRef.current + HEALTH_PER_PICKUP)
        if (onHealthChange) onHealthChange(healed)
        if (onHealthPickup) onHealthPickup()
        playPickup()
      }
    })

    // Powerup collection (double jump)
    powerupData.forEach((p, i) => {
      if (powerupsCollected.current.has(i)) return
      const dx = pp[0] - p.pos[0]
      const dy = pp[1] - p.pos[1]
      const dz = pp[2] - p.pos[2]
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < COLLECT_DISTANCE) {
        powerupsCollected.current.add(i)
        if (onDoubleJumpCollected) onDoubleJumpCollected()
        addToast('Double Jump unlocked! Press Space in mid-air.', 'achievement')
        playAchievement()
      }
    })

    // Chest collection
    chestData.forEach((c, i) => {
      if (chestsCollected.current.has(i)) return
      const dx = pp[0] - c.pos[0]
      const dy = pp[1] - c.pos[1]
      const dz = pp[2] - c.pos[2]
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 1.5) {
        chestsCollected.current.add(i)
        if (onChestCollect) onChestCollect()
        addToast('Treasure found! Health restored.', 'achievement')
        // Chest gives a crystal's worth of health
        const healed = Math.min(100, healthRef.current + HEALTH_PER_CRYSTAL)
        if (onHealthChange) onHealthChange(healed)
      }
    })

    // Pot breaking (player proximity or dash)
    potData.forEach((p, i) => {
      if (brokenPots.current.has(i)) return
      const dx = pp[0] - p.pos[0]
      const dy = pp[1] - p.pos[1]
      const dz = pp[2] - p.pos[2]
      if (Math.sqrt(dx * dx + dy * dy + dz * dz) < 0.8) {
        brokenPots.current.add(i)
        if (onPotBreak) onPotBreak()
        playPotBreak()
        screenShakeAmount = Math.max(screenShakeAmount, 0.05)
      }
    })

    // Exit portal check
    if (activatedRef.current && !exitTriggered.current) {
      const ex = pp[0] - exitPos[0]
      const ey = pp[1] - exitPos[1]
      const ez = pp[2] - exitPos[2]
      if (Math.sqrt(ex * ex + ey * ey + ez * ez) < 2.5) {
        exitTriggered.current = true
        playPortalActivate()
        addToast('Portal activated — Escape!', 'achievement', 4000)
        if (onLevelComplete) onLevelComplete()
      }
    }
  })

  return (
    <>
      <CrystalsDisplay crystals={activeCrystals} />
      <KeysDisplay keys={activeKeys} />
      <LockedDoorsDisplay doors={activeDoors} doorSlideStates={doorSlideStates} />
      <ExitPortalDisplay position={exitPos} activated={activated} />
      <HealthPickupsDisplay healthPickups={activeHealthPickups} />
      <PowerupDisplay powerups={activePowerups} />
      <ChestsDisplay chests={chestData} onOpenChest={() => {}} />
      <PotsDisplay pots={potData} brokenPots={brokenPots} />
    </>
  )
}

function getFloorHeightForCell(gx, gz, grid) {
  const cell = grid[gz][gx]
  if (cell === PLATFORM) return WALL_HEIGHT
  return 0
}

function SceneContent({
  level,
  health,
  mobileMove,
  mobileLookRef,
  onCrystalCollected,
  onHealthChange,
  onLevelComplete,
  onDeath,
  onMinimapUpdate,
  onKeyCollected,
  onDoorOpened,
  paused,
  mobileJump,
  onComboUpdate,
  onSecretFound,
  onDoubleJumpCollected,
  hasDoubleJump,
  collectedSet,
  keysTakenSet,
  doorsOpenedSet,
  secretsRevealed,
  chestsCollected,
  brokenPots,
  onChestCollect,
  onPotBreak,
  onHealthPickup,
  healthPickupsCollected,
  powerupsCollected,
  onDashUsed,
  onTeleport,
  gameStats,
  onElapsedTime,
}) {
  const gameState = useRef({ playerPos: null, isMoving: false, playerOnFloor: 0 })
  const doorsOpenedRef = useRef(new Set())
  const teleporterUsedRef = useRef(new Set())
  const levelStartTime = useRef(Date.now())
  const elapsedTimeRef = useRef(0)

  // Track elapsed time
  const onTimerUpdate = onElapsedTime
  useFrame((_, delta) => {
    if (paused || !gameState.current?.playerPos) return
    elapsedTimeRef.current += delta
    if (onTimerUpdate && Math.floor(elapsedTimeRef.current / 0.5) !== Math.floor((elapsedTimeRef.current - delta) / 0.5)) {
      onTimerUpdate(elapsedTimeRef.current)
    }
  })

  return (
    <>
      <ambientLight intensity={0.25} color="#2a1a08" />
      <LanternLight healthPct={health} />
      <MazeWalls grid={level.grid} />
      <SecretWalls grid={level.grid} secretsRevealed={secretsRevealed} />
      <Floor grid={level.grid} />
      <PlatformFloors grid={level.grid} />
      <PlatformWalls grid={level.grid} />
      <StairsDisplay grid={level.grid} />
      <Ceiling grid={level.grid} />
      <SpikesDisplay grid={level.grid} />
      <WallTorches grid={level.grid} />
      <MushroomsDisplay grid={level.grid} />
      <BouncyPadsDisplay grid={level.grid} />
      <TeleporterDisplay grid={level.grid} teleportEffects={teleporterUsedRef} />
      <DustParticles grid={level.grid} />
      <WaterDrips grid={level.grid} />
      <FootstepParticles gameState={gameState} />
      <PlayerShadow gameState={gameState} />
      <Player
        grid={level.grid}
        gameState={gameState}
        mobileMove={mobileMove}
        mobileLookRef={mobileLookRef}
        doorsOpenedRef={doorsOpenedRef}
        paused={paused}
        mobileJump={mobileJump}
        secretsRevealed={secretsRevealed}
        hasDoubleJump={hasDoubleJump}
        onDoubleJumpCollected={onDoubleJumpCollected}
        onDashUsed={onDashUsed}
        onHealthPickup={onHealthPickup}
        onChestOpen={() => {}}
        onTeleport={onTeleport}
        gameStats={gameStats}
      />
      <GameLogic
        grid={level.grid}
        crystalsNeeded={level.crystalsNeeded}
        gameState={gameState}
        health={health}
        onCrystalCollected={onCrystalCollected}
        onHealthChange={onHealthChange}
        onLevelComplete={onLevelComplete}
        onDeath={onDeath}
        onMinimapUpdate={onMinimapUpdate}
        onKeyCollected={onKeyCollected}
        onDoorOpened={onDoorOpened}
        doorsOpenedRef={doorsOpenedRef}
        paused={paused}
        onComboUpdate={onComboUpdate}
        onSecretFound={onSecretFound}
        onDoubleJumpCollected={onDoubleJumpCollected}
        hasDoubleJump={hasDoubleJump}
        collectedSet={collectedSet}
        keysTakenSet={keysTakenSet}
        doorsOpenedSet={doorsOpenedSet}
        chestsCollected={chestsCollected}
        onChestCollect={onChestCollect}
        brokenPots={brokenPots}
        onPotBreak={onPotBreak}
        onHealthPickup={onHealthPickup}
        healthPickupsCollected={healthPickupsCollected}
        powerupsCollected={powerupsCollected}
      />
      <fog attach="fog" args={['#0a0a05', 18, 50]} />
    </>
  )
}

export default function Game3D({
  level,
  health,
  mobileMove,
  mobileLookRef,
  onCrystalCollected,
  onHealthChange,
  onLevelComplete,
  onDeath,
  onMinimapUpdate,
  onKeyCollected,
  onDoorOpened,
  paused,
  onPointerLock,
  onPointerUnlock,
  mobileJump,
  onComboUpdate,
  onSecretFound,
  onDoubleJumpCollected,
  hasDoubleJump,
  collectedSet,
  keysTakenSet,
  doorsOpenedSet,
  secretsRevealed,
  chestsCollected,
  brokenPots,
  onChestCollect,
  onPotBreak,
  onHealthPickup,
  healthPickupsCollected,
  powerupsCollected,
  onDashUsed,
  onTeleport,
  gameStats,
  onElapsedTime,
}) {
  const [ready, setReady] = useState(false)
  const [showClickHint, setShowClickHint] = useState(false)
  const [showMobileHint, setShowMobileHint] = useState(false)
  const prevPausedRef = useRef(paused)
  const mobileHintTimer = useRef(null)
  const canvasContainerRef = useRef(null)

  const isMobile = useMemo(() => {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)
  }, [])

  const handleLock = useCallback(() => {
    setReady(true)
    setShowClickHint(false)
    if (onPointerLock) onPointerLock()
  }, [onPointerLock])

  const handleUnlock = useCallback(() => {
    if (onPointerUnlock) onPointerUnlock()
  }, [onPointerUnlock])

  const handleExplicitLock = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector('canvas')
    if (canvas) canvas.requestPointerLock()
  }, [])

  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container || ready || isMobile) return
    const onClick = () => {
      const canvas = container.querySelector('canvas')
      if (canvas && document.pointerLockElement !== canvas) canvas.requestPointerLock()
    }
    container.addEventListener('click', onClick)
    return () => container.removeEventListener('click', onClick)
  }, [ready, isMobile])

  useEffect(() => {
    if (prevPausedRef.current === true && paused === false && ready) {
      if (isMobile) {
        setShowMobileHint(true)
        if (mobileHintTimer.current) clearTimeout(mobileHintTimer.current)
        mobileHintTimer.current = setTimeout(() => setShowMobileHint(false), 1000)
      } else {
        setShowClickHint(true)
      }
    }
    prevPausedRef.current = paused
  }, [paused, ready, isMobile])

  useEffect(() => {
    return () => { if (mobileHintTimer.current) clearTimeout(mobileHintTimer.current) }
  }, [])

  const handleMobileStart = useCallback(() => {
    setReady(true)
    if (onPointerLock) onPointerLock()
  }, [onPointerLock])

  return (
    <div className="relative w-full h-full" ref={canvasContainerRef}>
      <Canvas
        shadows
        gl={{ antialias: true }}
        camera={{ fov: 90, near: 0.1, far: 60 }}
        style={{ background: '#0a0a05' }}
      >
        <SceneContent
          level={level}
          health={health}
          mobileMove={mobileMove}
          mobileLookRef={mobileLookRef}
          onCrystalCollected={onCrystalCollected}
          onHealthChange={onHealthChange}
          onLevelComplete={onLevelComplete}
          onDeath={onDeath}
          onMinimapUpdate={onMinimapUpdate}
          onKeyCollected={onKeyCollected}
          onDoorOpened={onDoorOpened}
          paused={paused || !ready}
          mobileJump={mobileJump}
          onComboUpdate={onComboUpdate}
          onSecretFound={onSecretFound}
          onDoubleJumpCollected={onDoubleJumpCollected}
          hasDoubleJump={hasDoubleJump}
          collectedSet={collectedSet}
          keysTakenSet={keysTakenSet}
          doorsOpenedSet={doorsOpenedSet}
          secretsRevealed={secretsRevealed}
          chestsCollected={chestsCollected}
          brokenPots={brokenPots}
          onChestCollect={onChestCollect}
          onPotBreak={onPotBreak}
          onHealthPickup={onHealthPickup}
          healthPickupsCollected={healthPickupsCollected}
          powerupsCollected={powerupsCollected}
          onDashUsed={onDashUsed}
          onTeleport={onTeleport}
          gameStats={gameStats}
          onElapsedTime={onElapsedTime}
        />
        {!isMobile && <PointerLockControls onLock={handleLock} onUnlock={handleUnlock} />}
      </Canvas>

      {/* Click to begin */}
      {!ready && !isMobile && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="text-center max-w-md px-6">
            <div className="text-amber-400 text-3xl md:text-4xl font-bold mb-2 tracking-tight">Lanternlight</div>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-5" />
            <button
              onClick={handleExplicitLock}
              className="px-10 py-4 bg-amber-500/15 border-2 border-amber-500/50 rounded-xl text-amber-300 text-xl font-bold tracking-wide transition-all duration-300 hover:border-amber-400/70 hover:bg-amber-500/25 hover:text-amber-200 active:scale-95 cursor-pointer mb-6"
            >Click to Begin</button>
            <div className="text-amber-500/30 text-xs space-y-1">
              <p><span className="text-amber-500/50 font-semibold">W A S D</span> or <span className="text-amber-500/50 font-semibold">Arrow Keys</span> to move</p>
              <p><span className="text-amber-500/50 font-semibold">Space</span> to jump — hold for higher (double-jump with powerup)</p>
              <p><span className="text-amber-500/50 font-semibold">Shift</span> to sprint (slide along walls)</p>
              <p><span className="text-amber-500/50 font-semibold">Ctrl</span> to slide (while sprinting)</p>
              <p><span className="text-amber-500/50 font-semibold">F</span> to dash (cooldown: 0.8s)</p>
              <p><span className="text-amber-500/50 font-semibold">Mouse</span> to look around</p>
              <p><span className="text-amber-500/50 font-semibold">Escape</span> to pause</p>
              <p className="mt-2 text-amber-500/20">Collect crystals, find keys, open doors, break pots, find secrets!</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile start */}
      {!ready && isMobile && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="text-center max-w-md px-6">
            <div className="text-amber-400 text-3xl font-bold mb-2 tracking-tight">Lanternlight</div>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-5" />
            <button
              onClick={handleMobileStart}
              className="px-10 py-4 bg-amber-500/15 border-2 border-amber-500/50 rounded-xl text-amber-300 text-xl font-bold tracking-wide transition-all duration-300 hover:border-amber-400/70 hover:bg-amber-500/25 active:scale-95 cursor-pointer mb-6"
            >Tap to Start</button>
            <div className="text-amber-500/30 text-xs space-y-1">
              <p><span className="text-amber-500/50 font-semibold">Left Joystick</span> to move — push to edge to sprint</p>
              <p><span className="text-amber-500/50 font-semibold">Center Button</span> to jump — hold for higher</p>
              <p><span className="text-amber-500/50 font-semibold">Right Area</span> to look around</p>
              <p className="mt-2 text-amber-500/20">Collect crystals, find keys, open doors, reach the portal</p>
            </div>
          </div>
        </div>
      )}

      {/* Resume hint */}
      {!isMobile && (
        <div className={`absolute inset-0 z-15 flex items-center justify-center pointer-events-none transition-opacity duration-150 ${showClickHint && !paused ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg border border-amber-700/20">
            <span className="text-amber-400/70 text-sm">Click to continue</span>
          </div>
        </div>
      )}
      {isMobile && (
        <div className={`absolute inset-0 z-15 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showMobileHint && !paused ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg border border-amber-700/20">
            <span className="text-amber-400/70 text-sm">Tap to resume</span>
          </div>
        </div>
      )}
    </div>
  )
}

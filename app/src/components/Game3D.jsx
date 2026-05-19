import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls, useTexture } from '@react-three/drei'
import { Vector3, Euler, DoubleSide, RepeatWrapping, BufferGeometry, BufferAttribute, AdditiveBlending, CanvasTexture } from 'three'
import { playFootstep, playCrystalCollect, playPortalActivate, playDeath, playKeyCollect, playDoorOpen, playSpikeHurt, playWallBump } from '../game/sound'

const CELL_SIZE = 4
const WALL_HEIGHT = 3
const PLAYER_SPEED = 8
const PLAYER_RADIUS = 0.35
const COLLECT_DISTANCE = 1.8
const HEALTH_DRAIN_RATE = 1.0
const HEALTH_PER_CRYSTAL = 30
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
          // Deterministic color variation per wall for visual interest
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

// ---- Module-level reusable objects (avoid per-frame GC) ----
const _forward = new Vector3()
const _right = new Vector3()
const _euler = new Euler(0, 0, 0, 'YXZ')

// ---- Wall torches (sconces with flickering flame) ----
function WallTorches({ grid }) {
  const torches = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    const half = CELL_SIZE / 2
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]] // N, S, W, E
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] !== WALL) continue
        dirs.forEach(([dx, dz], di) => {
          const nx = x + dx
          const nz = z + dz
          if (nz < 0 || nz >= rows || nx < 0 || nx >= cols) return
          if (grid[nz][nx] !== 0 && grid[nz][nx] !== SPAWN) return
          // Only place torch on ~40% of eligible faces (deterministic)
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
  // Mount torch slightly inset from wall face
  const mountX = pos[0] - dir[0] * 1.2
  const mountZ = pos[2] - dir[1] * 1.2

  useFrame((_, delta) => {
    const t = Date.now() * 0.005
    // Deterministic pseudo-random flicker (no Math.random() — avoids per-frame mutex)
    const noise = (Math.sin(t * 47.1 + pos[0] * 23.7 + pos[2] * 31.3) * 0.5 + 0.5) * 0.05
    const flicker = 0.7 + Math.sin(t * 13.7 + pos[0] * 7.3) * 0.15 + Math.sin(t * 19.3 + pos[2] * 11.1) * 0.1 + noise
    if (lightRef.current) {
      lightRef.current.intensity = flicker * 2.5
    }
    if (flameRef.current) {
      const s = 0.85 + flicker * 0.3
      flameRef.current.scale.setScalar(s)
    }
  })

  return (
    <group position={[mountX, pos[1], mountZ]}>
      {/* Sconce - wall bracket */}
      <mesh position={[dir[0] * 0.3, -0.15, dir[1] * 0.3]} rotation={[0, Math.atan2(dir[0], dir[1]), 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 6]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.6} metalness={0.8} />
      </mesh>
      {/* Sconce cup */}
      <mesh position={[dir[0] * 0.7, 0.0, dir[1] * 0.7]}>
        <cylinderGeometry args={[0.1, 0.07, 0.12, 8]} />
        <meshStandardMaterial color="#2a1a0a" roughness={0.5} metalness={0.9} />
      </mesh>
      {/* Flame */}
      <mesh ref={flameRef} position={[dir[0] * 0.7, 0.1, dir[1] * 0.7]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      {/* Inner flame */}
      <mesh position={[dir[0] * 0.7, 0.06, dir[1] * 0.7]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Flickering light */}
      <pointLight
        ref={lightRef}
        position={[dir[0] * 0.7, 0.1, dir[1] * 0.7]}
        color="#f59e0b"
        intensity={2}
        distance={8}
        decay={1.2}
      />
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

// Shared sprite canvas (created once)
let dustSpriteCanvas = null
function getDustSprite() {
  if (!dustSpriteCanvas) dustSpriteCanvas = createDustSprite()
  return dustSpriteCanvas
}

// ---- Atmospheric dust particles ----
function DustParticles({ grid }) {
  const rows = grid.length
  const cols = grid[0].length

  const [positions, sizes] = useMemo(() => {
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
      // Only spawn dust in open floor cells
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

  // Canvas-generated circular sprite texture
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

function Floor({ grid }) {
  const floorTex = useTexture('/textures/floor.svg')
  floorTex.wrapS = RepeatWrapping
  floorTex.wrapT = RepeatWrapping
  floorTex.repeat.set(4, 4)

  const rows = grid.length
  const cols = grid[0].length
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[cols * CELL_SIZE, rows * CELL_SIZE]} />
      <meshStandardMaterial map={floorTex} roughness={0.7} metalness={0.05} color="#2a2a18" />
    </mesh>
  )
}

function Ceiling({ grid }) {
  const rows = grid.length
  const cols = grid[0].length
  // Ceiling crack decals
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
      {/* Ceiling crack lines */}
      {cracks.map((c) => (
        <mesh key={c.key} position={c.pos} rotation={[0, c.angle, 0]}>
          <boxGeometry args={[c.len, 0.005, 0.02]} />
          <meshBasicMaterial color="#010100" />
        </mesh>
      ))}
    </group>
  )
}

// ---- Platform floors (elevated sections at Y=WALL_HEIGHT) ----
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

// ---- Wall extensions around platforms (railing/parapet) ----
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
        // Check 4 neighbors — if neighbor is not platform and not stair, add a barrier
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]]
        dirs.forEach(([dx, dz]) => {
          const nx = x + dx
          const nz = z + dz
          if (nz < 0 || nz >= rows || nx < 0 || nx >= cols) return
          const neighbor = grid[nz][nx]
          if (neighbor === PLATFORM || neighbor === STAIR_UP) return
          // Add a short wall on this edge
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

// ---- Stair ramps ----
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
        if (grid[z][x] !== STAIR_UP) continue
        // Ramp goes from south (lower grid z) to north (higher grid z)
        // In world coords: south = more negative Z, north = more positive Z
        // Player walks from higher grid row to lower grid row to go up
        const cx = x * CELL_SIZE - offsetX + CELL_SIZE / 2
        const cz = z * CELL_SIZE - offsetZ + CELL_SIZE / 2
        const half = CELL_SIZE / 2
        // Custom ramp geometry: a plane tilted up from south to north
        items.push({
          pos: [cx, 0, cz],
          key: `stair-${z}-${x}`,
          gx: x,
          gz: z,
        })
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
  // Create a ramp that slopes from Y=0 (south/world-Z-negative) to Y=WALL_HEIGHT (north/world-Z-positive)
  const half = CELL_SIZE / 2
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const h = WALL_HEIGHT
    const vertices = new Float32Array([
      // South edge (low, Y=0) — two triangles
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
  return (
    <group>
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
            {/* Key bow (ring) */}
            <torusGeometry args={[0.15, 0.05, 8, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#d97706"
              emissiveIntensity={1.0}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
          {/* Key shaft */}
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

// ---- Sliding door display with animation ----
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
      // Already marked done — hide via Three.js ref (avoids React re-render dependency)
      if (state.done) {
        const gr = groupRefs.current[d.key]
        if (gr) gr.visible = false
        return
      }
      const elapsed = (now - state.startTime) / DOOR_SLIDE_DURATION
      const t = Math.min(1, elapsed)
      if (t >= 1) {
        // Animation complete — mark done and hide immediately
        state.done = true
        const gr = groupRefs.current[d.key]
        if (gr) gr.visible = false
        return
      }
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      const slideY = eased * (WALL_HEIGHT + 1) // slide up into ceiling
      const gr = groupRefs.current[d.key]
      if (gr) {
        gr.position.y = d.pos[1] + slideY
        // Fade the lock glow as it slides
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
        if (state && state.done) return null // fully removed after animation
        return (
          <group
            key={d.key}
            ref={(el) => { groupRefs.current[d.key] = el }}
            position={d.pos}
          >
            {/* Door frame */}
            <mesh position={[0, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[CELL_SIZE * 0.85, WALL_HEIGHT * 0.9, 0.2]} />
              <meshStandardMaterial map={doorTex} roughness={0.6} metalness={0.4} color="#4a3728" />
            </mesh>
            {/* Lock icon glow */}
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
    <>
      {/* Cylindrical 360° point light centered on player */}
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
    </>
  )
}

// ---- Spikes (floor hazard) ----
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
        // Fill the cell with a 3x3 spike grid
        for (let sx = 0; sx < 3; sx++) {
          for (let sz = 0; sz < 3; sz++) {
            const fx = x * CELL_SIZE - offsetX + CELL_SIZE / 2 + (sx - 1) * (CELL_SIZE / 3)
            const fz = z * CELL_SIZE - offsetZ + CELL_SIZE / 2 + (sz - 1) * (CELL_SIZE / 3)
            // Deterministic rotation per spike (position-based, not random)
            const angle = ((sx * 13 + sz * 7 + x * 31 + z * 17) * 0.618) % (Math.PI * 2)
            items.push({ pos: [fx, 0.05 + yOff, fz], angle, key: `spike-${z}-${x}-${sx}-${sz}` })
          }
        }
      }
    }
    return items
  }, [grid])

  return (
    <group>
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

// ---- Compute base floor height at a world position from the grid ----
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
    // Ramp: south (higher grid Z) = Y=0, north (lower grid Z) = Y=WALL_HEIGHT
    // Within the cell, t goes from 0 (south edge) to 1 (north edge)
    // In world coords: south = more negative Z, north = more positive Z
    const cellWorldZ = iz * CELL_SIZE - offsetZ + CELL_SIZE / 2
    const southEdge = cellWorldZ - CELL_SIZE / 2
    const t = (wz - southEdge) / CELL_SIZE
    return Math.max(0, Math.min(WALL_HEIGHT, t * WALL_HEIGHT))
  }
  return 0
}

// ---- Player shadow disc (on floor below camera) ----
function PlayerShadow({ gameState }) {
  const shadowRef = useRef()
  useFrame(() => {
    if (!shadowRef.current || !gameState.playerPos) return
    const [px, py, pz] = gameState.playerPos
    const floorH = gameState.playerOnFloor ?? 0
    shadowRef.current.position.set(px, floorH + 0.03, pz)
    // Scale based on height above floor
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

function Player({ grid, gameState, mobileMove, mobileLookRef, doorsOpenedRef, paused, mobileJump }) {
  const { camera } = useThree()
  const keys = useRef({})
  const footstepTimer = useRef(0)
  const wallBumpTimer = useRef(0)
  const bobPhase = useRef(0)
  const verticalVel = useRef(0)
  const jumpHeld = useRef(false)           // tracks if jump key is held for variable height
  const prevMobileJump = useRef(false)
  const prevGrounded = useRef(true)         // for landing impact detection
  const landingDip = useRef(0)              // camera dip amount on landing
  const strafeTilt = useRef(0)              // current camera roll for strafe tilt
  const velocityX = useRef(0)               // smoothed horizontal velocity X
  const velocityZ = useRef(0)               // smoothed horizontal velocity Z

  const mobileSprintingRef = useRef(false)  // hysteresis for mobile auto-sprint
  const wallRunTilt = useRef(0)             // camera tilt toward wall during wall-run
  const isSliding = useRef(false)           // crouch-slide active
  const slideTimer = useRef(0)              // slide remaining duration
  const slideCooldown = useRef(0)           // cooldown before next slide

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
          // Walls always block; locked doors only block if not yet opened
          const blocks = cell === WALL || (cell === DOOR && !(doorsOpenedRef?.current?.has(`${cz}-${cx}`)))
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

  useEffect(() => {
    camera.position.set(spawnPos[0], spawnPos[1], spawnPos[2])
  }, [spawnPos, camera])

  useEffect(() => {
    const onKeyDown = (e) => { keys.current[e.code] = true }
    const onKeyUp = (e) => { keys.current[e.code] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

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

    // ---- Ground state ----
    const floorH = getFloorHeightAt(camera.position.x, camera.position.z, grid)
    const footY = camera.position.y - PLAYER_EYE_HEIGHT
    const isGrounded = footY <= floorH + 0.05 && verticalVel.current <= 0

    // Landing impact — detect ground entry
    if (isGrounded && !prevGrounded.current) {
      const fallSpeed = Math.abs(verticalVel.current)
      if (fallSpeed > 3) {
        landingDip.current = Math.min(0.12, fallSpeed * 0.015)
      }
    }
    prevGrounded.current = isGrounded

    if (isGrounded) {
      camera.position.y = floorH + (isSliding.current ? PLAYER_EYE_HEIGHT * 0.55 : PLAYER_EYE_HEIGHT)
      verticalVel.current = 0
    }

    // ---- Input direction ----
    let mx = 0, mz = 0
    if (k['KeyW'] || k['ArrowUp']) { mx += _forward.x; mz += _forward.z }
    if (k['KeyS'] || k['ArrowDown']) { mx -= _forward.x; mz -= _forward.z }
    if (k['KeyA'] || k['ArrowLeft']) { mx -= _right.x; mz -= _right.z }
    if (k['KeyD'] || k['ArrowRight']) { mx += _right.x; mz += _right.z }

    // Mobile input — auto-sprint with hysteresis (activate >0.85, deactivate <0.7)
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

    // ---- Sprint (Shift key or mobile edge push) ----
    const sprinting = (k['ShiftLeft'] || k['ShiftRight']) || mobileEdge
    const sprintMult = sprinting ? 1.6 : 1.0
    const targetSpeed = PLAYER_SPEED * sprintMult

    // ---- Smooth acceleration / deceleration (lerp-based velocity) ----
    const accelRate = 12   // how quickly speed ramps up
    const decelRate = 16   // how quickly speed ramps down (slightly snappier)

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
      // Snap to zero when very slow
      if (Math.abs(velocityX.current) < 0.1) velocityX.current = 0
      if (Math.abs(velocityZ.current) < 0.1) velocityZ.current = 0
    }

    // ---- Air control (40% of ground influence) ----
    let airMult = 1.0
    if (!isGrounded) airMult = 0.4

    const vx = velocityX.current * dt * airMult
    const vz = velocityZ.current * dt * airMult

    // ---- Crouch-slide (Ctrl key) ----
    const ctrlDown = k['ControlLeft'] || k['ControlRight']
    slideCooldown.current = Math.max(0, slideCooldown.current - dt)
    slideTimer.current = Math.max(0, slideTimer.current - dt)

    if (ctrlDown && sprinting && isGrounded && isMoving && slideCooldown.current <= 0 && !isSliding.current) {
      isSliding.current = true
      slideTimer.current = 0.5
      slideCooldown.current = 1.0
    }
    if (isSliding.current && slideTimer.current <= 0) {
      isSliding.current = false
    }

    const slideMult = isSliding.current ? 1.3 : 1.0

    // ---- Wall collision with wall-running ----
    const nx = camera.position.x + vx * slideMult
    const nz = camera.position.z + vz * slideMult

    let bumped = false
    let wallRunActive = false
    const wallRunSpeed = PLAYER_SPEED * sprintMult * 1.2

    // Try X movement
    if (!checkCollision(nx, camera.position.z)) {
      camera.position.x = nx
    } else {
      bumped = true
      // Wall-run: if sprinting, grounded, and pressing toward the wall, slide along it
      if (sprinting && isGrounded && isMoving) {
        const vzOnly = camera.position.z + vz * slideMult
        if (!checkCollision(camera.position.x, vzOnly)) {
          // Wall is along X axis — project movement to Z (parallel)
          camera.position.z = vzOnly
          // Boost parallel velocity additively with a cap (not multiplicatively — avoids explosion)
          // Use input direction as sign fallback when parallel velocity is near zero
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

    // Try Z movement
    if (!checkCollision(camera.position.x, nz)) {
      camera.position.z = nz
    } else {
      bumped = true
      if (sprinting && isGrounded && isMoving) {
        const vxOnly = camera.position.x + vx * slideMult
        if (!checkCollision(vxOnly, camera.position.z)) {
          // Wall is along Z axis — project movement to X (parallel)
          camera.position.x = vxOnly
          // Use input direction as sign fallback when parallel velocity is near zero
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

    // Wall-run camera tilt toward wall
    const targetWallTilt = wallRunActive ? 0.06 : 0
    wallRunTilt.current += (targetWallTilt - wallRunTilt.current) * Math.min(12 * dt, 1)

    // Wall bump sound (only when not wall-running)
    if (bumped && isMoving && !wallRunActive) {
      wallBumpTimer.current -= delta
      if (wallBumpTimer.current <= 0) {
        wallBumpTimer.current = WALL_BUMP_COOLDOWN
        playWallBump()
      }
    } else if (!bumped) {
      wallBumpTimer.current = 0
    }

    // ---- Variable-height jump ----
    const spaceJump = k['Space']
    let mobileJumpEdge = false
    if (mobileJump !== undefined) {
      if (mobileJump && !prevMobileJump.current) mobileJumpEdge = true
      prevMobileJump.current = mobileJump
    }

    const jumpKeyDown = spaceJump || mobileJumpEdge

    // Jump initiation
    if (jumpKeyDown && isGrounded && !jumpHeld.current) {
      verticalVel.current = JUMP_VELOCITY
      jumpHeld.current = true
    }

    // Variable height: release jump key early → cut velocity for short hop
    if (!jumpKeyDown && jumpHeld.current && verticalVel.current > JUMP_VELOCITY * 0.3) {
      verticalVel.current *= 0.45
    }

    // Reset jump tracking when key released
    if (!jumpKeyDown) {
      jumpHeld.current = false
    }

    // Apply gravity
    verticalVel.current -= GRAVITY * dt
    camera.position.y += verticalVel.current * dt

    // Clamp to floor (don't fall through)
    const newFootY = camera.position.y - PLAYER_EYE_HEIGHT
    if (newFootY < floorH && verticalVel.current < 0) {
      camera.position.y = floorH + PLAYER_EYE_HEIGHT
      verticalVel.current = 0
    }

    // Ceiling clamp
    if (camera.position.y > WALL_HEIGHT - 0.2) {
      camera.position.y = WALL_HEIGHT - 0.2
      if (verticalVel.current > 0) verticalVel.current = 0
    }

    // ---- Landing dip animation ----
    if (landingDip.current > 0.001) {
      camera.position.y -= landingDip.current
      landingDip.current *= Math.exp(-20 * dt)  // exponential decay
    }

    gameState.playerPos = [camera.position.x, camera.position.y, camera.position.z]
    gameState.isMoving = isMoving
    gameState.playerOnFloor = floorH

    // Mobile look — apply touch deltas to camera rotation (BEFORE strafe roll)
    if (mobileLookRef && (mobileLookRef.current[0] !== 0 || mobileLookRef.current[1] !== 0)) {
      _euler.setFromQuaternion(camera.quaternion)
      _euler.y -= mobileLookRef.current[0] * 0.003
      _euler.x -= mobileLookRef.current[1] * 0.003
      _euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, _euler.x))
      camera.quaternion.setFromEuler(_euler)
      mobileLookRef.current = [0, 0]
    }

    // ---- Camera tilt on strafe (roll) — directly set camera.rotation.z ----
    const lateralComponent = velocityX.current * _right.x + velocityZ.current * _right.z
    const tiltRatio = Math.max(-1, Math.min(1, lateralComponent / Math.max(targetSpeed, 0.1)))
    const targetTilt = tiltRatio * 0.04 + wallRunTilt.current * (tiltRatio > 0 ? 1 : -1)
    strafeTilt.current += (targetTilt - strafeTilt.current) * Math.min(9 * dt, 1)
    camera.rotation.z = strafeTilt.current

    // ---- Footstep sounds (faster when sprinting or sliding) ----
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

    // ---- Camera bob (faster & deeper when sprinting; lowered during slide) ----
    const slideEyeHeight = isSliding.current ? PLAYER_EYE_HEIGHT * 0.55 : PLAYER_EYE_HEIGHT
    if (actualSpeed > 0.5 && isGrounded) {
      bobPhase.current += delta * ((sprinting || isSliding.current) ? 16 : 10)
      const bobAmount = (sprinting || isSliding.current) ? 0.04 * Math.sin(bobPhase.current) : 0.025 * Math.sin(bobPhase.current)
      camera.position.y += bobAmount
    }

    // ---- Slide FOV effect (widen from 90 to 100 during crouch-slide) ----
    const targetFov = isSliding.current ? 100 : 90
    if (Math.abs(targetFov - camera.fov) > 0.01) {
      camera.fov += (targetFov - camera.fov) * Math.min(8 * dt, 1)
      camera.updateProjectionMatrix()
    }

  })

  return null
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
}) {
  // ---- Crystal data ----
  const crystalData = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === CRYSTAL) {
          // Items on elevated platforms need to be at platform height
          const yOff = grid[z][x] === CRYSTAL ? getFloorHeightForCell(x, z, grid) : 0
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 1.2 + yOff, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `crystal-${z}-${x}`,
          })
        }
      }
    }
    return items
  }, [grid])

  // ---- Key data ----
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

  // ---- Door data ----
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
            gx: x,
            gz: z,
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

  const collectedSet = useRef(new Set())
  const keysTakenSet = useRef(new Set())
  const doorsOpenedSet = useRef(new Set())
  const exitTriggered = useRef(false)
  const deadRef = useRef(false)
  const [collectedCount, setCollectedCount] = useState(0)
  const [keysTakenCount, setKeysTakenCount] = useState(0)
  const [doorsOpenedCount, setDoorsOpenedCount] = useState(0)
  const healthRef = useRef(health)
  healthRef.current = health

  // Door slide animation state
  const doorSlideStates = useRef({})
  const { clock } = useThree()

  const activeCrystals = useMemo(() => {
    return crystalData.filter((_, i) => !collectedSet.current.has(i))
  }, [crystalData, collectedCount])

  const activeKeys = useMemo(() => {
    return keyData.filter((_, i) => !keysTakenSet.current.has(i))
  }, [keyData, keysTakenCount])

  const activeDoors = useMemo(() => {
    return doorData.filter((_, i) => {
      if (doorsOpenedSet.current.has(i)) {
        const state = doorSlideStates.current[`door-${doorData[i].gz}-${doorData[i].gx}`]
        // Show door during slide animation, hide after
        if (state && !state.done) return true
        return false
      }
      return true
    })
  }, [doorData, doorsOpenedCount])

  const allDoorsOpen = doorsOpenedSet.current.size >= doorData.length
  // Use ref so exit check in useFrame sees latest value immediately after crystal collection
  const activatedRef = useRef(false)
  activatedRef.current = collectedCount >= crystalsNeeded && allDoorsOpen
  const activated = activatedRef.current

  // Update minimap data
  const minimapTimer = useRef(0)
  const spikeHurtTimer = useRef(0)
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

    // Health drain (base rate + spike damage if standing on spikes)
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
        }
      } else {
        spikeHurtTimer.current = 0
      }
      const drainRate = HEALTH_DRAIN_RATE + (onSpikes ? SPIKES_DAMAGE_RATE : 0)
      const newHealth = Math.max(0, healthRef.current - drainRate * delta)
      if (newHealth !== healthRef.current) {
        if (onHealthChange) onHealthChange(newHealth)
        if (newHealth <= 0) {
          deadRef.current = true
          playDeath()
          if (onDeath) onDeath()
          return
        }
      }
    }

    // Crystal collection
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
        const healed = Math.min(100, healthRef.current + HEALTH_PER_CRYSTAL)
        if (onHealthChange) onHealthChange(healed)
        playCrystalCollect()
      }
    })

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
        playKeyCollect()
      }
    })

    // Door opening (consume a key per door)
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
        // Track opened door for collision skip in Player
        if (doorsOpenedRef) doorsOpenedRef.current.add(`${d.gz}-${d.gx}`)
        // Start slide animation
        doorSlideStates.current[d.key] = { startTime: clock.getElapsedTime(), done: false }
        const newDoorsCount = doorsOpenedSet.current.size
        setDoorsOpenedCount(newDoorsCount)
        if (onDoorOpened) onDoorOpened(newDoorsCount)
        playDoorOpen()
      }
    })

    // Exit portal check — use ref to avoid stale closure after same-frame crystal/key pickup
    if (activatedRef.current && !exitTriggered.current) {
      const ex = pp[0] - exitPos[0]
      const ey = pp[1] - exitPos[1]
      const ez = pp[2] - exitPos[2]
      if (Math.sqrt(ex * ex + ey * ey + ez * ez) < 2.5) {
        exitTriggered.current = true
        playPortalActivate()
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
    </>
  )
}

// Helper: get floor height for a grid cell (used to offset items on platforms)
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
}) {
  const gameState = useRef({ playerPos: null, isMoving: false, playerOnFloor: 0 })
  const doorsOpenedRef = useRef(new Set())
  return (
    <>
      <ambientLight intensity={0.25} color="#2a1a08" />
      <LanternLight healthPct={health} />
      <MazeWalls grid={level.grid} />
      <Floor grid={level.grid} />
      <PlatformFloors grid={level.grid} />
      <PlatformWalls grid={level.grid} />
      <StairsDisplay grid={level.grid} />
      <Ceiling grid={level.grid} />
      <SpikesDisplay grid={level.grid} />
      <WallTorches grid={level.grid} />
      <DustParticles grid={level.grid} />
      <PlayerShadow gameState={gameState} />
      <Player grid={level.grid} gameState={gameState} mobileMove={mobileMove} mobileLookRef={mobileLookRef} doorsOpenedRef={doorsOpenedRef} paused={paused} mobileJump={mobileJump} />
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
      />
      <fog attach="fog" args={['#0a0a05', 20, 55]} />
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
}) {
  const [ready, setReady] = useState(false)
  const [showClickHint, setShowClickHint] = useState(false)
  const [showMobileHint, setShowMobileHint] = useState(false)
  const prevPausedRef = useRef(paused)
  const mobileHintTimer = useRef(null)
  const canvasContainerRef = useRef(null)

  // Detect mobile/touch devices — PointerLockControls not supported there
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

  // Explicit pointer lock request from button click (more reliable than pass-through)
  const handleExplicitLock = useCallback(() => {
    const canvas = canvasContainerRef.current?.querySelector('canvas')
    if (canvas) {
      canvas.requestPointerLock()
      // handleLock will fire via PointerLockControls onLock callback
    }
  }, [])

  // Also try locking on click anywhere on the container (fallback)
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container || ready || isMobile) return
    const onClick = () => {
      const canvas = container.querySelector('canvas')
      if (canvas && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock()
      }
    }
    container.addEventListener('click', onClick)
    return () => container.removeEventListener('click', onClick)
  }, [ready, isMobile])

  // When paused transitions true→false (Resume), show click hint since pointer is unlocked.
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

  // Cleanup mobile hint timer
  useEffect(() => {
    return () => { if (mobileHintTimer.current) clearTimeout(mobileHintTimer.current) }
  }, [])

  // On mobile, just mark ready directly — no pointer lock needed
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
        />
        {!isMobile && <PointerLockControls onLock={handleLock} onUnlock={handleUnlock} />}
      </Canvas>

      {/* Click to begin overlay with instructions */}
      {!ready && !isMobile && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="text-center max-w-md px-6">
            <div className="text-amber-400 text-3xl md:text-4xl font-bold mb-2 tracking-tight">
              Lanternlight
            </div>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-5" />
            <button
              onClick={handleExplicitLock}
              className="px-10 py-4 bg-amber-500/15 border-2 border-amber-500/50 rounded-xl text-amber-300 text-xl font-bold tracking-wide transition-all duration-300 hover:border-amber-400/70 hover:bg-amber-500/25 hover:text-amber-200 active:scale-95 cursor-pointer mb-6"
            >
              Click to Begin
            </button>
            <div className="text-amber-500/30 text-xs space-y-1">
              <p><span className="text-amber-500/50 font-semibold">W A S D</span> or <span className="text-amber-500/50 font-semibold">Arrow Keys</span> to move</p>
              <p><span className="text-amber-500/50 font-semibold">Space</span> to jump — hold for higher</p>
              <p><span className="text-amber-500/50 font-semibold">Shift</span> to sprint (slide along walls)</p>
              <p><span className="text-amber-500/50 font-semibold">Ctrl</span> to slide (while sprinting)</p>
              <p><span className="text-amber-500/50 font-semibold">Mouse</span> to look around</p>
              <p><span className="text-amber-500/50 font-semibold">Escape</span> to pause</p>
              <p className="mt-2 text-amber-500/20">Collect crystals, find keys, open doors, reach the portal</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Tap to Start button */}
      {!ready && isMobile && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="text-center max-w-md px-6">
            <div className="text-amber-400 text-3xl font-bold mb-2 tracking-tight">Lanternlight</div>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mx-auto mb-5" />
            <button
              onClick={handleMobileStart}
              className="px-10 py-4 bg-amber-500/15 border-2 border-amber-500/50 rounded-xl text-amber-300 text-xl font-bold tracking-wide transition-all duration-300 hover:border-amber-400/70 hover:bg-amber-500/25 active:scale-95 cursor-pointer mb-6"
            >
              Tap to Start
            </button>
            <div className="text-amber-500/30 text-xs space-y-1">
              <p><span className="text-amber-500/50 font-semibold">Left Joystick</span> to move — push to edge to sprint</p>
              <p><span className="text-amber-500/50 font-semibold">Center Button</span> to jump — hold for higher</p>
              <p><span className="text-amber-500/50 font-semibold">Right Area</span> to look around</p>
              <p className="mt-2 text-amber-500/20">Collect crystals, find keys, open doors, reach the portal</p>
            </div>
          </div>
        </div>
      )}

      {/* Resume hint — fades immediately when pointer lock reacquired */}
      {!isMobile && (
        <div
          className={`absolute inset-0 z-15 flex items-center justify-center pointer-events-none transition-opacity duration-150 ${showClickHint && !paused ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg border border-amber-700/20">
            <span className="text-amber-400/70 text-sm">Click to continue</span>
          </div>
        </div>
      )}

      {/* Mobile unpause hint — auto-fades after 1 second */}
      {isMobile && (
        <div
          className={`absolute inset-0 z-15 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${showMobileHint && !paused ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-lg border border-amber-700/20">
            <span className="text-amber-400/70 text-sm">Tap to resume</span>
          </div>
        </div>
      )}
    </div>
  )
}

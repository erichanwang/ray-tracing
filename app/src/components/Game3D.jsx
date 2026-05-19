import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { Vector3, Euler, DoubleSide } from 'three'
import { playFootstep, playCrystalCollect, playPortalActivate, playDeath } from '../game/sound'

const CELL_SIZE = 4
const WALL_HEIGHT = 3
const PLAYER_SPEED = 8
const PLAYER_RADIUS = 0.35
const COLLECT_DISTANCE = 1.8
const HEALTH_DRAIN_RATE = 2.5
const HEALTH_PER_CRYSTAL = 30
const FOOTSTEP_INTERVAL = 0.4

function MazeWalls({ grid }) {
  const walls = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === 1) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, WALL_HEIGHT / 2, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `${z}-${x}`,
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
          <boxGeometry args={[CELL_SIZE * 0.98, WALL_HEIGHT, CELL_SIZE * 0.98]} />
          <meshStandardMaterial color="#1a1a0e" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
    </group>
  )
}

function Floor({ grid }) {
  const rows = grid.length
  const cols = grid[0].length
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[cols * CELL_SIZE, rows * CELL_SIZE]} />
      <meshStandardMaterial color="#0d0d08" roughness={0.95} />
    </mesh>
  )
}

function Ceiling({ grid }) {
  const rows = grid.length
  const cols = grid[0].length
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, WALL_HEIGHT + 0.01, 0]} receiveShadow>
      <planeGeometry args={[cols * CELL_SIZE, rows * CELL_SIZE]} />
      <meshStandardMaterial color="#080804" roughness={1} side={DoubleSide} />
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

function LanternLight({ healthPct }) {
  const { camera } = useThree()
  const lightRef = useRef()

  const intensity = 1 + (healthPct / 100) * 3
  const distance = 8 + (healthPct / 100) * 16

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position)
      const dir = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
      lightRef.current.target.position.copy(camera.position).add(dir)
      lightRef.current.intensity = intensity
      lightRef.current.distance = distance
    }
  })

  return (
    <spotLight
      ref={lightRef}
      color="#fbbf24"
      intensity={intensity}
      distance={distance}
      angle={0.5}
      penumbra={0.3}
      decay={1.5}
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      castShadow
    />
  )
}

function Player({ grid, gameState, mobileMove, mobileLookRef }) {
  const { camera } = useThree()
  const keys = useRef({})
  const footstepTimer = useRef(0)

  const spawnPos = useMemo(() => {
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === 4) {
          return [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 1.6, z * CELL_SIZE - offsetZ + CELL_SIZE / 2]
        }
      }
    }
    return [0, 1.6, 0]
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
        if (cz >= 0 && cz < rows && cx >= 0 && cx < cols && grid[cz][cx] === 1) {
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
    const k = keys.current
    const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    forward.y = 0
    forward.normalize()
    const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    right.y = 0
    right.normalize()

    let mx = 0, mz = 0
    if (k['KeyW'] || k['ArrowUp']) { mx += forward.x; mz += forward.z }
    if (k['KeyS'] || k['ArrowDown']) { mx -= forward.x; mz -= forward.z }
    if (k['KeyA'] || k['ArrowLeft']) { mx -= right.x; mz -= right.z }
    if (k['KeyD'] || k['ArrowRight']) { mx += right.x; mz += right.z }

    // Mobile input
    if (mobileMove) {
      mx += mobileMove[1] * forward.x + mobileMove[0] * right.x
      mz += mobileMove[1] * forward.z + mobileMove[0] * right.z
    }

    const len = Math.sqrt(mx * mx + mz * mz)
    if (len > 1) { mx /= len; mz /= len }

    const dt = Math.min(delta, 0.1)
    const spd = PLAYER_SPEED * dt

    const nx = camera.position.x + mx * spd
    const nz = camera.position.z + mz * spd

    if (!checkCollision(nx, camera.position.z)) camera.position.x = nx
    if (!checkCollision(camera.position.x, nz)) camera.position.z = nz

    camera.position.y = 1.6
    gameState.playerPos = [camera.position.x, camera.position.y, camera.position.z]
    gameState.isMoving = len > 0.05

    // Mobile look — apply touch deltas to camera rotation
    if (mobileLookRef && (mobileLookRef.current[0] !== 0 || mobileLookRef.current[1] !== 0)) {
      const euler = new Euler(0, 0, 0, 'YXZ')
      euler.setFromQuaternion(camera.quaternion)
      euler.y -= mobileLookRef.current[0] * 0.003
      euler.x -= mobileLookRef.current[1] * 0.003
      euler.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.x))
      camera.quaternion.setFromEuler(euler)
      mobileLookRef.current = [0, 0]
    }

    // Footstep sounds
    if (gameState.isMoving) {
      footstepTimer.current -= delta
      if (footstepTimer.current <= 0) {
        footstepTimer.current = FOOTSTEP_INTERVAL
        playFootstep()
      }
    } else {
      footstepTimer.current = 0
    }
  })

  return null
}

function GameLogic({ grid, crystalsNeeded, gameState, health, onCrystalCollected, onHealthChange, onLevelComplete, onDeath, onMinimapUpdate }) {
  const crystalData = useMemo(() => {
    const items = []
    const rows = grid.length
    const cols = grid[0].length
    const offsetX = (cols * CELL_SIZE) / 2
    const offsetZ = (rows * CELL_SIZE) / 2
    for (let z = 0; z < rows; z++) {
      for (let x = 0; x < cols; x++) {
        if (grid[z][x] === 2) {
          items.push({
            pos: [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 1.2, z * CELL_SIZE - offsetZ + CELL_SIZE / 2],
            key: `crystal-${z}-${x}`,
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
        if (grid[z][x] === 3) {
          return [x * CELL_SIZE - offsetX + CELL_SIZE / 2, 1, z * CELL_SIZE - offsetZ + CELL_SIZE / 2]
        }
      }
    }
    return [0, 1, 0]
  }, [grid])

  const collectedSet = useRef(new Set())
  const exitTriggered = useRef(false)
  const deadRef = useRef(false)
  const [collectedCount, setCollectedCount] = useState(0)
  const healthRef = useRef(health)
  healthRef.current = health

  const activeCrystals = useMemo(() => {
    return crystalData.filter((_, i) => !collectedSet.current.has(i))
  }, [crystalData, collectedCount])

  const activated = collectedCount >= crystalsNeeded

  // Update minimap data (debounced via useFrame, not every render)
  const minimapTimer = useRef(0)
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
    const pp = gameState.playerPos
    if (!pp) return

    // Health drain
    if (!deadRef.current) {
      const newHealth = Math.max(0, healthRef.current - HEALTH_DRAIN_RATE * delta)
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

    // Crystal collection check
    crystalData.forEach((c, i) => {
      if (collectedSet.current.has(i)) return
      const dx = pp[0] - c.pos[0]
      const dz = pp[2] - c.pos[2]
      if (Math.sqrt(dx * dx + dz * dz) < COLLECT_DISTANCE) {
        collectedSet.current.add(i)
        const newCount = collectedSet.current.size
        setCollectedCount(newCount)
        if (onCrystalCollected) onCrystalCollected(newCount)
        // Heal on crystal collect
        const healed = Math.min(100, healthRef.current + HEALTH_PER_CRYSTAL)
        if (onHealthChange) onHealthChange(healed)
        playCrystalCollect()
      }
    })

    // Exit portal check (guarded against repeated calls)
    if (activated && !exitTriggered.current) {
      const ex = pp[0] - exitPos[0]
      const ez = pp[2] - exitPos[2]
      if (Math.sqrt(ex * ex + ez * ez) < 2) {
        exitTriggered.current = true
        playPortalActivate()
        if (onLevelComplete) onLevelComplete()
      }
    }
  })

  return (
    <>
      <CrystalsDisplay crystals={activeCrystals} />
      <ExitPortalDisplay position={exitPos} activated={activated} />
    </>
  )
}

function SceneContent({ level, health, mobileMove, mobileLookRef, onCrystalCollected, onHealthChange, onLevelComplete, onDeath, onMinimapUpdate }) {
  const gameState = useRef({ playerPos: null, isMoving: false })
  const healthPct = (health / 100) * 100

  return (
    <>
      <ambientLight intensity={0.08} color="#2a1a08" />
      <LanternLight healthPct={healthPct} />
      <MazeWalls grid={level.grid} />
      <Floor grid={level.grid} />
      <Ceiling grid={level.grid} />
      <Player grid={level.grid} gameState={gameState} mobileMove={mobileMove} mobileLookRef={mobileLookRef} />
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
      />
      <fog attach="fog" args={['#0a0a05', 5, 30]} />
    </>
  )
}

export default function Game3D({ level, health, mobileMove, mobileLookRef, onCrystalCollected, onHealthChange, onLevelComplete, onDeath, onMinimapUpdate }) {
  return (
    <Canvas
      shadows
      gl={{ antialias: true }}
      camera={{ fov: 70, near: 0.1, far: 50 }}
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
      />
      <PointerLockControls />
    </Canvas>
  )
}

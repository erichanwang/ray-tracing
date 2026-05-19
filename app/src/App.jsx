import { useState, useCallback, useEffect, useRef } from 'react'
import MainMenu from './components/MainMenu'
import Game3D from './components/Game3D'
import HUD from './components/HUD'
import LevelComplete from './components/LevelComplete'
import LevelSelect from './components/LevelSelect'
import DeathScreen from './components/DeathScreen'
import Victory from './components/Victory'
import MobileControls from './components/MobileControls'
import Minimap from './components/Minimap'
import PauseMenu from './components/PauseMenu'
import { startMusic, stopMusic, setMusicVolume, startAmbient, stopAmbient, setAmbientVolume } from './game/sound'
import LEVELS from './game/levels'

const MAX_HEALTH = 100

const isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)

export default function App() {
  const [screen, setScreen] = useState('menu')
  const [levelIndex, setLevelIndex] = useState(0)
  const [crystals, setCrystals] = useState(0)
  const [crystalsNeeded, setCrystalsNeeded] = useState(0)
  const [health, setHealth] = useState(MAX_HEALTH)
  const [devMode, setDevMode] = useState(false)
  const [unlockedLevel, setUnlockedLevel] = useState(0)
  const [hasStartedGame, setHasStartedGame] = useState(false)
  const [mobileMove, setMobileMove] = useState([0, 0])
  const [mobileJump, setMobileJump] = useState(false)
  const mobileLookRef = useRef([0, 0])
  const [minimapData, setMinimapData] = useState({ playerPos: null, crystals: [], exitPos: null })
  const [keysHeld, setKeysHeld] = useState(0)
  const [doorsOpened, setDoorsOpened] = useState(0)
  const [musicVol, setMusicVol] = useState(() => {
    try { return parseFloat(localStorage.getItem('lanternlight_musicVol')) } catch { return 1 }
    return 1
  })
  const [ambientVol, setAmbientVol] = useState(() => {
    try { return parseFloat(localStorage.getItem('lanternlight_ambientVol')) } catch { return 1 }
    return 1
  })
  const [paused, setPaused] = useState(false)
  const musicVolRef = useRef(musicVol)
  const ambientVolRef = useRef(ambientVol)
  musicVolRef.current = musicVol
  ambientVolRef.current = ambientVol

  // Dev mode toggle — backtick/tilde key
  useEffect(() => {
    const handler = (e) => {
      if (e.code === 'Backquote') {
        setDevMode(d => !d)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const countDoorsInLevel = useCallback((idx) => {
    let count = 0
    const grid = LEVELS[idx].grid
    for (let z = 0; z < grid.length; z++) {
      for (let x = 0; x < grid[0].length; x++) {
        if (grid[z][x] === 6) count++
      }
    }
    return count
  }, [])

  const startGame = useCallback((idx = 0) => {
    setLevelIndex(idx)
    setCrystals(0)
    setHealth(MAX_HEALTH)
    setCrystalsNeeded(LEVELS[idx].crystalsNeeded)
    setMinimapData({ playerPos: null, crystals: [], exitPos: null })
    setHasStartedGame(true)
    setKeysHeld(0)
    setDoorsOpened(0)
    setPaused(false)
    startMusic()
    startAmbient()
    setMusicVolume(musicVolRef.current)
    setAmbientVolume(ambientVolRef.current)
    setScreen('playing')
  }, [])

  const onCrystalCollected = useCallback((count) => {
    setCrystals(count)
  }, [])

  const onHealthChange = useCallback((h) => {
    setHealth(h)
  }, [])

  const onDeath = useCallback(() => {
    stopMusic()
    stopAmbient()
    setScreen('death')
  }, [])

  const onLevelComplete = useCallback(() => {
    stopMusic()
    stopAmbient()
    setUnlockedLevel(prev => Math.max(prev, levelIndex + 1))
    if (levelIndex + 1 >= LEVELS.length) {
      setScreen('victory')
    } else {
      setScreen('levelComplete')
    }
  }, [levelIndex])

  const nextLevel = useCallback(() => {
    const next = levelIndex + 1
    setLevelIndex(next)
    setCrystals(0)
    setHealth(MAX_HEALTH)
    setCrystalsNeeded(LEVELS[next].crystalsNeeded)
    setMinimapData({ playerPos: null, crystals: [], exitPos: null })
    setKeysHeld(0)
    setDoorsOpened(0)
    setPaused(false)
    startMusic()
    startAmbient()
    setMusicVolume(musicVolRef.current)
    setAmbientVolume(ambientVolRef.current)
    setScreen('playing')
  }, [levelIndex])

  const onMobileLook = useCallback((dx, dy) => {
    mobileLookRef.current = [mobileLookRef.current[0] + dx, mobileLookRef.current[1] + dy]
  }, [])

  const retryLevel = useCallback(() => {
    setCrystals(0)
    setHealth(MAX_HEALTH)
    mobileLookRef.current = [0, 0]
    setMinimapData({ playerPos: null, crystals: [], exitPos: null })
    setKeysHeld(0)
    setDoorsOpened(0)
    setPaused(false)
    startMusic()
    startAmbient()
    setMusicVolume(musicVolRef.current)
    setAmbientVolume(ambientVolRef.current)
    setScreen('playing')
  }, [])

  const goToMenu = useCallback(() => {
    stopMusic()
    stopAmbient()
    setPaused(false)
    setScreen('menu')
  }, [])

  // Stable callbacks to prevent cascading re-renders on mobile
  const handlePointerLock = useCallback(() => setPaused(false), [])
  const handlePointerUnlock = useCallback(() => setPaused(true), [])
  const handleMobileMove = useCallback((mx, my) => setMobileMove([mx, -my]), [])
  const handleMobileJump = useCallback((v) => setMobileJump(v), [])

  const goToLevelSelect = useCallback(() => {
    setScreen('levelSelect')
  }, [])

  const onKeyCollected = useCallback((total) => {
    setKeysHeld(total)
  }, [])

  const onChangeMusicVolume = useCallback((v) => {
    setMusicVol(v)
    setMusicVolume(v)
    try { localStorage.setItem('lanternlight_musicVol', v) } catch {}
  }, [])

  const onChangeAmbientVolume = useCallback((v) => {
    setAmbientVol(v)
    setAmbientVolume(v)
    try { localStorage.setItem('lanternlight_ambientVol', v) } catch {}
  }, [])

  const handlePauseToggle = useCallback(() => {
    setPaused(p => !p)
  }, [])

  const handleResume = useCallback(() => {
    setPaused(false)
  }, [])

  const onDoorOpened = useCallback((total) => {
    const doorsInLevel = countDoorsInLevel(levelIndex)
    // Each door opening consumes 1 key
    setKeysHeld(prev => Math.max(0, prev - 1))
    setDoorsOpened(total)
  }, [levelIndex, countDoorsInLevel])

  const level = LEVELS[levelIndex]
  const totalDoors = countDoorsInLevel(levelIndex)

  return (
    <div className="w-full h-full bg-dungeon">
      {screen === 'menu' && (
        <MainMenu onStart={() => startGame(0)} onLevelSelect={goToLevelSelect} hasGame={hasStartedGame} />
      )}

      {screen === 'levelSelect' && (
        <LevelSelect
          levels={LEVELS}
          unlockedLevel={unlockedLevel}
          onSelectLevel={startGame}
          onBack={goToMenu}
        />
      )}

      {screen === 'playing' && (
        <>
          <Game3D
            level={level}
            health={health}
            mobileMove={mobileMove}
            mobileLookRef={mobileLookRef}
            onCrystalCollected={onCrystalCollected}
            onHealthChange={onHealthChange}
            onLevelComplete={onLevelComplete}
            onDeath={onDeath}
            onMinimapUpdate={setMinimapData}
            onKeyCollected={onKeyCollected}
            onDoorOpened={onDoorOpened}
            paused={paused}
            onPointerLock={handlePointerLock}
            onPointerUnlock={handlePointerUnlock}
            mobileJump={mobileJump}
          />
          <HUD
            crystals={crystals}
            crystalsNeeded={crystalsNeeded}
            health={health}
            maxHealth={MAX_HEALTH}
            levelName={level.name}
            levelIndex={levelIndex}
            totalLevels={LEVELS.length}
            devMode={devMode}
            keys={keysHeld}
            totalDoors={totalDoors}
            doorsOpened={doorsOpened}
            musicVol={musicVol}
            ambientVol={ambientVol}
            onChangeMusicVolume={onChangeMusicVolume}
            onChangeAmbientVolume={onChangeAmbientVolume}
          />
          <Minimap
            grid={level.grid}
            playerPos={minimapData.playerPos}
            crystals={minimapData.crystals}
            exitPos={minimapData.exitPos}
            devMode={devMode}
          />
          {!paused && isMobileDevice && (
            <MobileControls
              onMove={handleMobileMove}
              onLookDelta={onMobileLook}
              onJump={handleMobileJump}
            />
          )}
          {paused && (
            <PauseMenu
              onResume={handleResume}
              onExit={goToMenu}
              musicVol={musicVol}
              ambientVol={ambientVol}
              onChangeMusicVolume={onChangeMusicVolume}
              onChangeAmbientVolume={onChangeAmbientVolume}
            />
          )}
        </>
      )}

      {screen === 'levelComplete' && (
        <LevelComplete
          levelName={level.name}
          levelIndex={levelIndex}
          onNext={nextLevel}
        />
      )}

      {screen === 'death' && (
        <DeathScreen onRetry={retryLevel} onMenu={goToMenu} />
      )}

      {screen === 'victory' && <Victory onMenu={goToMenu} />}
    </div>
  )
}

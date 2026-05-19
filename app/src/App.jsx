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
import { startMusic, stopMusic } from './game/sound'
import LEVELS from './game/levels'

const MAX_HEALTH = 100

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
  const mobileLookRef = useRef([0, 0])
  const [minimapData, setMinimapData] = useState({ playerPos: null, crystals: [], exitPos: null })

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

  const startGame = useCallback((idx = 0) => {
    setLevelIndex(idx)
    setCrystals(0)
    setHealth(MAX_HEALTH)
    setCrystalsNeeded(LEVELS[idx].crystalsNeeded)
    setMinimapData({ playerPos: null, crystals: [], exitPos: null })
    setHasStartedGame(true)
    startMusic()
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
    setScreen('death')
  }, [])

  const onLevelComplete = useCallback(() => {
    stopMusic()
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
    startMusic()
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
    startMusic()
    setScreen('playing')
  }, [])

  const goToMenu = useCallback(() => {
    stopMusic()
    setScreen('menu')
  }, [])

  const goToLevelSelect = useCallback(() => {
    setScreen('levelSelect')
  }, [])

  const level = LEVELS[levelIndex]

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
          />
          <Minimap
            grid={level.grid}
            playerPos={minimapData.playerPos}
            crystals={minimapData.crystals}
            exitPos={minimapData.exitPos}
            devMode={devMode}
          />
          <MobileControls
            onMove={(mx, my) => setMobileMove([mx, -my])}
            onLookDelta={onMobileLook}
          />
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

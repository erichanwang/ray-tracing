import { useState, useCallback } from 'react'
import MainMenu from './components/MainMenu'
import Game3D from './components/Game3D'
import HUD from './components/HUD'
import LevelComplete from './components/LevelComplete'
import Victory from './components/Victory'
import LEVELS from './game/levels'

export default function App() {
  const [screen, setScreen] = useState('menu')
  const [levelIndex, setLevelIndex] = useState(0)
  const [crystals, setCrystals] = useState(0)
  const [crystalsNeeded, setCrystalsNeeded] = useState(0)

  const startGame = useCallback(() => {
    setLevelIndex(0)
    setCrystals(0)
    setCrystalsNeeded(LEVELS[0].crystalsNeeded)
    setScreen('playing')
  }, [])

  const onCrystalCollected = useCallback((count) => {
    setCrystals(count)
  }, [])

  const onLevelComplete = useCallback(() => {
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
    setCrystalsNeeded(LEVELS[next].crystalsNeeded)
    setScreen('playing')
  }, [levelIndex])

  const goToMenu = useCallback(() => {
    setScreen('menu')
  }, [])

  const level = LEVELS[levelIndex]

  return (
    <div className="w-full h-full bg-dungeon">
      {screen === 'menu' && <MainMenu onStart={startGame} />}
      {screen === 'playing' && (
        <>
          <Game3D
            level={level}
            onCrystalCollected={onCrystalCollected}
            onLevelComplete={onLevelComplete}
          />
          <HUD
            crystals={crystals}
            crystalsNeeded={crystalsNeeded}
            levelName={level.name}
            levelIndex={levelIndex}
            totalLevels={LEVELS.length}
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
      {screen === 'victory' && <Victory onMenu={goToMenu} />}
    </div>
  )
}

// Procedural sound system using Web Audio API
// No external files needed — all sounds synthesized

let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function playFootstep() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120 + Math.random() * 40, ctx.currentTime)
    gain.gain.setValueAtTime(0.03, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  } catch (e) { /* audio not available */ }
}

export function playCrystalCollect() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  } catch (e) {}
}

export function playPortalActivate() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.5)
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 1.0)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.2)
  } catch (e) {}
}

export function playDeath() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.5)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'square'
    osc2.frequency.setValueAtTime(100, ctx.currentTime)
    osc2.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 1.5)
    gain2.gain.setValueAtTime(0.04, ctx.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.8)
    osc2.start(ctx.currentTime)
    osc2.stop(ctx.currentTime + 1.8)
  } catch (e) {}
}

let musicOsc = null
let musicGain = null
let musicInterval = null

export function startMusic() {
  try {
    const ctx = getCtx()
    stopMusic()

    musicGain = ctx.createGain()
    musicGain.gain.setValueAtTime(0.015, ctx.currentTime)
    musicGain.connect(ctx.destination)

    const notes = [65.41, 73.42, 82.41, 98.00, 110.00, 130.81, 146.83, 164.81]
    let noteIndex = 0

  function playNote() {
    if (!musicGain) return
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(notes[noteIndex % notes.length], ctx.currentTime)
    osc.connect(musicGain)
    osc.onended = () => { try { osc.disconnect() } catch(e) {} }
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1.8)
    noteIndex = (noteIndex + Math.floor(Math.random() * 3) + 1) % notes.length
  }

    playNote()
    musicInterval = setInterval(playNote, 2200)
  } catch (e) {}
}

export function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval)
    musicInterval = null
  }
  if (musicGain) {
    try {
      musicGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.5)
    } catch (e) {}
    musicGain = null
  }
}

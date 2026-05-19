// Procedural sound system using Web Audio API
// No external files needed — all sounds synthesized

// Theme A — Royal Road in A minor: Fmaj7 → G7 → Em7 → Am
// Theme B — Descending minor: Dm → Am → G → C
// Theme C — Rising hopeful: F → C → Dm → Am

const THEMES = {
  A: {
    chordFreqs: [
      /* Fmaj7 */ [349.23, 440.00, 523.25, 659.25],
      /* G7    */ [392.00, 493.88, 587.33, 698.46],
      /* Em7   */ [329.63, 392.00, 493.88, 587.33],
      /* Am    */ [220.00, 261.63, 329.63, 440.00],
    ],
    melodyFreqs: [
      /* Fmaj7 */ [349.23, 440.00, 523.25, 659.25, 523.25, 440.00],
      /* G7    */ [392.00, 493.88, 587.33, 698.46, 587.33, 493.88],
      /* Em7   */ [329.63, 392.00, 493.88, 587.33, 493.88, 392.00],
      /* Am    */ [220.00, 261.63, 329.63, 440.00, 329.63, 261.63],
    ],
    bassFreqs: [174.61, 196.00, 164.81, 110.00],
  },
  B: {
    // Dm → Am → G → C (descending, reflective)
    chordFreqs: [
      /* Dm    */ [293.66, 349.23, 440.00],
      /* Am    */ [220.00, 261.63, 329.63],
      /* G     */ [196.00, 246.94, 392.00],
      /* C     */ [261.63, 329.63, 392.00],
    ],
    melodyFreqs: [
      /* Dm    */ [293.66, 349.23, 440.00, 349.23, 293.66, 349.23],
      /* Am    */ [220.00, 261.63, 329.63, 261.63, 220.00, 261.63],
      /* G     */ [196.00, 246.94, 392.00, 246.94, 196.00, 246.94],
      /* C     */ [261.63, 329.63, 392.00, 329.63, 261.63, 329.63],
    ],
    bassFreqs: [146.83, 110.00, 98.00, 130.81],
  },
  C: {
    // F → C → Dm → Am (rising, hopeful)
    chordFreqs: [
      /* F     */ [174.61, 261.63, 349.23],
      /* C     */ [130.81, 196.00, 261.63],
      /* Dm    */ [146.83, 220.00, 293.66],
      /* Am    */ [220.00, 261.63, 329.63],
    ],
    melodyFreqs: [
      /* F     */ [349.23, 440.00, 523.25, 440.00, 349.23, 261.63],
      /* C     */ [261.63, 329.63, 392.00, 329.63, 261.63, 196.00],
      /* Dm    */ [293.66, 349.23, 440.00, 349.23, 293.66, 220.00],
      /* Am    */ [220.00, 261.63, 329.63, 261.63, 220.00, 329.63],
    ],
    bassFreqs: [87.31, 65.41, 73.42, 110.00],
  },
}

const CHORD_DURATION = 2.5
const MELODY_NOTE_DURATION = 0.35
const THEME_DURATION = 10.0

// Theme cycle: A → B → A → C → A (reprise) → B → ... 
const THEME_CYCLE = ['A', 'B', 'A', 'C', 'A', 'B']

// ============ Audio context ============

let audioCtx = null

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

// ============ SFX ============

export function playFootstep() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 400 + Math.random() * 200
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(60 + Math.random() * 40, ctx.currentTime)
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
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
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.05)
    osc2.frequency.exponentialRampToValueAtTime(2640, ctx.currentTime + 0.2)
    gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.05)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc2.start(ctx.currentTime + 0.05)
    osc2.stop(ctx.currentTime + 0.25)
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
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(220, ctx.currentTime)
    osc2.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.0)
    gain2.gain.setValueAtTime(0.05, ctx.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)
    osc2.start(ctx.currentTime)
    osc2.stop(ctx.currentTime + 1.2)
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

export function playKeyCollect() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(2200, ctx.currentTime + 0.15)
    osc2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.4)
    gain2.gain.setValueAtTime(0.05, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.45)
  } catch (e) {}
}

export function playDoorOpen() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(300, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.7)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sawtooth'
    osc2.frequency.setValueAtTime(80, ctx.currentTime)
    osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5)
    gain2.gain.setValueAtTime(0.03, ctx.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc2.start(ctx.currentTime)
    osc2.stop(ctx.currentTime + 0.6)
  } catch (e) {}
}

export function playSpikeHurt() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 3000
    filter.Q.value = 5
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(1200, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(55, ctx.currentTime)
    gain2.gain.setValueAtTime(0.06, ctx.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc2.start(ctx.currentTime)
    osc2.stop(ctx.currentTime + 0.12)
  } catch (e) {}
}

export function playWallBump() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 150
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(100 * (0.8 + Math.random() * 0.4), ctx.currentTime)
    gain.gain.setValueAtTime(0.05, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.06)
  } catch (e) {}
}

export function playJump() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  } catch (e) {}
}

export function playLanding(fallSpeed = 0) {
  try {
    const ctx = getCtx()
    const intensity = Math.min(1, Math.max(0.2, fallSpeed / 8))
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 100 + intensity * 100
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(60, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.04 * intensity, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
    if (intensity > 0.6) {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(30, ctx.currentTime)
      gain2.gain.setValueAtTime(0.03 * intensity, ctx.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
      osc2.start(ctx.currentTime)
      osc2.stop(ctx.currentTime + 0.1)
    }
  } catch (e) {}
}

export function playSlide() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(600, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch (e) {}
}

export function playDash() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.02)
    osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12)
    gain2.gain.setValueAtTime(0.04, ctx.currentTime + 0.02)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc2.start(ctx.currentTime + 0.02)
    osc2.stop(ctx.currentTime + 0.15)
  } catch (e) {}
}

export function playHeartbeat() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 80
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(40, ctx.currentTime)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
    // Second thump
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(35, ctx.currentTime + 0.15)
    gain2.gain.setValueAtTime(0.05, ctx.currentTime + 0.15)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc2.start(ctx.currentTime + 0.15)
    osc2.stop(ctx.currentTime + 0.25)
  } catch (e) {}
}

export function playPickup() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.06)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  } catch (e) {}
}

export function playSecret() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(523, ctx.currentTime)
    osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
    osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.45)
  } catch (e) {}
}

export function playAchievement() {
  try {
    const ctx = getCtx()
    const notes = [523, 659, 784, 1047, 784, 1047, 1319]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      const t = ctx.currentTime + i * 0.08
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0.08, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
      osc.start(t)
      osc.stop(t + 0.12)
    })
  } catch (e) {}
}

export function playChestOpen() {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(200, ctx.currentTime)
    osc.frequency.setValueAtTime(250, ctx.currentTime + 0.1)
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
    // Sparkle overlay
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.2)
    osc2.frequency.setValueAtTime(1600, ctx.currentTime + 0.3)
    osc2.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5)
    gain2.gain.setValueAtTime(0.05, ctx.currentTime + 0.2)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc2.start(ctx.currentTime + 0.2)
    osc2.stop(ctx.currentTime + 0.5)
  } catch (e) {}
}

export function playPotBreak() {
  try {
    const ctx = getCtx()
    // Noise burst
    const bufferSize = ctx.sampleRate * 0.1
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const gain = ctx.createGain()
    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 1000
    noise.connect(highpass)
    highpass.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 0.12)
    // Low thud
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.connect(g)
    g.connect(ctx.destination)
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(80, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.08)
    g.gain.setValueAtTime(0.06, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  } catch (e) {}
}

// ============ Multi-Theme Music System ============

let musicGain = null
let musicActive = false
let musicTimeoutIds = []
let musicThemeIndex = 0

export function startMusic() {
  try {
    const ctx = getCtx()
    stopMusic()
    musicActive = true
    musicThemeIndex = 0

    musicGain = ctx.createGain()
    musicGain.gain.setValueAtTime(0.025, ctx.currentTime)
    musicGain.connect(ctx.destination)

    function scheduleCycle() {
      if (!musicActive || !musicGain) return
      const themeKey = THEME_CYCLE[musicThemeIndex % THEME_CYCLE.length]
      const theme = THEMES[themeKey]
      scheduleTheme(theme, themeKey)
      musicThemeIndex++
      const tid = setTimeout(scheduleCycle, THEME_DURATION * 1000)
      musicTimeoutIds.push(tid)
    }

    function scheduleTheme(theme, themeKey) {
      const now = ctx.currentTime
      // Vary chord duration slightly per theme for variety
      const chordDur = themeKey === 'C' ? 2.0 : CHORD_DURATION

      for (let ci = 0; ci < 4; ci++) {
        const chordStart = now + ci * chordDur
        const chordFreqs = theme.chordFreqs[ci]
        const nVoices = chordFreqs.length

        // Chord pads
        chordFreqs.forEach((freq, ni) => {
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.connect(g)
          g.connect(musicGain)
          // Theme C uses brighter timbre
          if (themeKey === 'C') {
            osc.type = ni === 0 ? 'triangle' : 'sine'
          } else if (themeKey === 'B') {
            osc.type = ni === 0 ? 'sine' : 'triangle'
          } else {
            osc.type = ni === 0 ? 'sine' : 'triangle'
          }
          osc.frequency.setValueAtTime(freq, chordStart)
          g.gain.setValueAtTime(0.06 / nVoices, chordStart)
          g.gain.linearRampToValueAtTime(0, chordStart + chordDur - 0.1)
          osc.start(chordStart)
          osc.stop(chordStart + chordDur)
          osc.onended = () => { try { osc.disconnect(); g.disconnect() } catch(e) {} }
        })

        // Bass note — theme B uses deeper octave
        let bassFreq = theme.bassFreqs[ci]
        if (themeKey === 'B') bassFreq *= 0.5
        const bassOsc = ctx.createOscillator()
        const bassGain = ctx.createGain()
        bassOsc.connect(bassGain)
        bassGain.connect(musicGain)
        bassOsc.type = 'sine'
        bassOsc.frequency.setValueAtTime(bassFreq, chordStart)
        bassGain.gain.setValueAtTime(themeKey === 'B' ? 0.12 : 0.1, chordStart)
        bassGain.gain.linearRampToValueAtTime(0, chordStart + chordDur - 0.1)
        bassOsc.start(chordStart)
        bassOsc.stop(chordStart + chordDur)
        bassOsc.onended = () => { try { bassOsc.disconnect(); bassGain.disconnect() } catch(e) {} }

        // Melody arpeggio — theme C plays faster
        const melodyNotes = theme.melodyFreqs[ci]
        const noteDur = themeKey === 'C' ? MELODY_NOTE_DURATION * 0.75 : MELODY_NOTE_DURATION
        melodyNotes.forEach((freq, mi) => {
          const noteStart = chordStart + mi * noteDur
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.connect(g)
          g.connect(musicGain)
          osc.type = themeKey === 'B' ? 'triangle' : 'sine'
          osc.frequency.setValueAtTime(freq, noteStart)
          g.gain.setValueAtTime(0.07, noteStart)
          g.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur * 0.9)
          osc.start(noteStart)
          osc.stop(noteStart + noteDur)
          osc.onended = () => { try { osc.disconnect(); g.disconnect() } catch(e) {} }
        })
      }

      // Inter-theme transition pad (a quiet bridge at end of each theme)
      if (themeKey !== 'C') {
        const bridgeStart = now + THEME_DURATION - 0.5
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.connect(g)
        g.connect(musicGain)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(220, bridgeStart)
        osc.frequency.linearRampToValueAtTime(196, bridgeStart + 0.5)
        g.gain.setValueAtTime(0.01, bridgeStart)
        g.gain.linearRampToValueAtTime(0.02, bridgeStart + 0.25)
        g.gain.exponentialRampToValueAtTime(0.001, bridgeStart + 0.5)
        osc.start(bridgeStart)
        osc.stop(bridgeStart + 0.5)
        osc.onended = () => { try { osc.disconnect(); g.disconnect() } catch(e) {} }
      }
    }

    scheduleCycle()
  } catch (e) {}
}

export function stopMusic() {
  musicActive = false
  musicTimeoutIds.forEach((tid) => clearTimeout(tid))
  musicTimeoutIds = []
  if (musicGain) {
    try {
      musicGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.5)
    } catch (e) {}
    musicGain = null
  }
}

export function setMusicVolume(vol) {
  if (musicGain) {
    try {
      musicGain.gain.setValueAtTime(vol * 0.025, getCtx().currentTime)
    } catch (e) {}
  }
}

// ============ Ambient Cave Sounds ============

let ambientGain = null
let ambientActive = false
let ambientTimeoutIds = []
let ambientDripIds = []

export function startAmbient() {
  try {
    const ctx = getCtx()
    stopAmbient()
    ambientActive = true

    ambientGain = ctx.createGain()
    ambientGain.gain.setValueAtTime(0.03, ctx.currentTime)
    ambientGain.connect(ctx.destination)

    function createDrone() {
      if (!ambientActive || !ambientGain) return
      const now = ctx.currentTime
      const bufferSize = ctx.sampleRate * 2
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        lastOut = (lastOut + 0.02 * white) / 1.02
        data[i] = lastOut * 3
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      noise.loop = true
      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'bandpass'
      bandpass.frequency.value = 120 + Math.random() * 80
      bandpass.Q.value = 0.3
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 200
      const g = ctx.createGain()
      g.gain.value = 0.15 + Math.random() * 0.1
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.05 + Math.random() * 0.1
      lfoGain.gain.value = 0.04
      lfo.connect(lfoGain)
      lfoGain.connect(g.gain)
      lfo.start(now)
      lfo.stop(now + 30)
      noise.connect(bandpass)
      bandpass.connect(lowpass)
      lowpass.connect(g)
      g.connect(ambientGain)
      noise.start(now)
      noise.stop(now + 30)
      noise.onended = () => {
        try { noise.disconnect(); bandpass.disconnect(); lowpass.disconnect(); g.disconnect(); lfo.disconnect(); lfoGain.disconnect() } catch(e) {}
      }
      const tid = setTimeout(createDrone, 25000 + Math.random() * 10000)
      ambientTimeoutIds.push(tid)
    }

    function scheduleDrips() {
      if (!ambientActive || !ambientGain) return
      const now = ctx.currentTime
      const numDrips = 4 + Math.floor(Math.random() * 5)
      for (let i = 0; i < numDrips; i++) {
        const dripTime = now + Math.random() * 12
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        const delay = ctx.createDelay(0.3)
        delay.delayTime.value = 0.15 + Math.random() * 0.2
        const feedback = ctx.createGain()
        feedback.gain.value = 0.2
        const highpass = ctx.createBiquadFilter()
        highpass.type = 'highpass'
        highpass.frequency.value = 800
        osc.connect(g)
        g.connect(highpass)
        highpass.connect(ambientGain)
        highpass.connect(delay)
        delay.connect(feedback)
        feedback.connect(highpass)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1200 + Math.random() * 800, dripTime)
        osc.frequency.exponentialRampToValueAtTime(400 + Math.random() * 300, dripTime + 0.15)
        g.gain.setValueAtTime(0.0001, dripTime)
        g.gain.exponentialRampToValueAtTime(0.12 + Math.random() * 0.08, dripTime + 0.01)
        g.gain.exponentialRampToValueAtTime(0.001, dripTime + 0.3)
        osc.start(dripTime)
        osc.stop(dripTime + 0.35)
        const id = { osc, g, delay, feedback, highpass }
        ambientDripIds.push(id)
        osc.onended = () => {
          try { osc.disconnect(); g.disconnect(); delay.disconnect(); feedback.disconnect(); highpass.disconnect() } catch(e) {}
          const idx = ambientDripIds.indexOf(id)
          if (idx !== -1) ambientDripIds.splice(idx, 1)
        }
      }
      const tid = setTimeout(scheduleDrips, 10000 + Math.random() * 5000)
      ambientTimeoutIds.push(tid)
    }

    function scheduleRumbles() {
      if (!ambientActive || !ambientGain) return
      const now = ctx.currentTime
      const rumbleTime = now + Math.random() * 15
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 40 + Math.random() * 30
      osc.connect(lowpass)
      lowpass.connect(g)
      g.connect(ambientGain)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(20 + Math.random() * 25, rumbleTime)
      g.gain.setValueAtTime(0.0001, rumbleTime)
      g.gain.exponentialRampToValueAtTime(0.06 + Math.random() * 0.04, rumbleTime + 0.3)
      g.gain.exponentialRampToValueAtTime(0.001, rumbleTime + 2.0 + Math.random() * 1.5)
      osc.start(rumbleTime)
      osc.stop(rumbleTime + 2.5 + Math.random() * 2)
      osc.onended = () => { try { osc.disconnect(); lowpass.disconnect(); g.disconnect() } catch(e) {} }
      const tid = setTimeout(scheduleRumbles, 12000 + Math.random() * 18000)
      ambientTimeoutIds.push(tid)
    }

    createDrone()
    scheduleDrips()
    scheduleRumbles()
  } catch (e) {}
}

export function stopAmbient() {
  ambientActive = false
  ambientTimeoutIds.forEach((tid) => clearTimeout(tid))
  ambientTimeoutIds = []
  ambientDripIds.forEach(({ osc, g, delay, feedback, highpass }) => {
    try { osc.stop(); osc.disconnect() } catch(e) {}
    try { g.disconnect() } catch(e) {}
    try { delay.disconnect() } catch(e) {}
    try { feedback.disconnect() } catch(e) {}
    try { highpass.disconnect() } catch(e) {}
  })
  ambientDripIds = []
  if (ambientGain) {
    try {
      ambientGain.gain.exponentialRampToValueAtTime(0.001, getCtx().currentTime + 0.3)
    } catch (e) {}
    ambientGain = null
  }
}

export function setAmbientVolume(vol) {
  if (ambientGain) {
    try {
      ambientGain.gain.setValueAtTime(vol * 0.03, getCtx().currentTime)
    } catch (e) {}
  }
}

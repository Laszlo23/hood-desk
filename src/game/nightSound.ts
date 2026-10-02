type Chime = 'gold' | 'rare' | 'home' | 'caught' | 'chain' | 'best'

let audio: AudioContext | null = null

export function unlockNightSound() {
  const Ctx = window.AudioContext
  if (!Ctx) return
  if (!audio) audio = new Ctx()
  if (audio.state === 'suspended') void audio.resume()
}

function tone(freq: number, at: number, dur: number, type: OscillatorType, gain: number) {
  if (!audio) return
  const osc = audio.createOscillator()
  const amp = audio.createGain()
  const start = audio.currentTime + at
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  amp.gain.setValueAtTime(gain, start)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(amp)
  amp.connect(audio.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

export function playNightChime(kind: Chime) {
  unlockNightSound()
  if (!audio) return
  if (kind === 'gold') {
    tone(784, 0, 0.07, 'square', 0.07)
    tone(1174, 0.06, 0.09, 'square', 0.06)
    tone(1568, 0.12, 0.16, 'triangle', 0.05)
    return
  }
  if (kind === 'rare') {
    tone(1046, 0, 0.06, 'square', 0.06)
    tone(1318, 0.05, 0.07, 'square', 0.05)
    tone(1568, 0.1, 0.08, 'triangle', 0.05)
    tone(2093, 0.16, 0.22, 'triangle', 0.045)
    return
  }
  if (kind === 'chain') {
    tone(880, 0, 0.05, 'square', 0.06)
    tone(1174, 0.05, 0.06, 'square', 0.06)
    tone(1568, 0.1, 0.08, 'triangle', 0.05)
    tone(1975, 0.16, 0.18, 'triangle', 0.05)
    return
  }
  if (kind === 'home') {
    tone(523, 0, 0.12, 'square', 0.05)
    tone(659, 0.1, 0.12, 'square', 0.05)
    tone(784, 0.2, 0.14, 'square', 0.05)
    tone(1046, 0.3, 0.28, 'triangle', 0.06)
    return
  }
  if (kind === 'best') {
    tone(659, 0, 0.08, 'square', 0.06)
    tone(880, 0.08, 0.08, 'square', 0.06)
    tone(1174, 0.16, 0.1, 'square', 0.05)
    tone(1568, 0.26, 0.22, 'triangle', 0.06)
    tone(2093, 0.4, 0.3, 'triangle', 0.04)
    return
  }
  tone(146, 0, 0.2, 'sawtooth', 0.04)
  tone(92, 0.06, 0.26, 'square', 0.035)
}

export function useChime() {
  let audioCtx: AudioContext | null = null

  function getAudioContext(): AudioContext {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      audioCtx = new AudioCtx()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
    return audioCtx
  }

  // Play airport chime (Default 3-tone ding-dong: F#4 -> A4 -> C#5 or classic airport chime)
  function playAirportChime(type: 'dingdong' | 'airport3' = 'airport3'): Promise<void> {
    return new Promise((resolve) => {
      try {
        const ctx = getAudioContext()
        const now = ctx.currentTime

        if (type === 'airport3') {
          // Classic 3-note broadcast chime: G4 (392Hz) -> C5 (523.25Hz) -> E5 (659.25Hz)
          const notes = [
            { freq: 440, time: 0, duration: 0.45 },      // A4
            { freq: 554.37, time: 0.35, duration: 0.45 }, // C#5
            { freq: 659.25, time: 0.7, duration: 0.8 }   // E5
          ]

          notes.forEach(({ freq, time, duration }) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, now + time)

            gain.gain.setValueAtTime(0, now + time)
            gain.gain.linearRampToValueAtTime(0.35, now + time + 0.04)
            gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start(now + time)
            osc.stop(now + time + duration + 0.1)
          })

          setTimeout(resolve, 1500)
        } else {
          // Classic 2-tone Ding-Dong: C5 (523.25Hz) -> G4 (392Hz)
          const notes = [
            { freq: 587.33, time: 0, duration: 0.5 },    // D5
            { freq: 440, time: 0.4, duration: 0.8 }      // A4
          ]

          notes.forEach(({ freq, time, duration }) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, now + time)

            gain.gain.setValueAtTime(0, now + time)
            gain.gain.linearRampToValueAtTime(0.35, now + time + 0.04)
            gain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration)

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.start(now + time)
            osc.stop(now + time + duration + 0.1)
          })

          setTimeout(resolve, 1200)
        }
      } catch (err) {
        console.warn('AudioContext not available or error playing chime:', err)
        resolve()
      }
    })
  }

  return {
    playAirportChime
  }
}

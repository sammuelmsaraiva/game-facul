// ============================
// Chrome Rebel - Synthesized Audio (Web Audio API)
// ============================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "square",
  volume: number = 0.1,
  frequencyEnd?: number
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (frequencyEnd) {
      osc.frequency.linearRampToValueAtTime(frequencyEnd, ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported or blocked
  }
}

export function playShootSound() {
  playTone(800, 0.1, "square", 0.06, 400);
}

export function playEnemyShootSound() {
  playTone(300, 0.1, "sawtooth", 0.04, 150);
}

export function playJumpSound() {
  playTone(300, 0.15, "sine", 0.06, 600);
}

export function playHitSound() {
  playTone(200, 0.2, "sawtooth", 0.08, 80);
}

export function playEnemyDeathSound() {
  playTone(600, 0.15, "square", 0.07, 100);
  setTimeout(() => playTone(400, 0.1, "square", 0.05, 50), 80);
}

export function playCollectSound() {
  playTone(600, 0.1, "sine", 0.06, 900);
  setTimeout(() => playTone(900, 0.1, "sine", 0.05, 1200), 60);
}

export function playBossHitSound() {
  playTone(150, 0.3, "sawtooth", 0.08, 50);
}

export function playVictorySound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, "sine", 0.08), i * 150);
  });
}

export function playGameOverSound() {
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, "sawtooth", 0.06), i * 200);
  });
}

export function playMenuSelectSound() {
  playTone(500, 0.08, "square", 0.05, 700);
}

export function playBossPhaseSound() {
  playTone(100, 0.5, "sawtooth", 0.1, 300);
  setTimeout(() => playTone(200, 0.3, "square", 0.08, 500), 300);
}

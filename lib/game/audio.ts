// ============================
// Neon Escape - Synthesized Audio (Web Audio API)
// Volume separado: Música vs SFX
// ============================

import { loadSettings, saveSettings } from "./settings";

let audioCtx: AudioContext | null = null;
let sfxGainNode: GainNode | null = null;
let musicGainNode: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();

    // Criar gain nodes persistentes
    sfxGainNode = audioCtx.createGain();
    sfxGainNode.connect(audioCtx.destination);

    musicGainNode = audioCtx.createGain();
    musicGainNode.connect(audioCtx.destination);

    // Carregar volumes salvos
    const settings = loadSettings();
    sfxGainNode.gain.value = settings.sfxVolume / 100;
    musicGainNode.gain.value = settings.musicVolume / 100;
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function getSfxOutput(): GainNode {
  getAudioContext();
  return sfxGainNode!;
}

function getMusicOutput(): GainNode {
  getAudioContext();
  return musicGainNode!;
}

// ---------- Volume Controls ----------

export function setMusicVolume(value: number): void {
  const clamped = Math.max(0, Math.min(100, value));
  const settings = loadSettings();
  settings.musicVolume = clamped;
  saveSettings(settings);

  if (musicGainNode) {
    musicGainNode.gain.value = clamped / 100;
  }
}

export function setSfxVolume(value: number): void {
  const clamped = Math.max(0, Math.min(100, value));
  const settings = loadSettings();
  settings.sfxVolume = clamped;
  saveSettings(settings);

  if (sfxGainNode) {
    sfxGainNode.gain.value = clamped / 100;
  }
}

export function getMusicVolume(): number {
  return loadSettings().musicVolume;
}

export function getSfxVolumeValue(): number {
  return loadSettings().sfxVolume;
}

// ---------- SFX Tone Helper ----------

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
    gain.connect(getSfxOutput());

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported or blocked
  }
}

// ---------- SFX Functions ----------

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

// ============================
// Música de Fundo Synthwave
// ============================

let musicInterval: ReturnType<typeof setInterval> | null = null;
let musicPlaying = false;

// Progressão de notas synthwave em Dó menor (dark/tense)
const BASS_NOTES = [65.41, 73.42, 82.41, 77.78]; // C2, D2, E2, Eb2
const MELODY_NOTES = [
  [261.63, 311.13, 392.00], // Cm
  [293.66, 349.23, 440.00], // Dm
  [329.63, 392.00, 493.88], // Em
  [311.13, 369.99, 466.16], // Ebm
];

let musicStep = 0;

function playMusicStep() {
  try {
    const ctx = getAudioContext();
    const musicOut = getMusicOutput();
    const now = ctx.currentTime;
    const stepDuration = 0.4;

    const chordIndex = Math.floor(musicStep / 4) % BASS_NOTES.length;

    // Bass line — sawtooth grave
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    const bassFilter = ctx.createBiquadFilter();
    bassOsc.type = "sawtooth";
    bassOsc.frequency.setValueAtTime(BASS_NOTES[chordIndex], now);
    bassFilter.type = "lowpass";
    bassFilter.frequency.setValueAtTime(200, now);
    bassGain.gain.setValueAtTime(0.04, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration);
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(musicOut);
    bassOsc.start(now);
    bassOsc.stop(now + stepDuration);

    // Kick no tempo forte (a cada 4 steps)
    if (musicStep % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = "sine";
      kickOsc.frequency.setValueAtTime(150, now);
      kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      kickGain.gain.setValueAtTime(0.06, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      kickOsc.connect(kickGain);
      kickGain.connect(musicOut);
      kickOsc.start(now);
      kickOsc.stop(now + 0.15);
    }

    // Hi-hat nos offbeats
    if (musicStep % 2 === 1) {
      const noiseLen = 0.05;
      const bufferSize = ctx.sampleRate * noiseLen;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const hihatGain = ctx.createGain();
      const hihatFilter = ctx.createBiquadFilter();
      hihatFilter.type = "highpass";
      hihatFilter.frequency.setValueAtTime(8000, now);
      hihatGain.gain.setValueAtTime(0.02, now);
      hihatGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
      noise.connect(hihatFilter);
      hihatFilter.connect(hihatGain);
      hihatGain.connect(musicOut);
      noise.start(now);
    }

    // Arpejo melódico (nota a cada step)
    const chord = MELODY_NOTES[chordIndex];
    const noteIndex = musicStep % chord.length;
    const melodyOsc = ctx.createOscillator();
    const melodyGain = ctx.createGain();
    const melodyFilter = ctx.createBiquadFilter();
    melodyOsc.type = "square";
    melodyOsc.frequency.setValueAtTime(chord[noteIndex], now);
    melodyFilter.type = "lowpass";
    melodyFilter.frequency.setValueAtTime(1500, now);
    melodyFilter.frequency.exponentialRampToValueAtTime(400, now + stepDuration * 0.8);
    melodyGain.gain.setValueAtTime(0.02, now);
    melodyGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.8);
    melodyOsc.connect(melodyFilter);
    melodyFilter.connect(melodyGain);
    melodyGain.connect(musicOut);
    melodyOsc.start(now);
    melodyOsc.stop(now + stepDuration * 0.8);

    musicStep++;
  } catch {
    // Audio not available
  }
}

export function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  musicStep = 0;
  // 150 BPM → 400ms per beat, subdividido em steps de 200ms
  musicInterval = setInterval(playMusicStep, 200);
}

export function stopMusic() {
  if (!musicPlaying) return;
  musicPlaying = false;
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

export function isMusicPlaying(): boolean {
  return musicPlaying;
}

// ============================
// Neon Escape - Synthesized Audio (Web Audio API)
// Volume separado: Música vs SFX
// ============================

import { loadSettings, saveSettings } from "./settings";

let audioCtx: AudioContext | null = null;
let sfxGainNode: GainNode | null = null;
let musicGainNode: GainNode | null = null;
let hihatBuffer: AudioBuffer | null = null; // cache do buffer de ruído para hi-hat

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
  frequencyEnd?: number,
  varyPitch: boolean = true
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Variação aleatória de pitch ±6% — evita fadiga sonora ao repetir o mesmo SFX
    const pitchMul = varyPitch ? 1 + (Math.random() - 0.5) * 0.12 : 1;
    const f0 = frequency * pitchMul;
    const f1 = frequencyEnd ? frequencyEnd * pitchMul : undefined;

    osc.type = type;
    osc.frequency.setValueAtTime(f0, ctx.currentTime);
    if (f1) {
      osc.frequency.linearRampToValueAtTime(f1, ctx.currentTime + duration);
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
// Música de Fundo Synthwave (3 trilhas por fase)
// ============================

let musicInterval: ReturnType<typeof setInterval> | null = null;
let musicPlaying = false;
// 0 = menu (calmo), 1-3 = fases do jogo (intensidade crescente)
type MusicTrack = 0 | 1 | 2 | 3;
let currentMusicPhase: MusicTrack = 1;

// Progressões em Dó menor — variam por fase
const BASS_NOTES_P1 = [65.41, 73.42, 82.41, 77.78];   // C2, D2, E2, Eb2 — calmo
const BASS_NOTES_P2 = [65.41, 77.78, 82.41, 92.50];   // C2, Eb2, E2, F#2 — tenso
const BASS_NOTES_P3 = [65.41, 87.31, 82.41, 77.78];   // C2, F2, E2, Eb2 — agressivo

const MELODY_P1 = [
  [261.63, 311.13, 392.00], // Cm
  [293.66, 349.23, 440.00], // Dm
  [329.63, 392.00, 493.88], // Em
  [311.13, 369.99, 466.16], // Ebm
];
const MELODY_P2 = [
  [261.63, 311.13, 392.00, 466.16], // Cm9-ish
  [311.13, 369.99, 466.16, 554.37], // Eb
  [329.63, 392.00, 493.88, 587.33], // Em
  [349.23, 415.30, 523.25, 622.25], // F
];
const MELODY_P3 = [
  [523.25, 622.25, 783.99], // C5 oitava acima — agressivo
  [587.33, 698.46, 880.00],
  [659.25, 783.99, 987.77],
  [622.25, 739.99, 932.33],
];

let musicStep = 0;

function playMusicStep() {
  try {
    const ctx = getAudioContext();
    const musicOut = getMusicOutput();
    const now = ctx.currentTime;
    const phase = currentMusicPhase;

    // === MENU (phase 0): trilha CALMA com pad sustentado + bass leve ===
    // Sem percussão, sem arpejos rápidos. Atmosfera de "lounge cyberpunk".
    if (phase === 0) {
      const stepDuration = 0.75;
      const menuBass = [55.00, 65.41, 73.42, 65.41]; // A1, C2, D2, C2 — voicings amplos
      const menuChords = [
        [110.00, 164.81, 246.94], // Am9-ish
        [130.81, 196.00, 261.63], // Cmaj
        [146.83, 220.00, 293.66], // Dm
        [130.81, 196.00, 261.63], // Cmaj
      ];
      const chordIdx = Math.floor(musicStep / 2) % menuBass.length;

      // Bass profundo e sustentado
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      const bassFilter = ctx.createBiquadFilter();
      bassOsc.type = "triangle";
      bassOsc.frequency.setValueAtTime(menuBass[chordIdx], now);
      bassFilter.type = "lowpass";
      bassFilter.frequency.setValueAtTime(220, now);
      bassGain.gain.setValueAtTime(0, now);
      bassGain.gain.linearRampToValueAtTime(0.04, now + 0.15);
      bassGain.gain.linearRampToValueAtTime(0.025, now + stepDuration * 0.7);
      bassGain.gain.linearRampToValueAtTime(0.001, now + stepDuration);
      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(musicOut);
      bassOsc.start(now);
      bassOsc.stop(now + stepDuration);

      // Pad atmosférico de 3 notas com leve detune
      const chord = menuChords[chordIdx];
      for (const freq of chord) {
        const padOsc = ctx.createOscillator();
        const padOsc2 = ctx.createOscillator();
        const padGain = ctx.createGain();
        const padFilter = ctx.createBiquadFilter();
        padOsc.type = "sawtooth";
        padOsc2.type = "sawtooth";
        padOsc.frequency.setValueAtTime(freq, now);
        padOsc2.frequency.setValueAtTime(freq * 1.006, now); // detune sutil
        padFilter.type = "lowpass";
        padFilter.frequency.setValueAtTime(900, now);
        padFilter.Q.setValueAtTime(0.7, now);
        padGain.gain.setValueAtTime(0, now);
        padGain.gain.linearRampToValueAtTime(0.012, now + stepDuration * 0.4);
        padGain.gain.linearRampToValueAtTime(0.001, now + stepDuration);
        padOsc.connect(padFilter);
        padOsc2.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(musicOut);
        padOsc.start(now);
        padOsc2.start(now);
        padOsc.stop(now + stepDuration);
        padOsc2.stop(now + stepDuration);
      }

      // Lead esparso (apenas a cada 4 steps) com pluck
      if (musicStep % 4 === 0) {
        const leadOsc = ctx.createOscillator();
        const leadGain = ctx.createGain();
        const leadFilter = ctx.createBiquadFilter();
        leadOsc.type = "sine";
        leadOsc.frequency.setValueAtTime(chord[2] * 2, now); // oitava acima
        leadFilter.type = "lowpass";
        leadFilter.frequency.setValueAtTime(2000, now);
        leadGain.gain.setValueAtTime(0.025, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.5);
        leadOsc.connect(leadFilter);
        leadFilter.connect(leadGain);
        leadGain.connect(musicOut);
        leadOsc.start(now);
        leadOsc.stop(now + stepDuration * 1.5);
      }

      musicStep++;
      return;
    }

    // === GAME (phase 1-3): trilha agitada já implementada ===

    // Step duration por fase: mais rápido em fases avançadas
    const stepDuration = phase === 3 ? 0.30 : phase === 2 ? 0.36 : 0.40;
    const bassNotes = phase === 3 ? BASS_NOTES_P3 : phase === 2 ? BASS_NOTES_P2 : BASS_NOTES_P1;
    const melodyNotes = phase === 3 ? MELODY_P3 : phase === 2 ? MELODY_P2 : MELODY_P1;

    const chordIndex = Math.floor(musicStep / 4) % bassNotes.length;

    // === Bass line ===
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    const bassFilter = ctx.createBiquadFilter();
    bassOsc.type = "sawtooth";
    bassOsc.frequency.setValueAtTime(bassNotes[chordIndex], now);
    bassFilter.type = "lowpass";
    bassFilter.frequency.setValueAtTime(phase === 3 ? 280 : 200, now);
    bassGain.gain.setValueAtTime(phase === 3 ? 0.055 : 0.04, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration);
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(musicOut);
    bassOsc.start(now);
    bassOsc.stop(now + stepDuration);

    // === Kick no tempo forte ===
    if (musicStep % 4 === 0) {
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.type = "sine";
      kickOsc.frequency.setValueAtTime(phase === 3 ? 180 : 150, now);
      kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      kickGain.gain.setValueAtTime(phase === 3 ? 0.085 : 0.06, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      kickOsc.connect(kickGain);
      kickGain.connect(musicOut);
      kickOsc.start(now);
      kickOsc.stop(now + 0.15);
    }

    // === Snare nos backbeats (apenas fase 2 e 3) ===
    if (phase >= 2 && (musicStep % 4 === 2)) {
      const noiseLen = 0.10;
      if (!hihatBuffer) {
        const bufferSize = Math.floor(ctx.sampleRate * 0.05);
        hihatBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = hihatBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = hihatBuffer;
      noise.loop = true;
      const snareGain = ctx.createGain();
      const snareFilter = ctx.createBiquadFilter();
      snareFilter.type = "bandpass";
      snareFilter.frequency.setValueAtTime(2000, now);
      snareFilter.Q.setValueAtTime(2, now);
      snareGain.gain.setValueAtTime(phase === 3 ? 0.045 : 0.03, now);
      snareGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
      noise.connect(snareFilter);
      snareFilter.connect(snareGain);
      snareGain.connect(musicOut);
      noise.start(now);
      noise.stop(now + noiseLen);
    }

    // === Hi-hat nos offbeats ===
    if (musicStep % 2 === 1) {
      const noiseLen = 0.05;
      if (!hihatBuffer) {
        const bufferSize = Math.floor(ctx.sampleRate * noiseLen);
        hihatBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = hihatBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = hihatBuffer;
      const hihatGain = ctx.createGain();
      const hihatFilter = ctx.createBiquadFilter();
      hihatFilter.type = "highpass";
      hihatFilter.frequency.setValueAtTime(8000, now);
      hihatGain.gain.setValueAtTime(phase === 3 ? 0.028 : 0.02, now);
      hihatGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);
      noise.connect(hihatFilter);
      hihatFilter.connect(hihatGain);
      hihatGain.connect(musicOut);
      noise.start(now);
    }

    // === Arpejo melódico ===
    const chord = melodyNotes[chordIndex];
    const noteIndex = musicStep % chord.length;
    const melodyOsc = ctx.createOscillator();
    const melodyGain = ctx.createGain();
    const melodyFilter = ctx.createBiquadFilter();
    melodyOsc.type = phase === 3 ? "sawtooth" : "square";
    melodyOsc.frequency.setValueAtTime(chord[noteIndex], now);
    melodyFilter.type = "lowpass";
    melodyFilter.frequency.setValueAtTime(phase === 3 ? 2400 : 1500, now);
    melodyFilter.frequency.exponentialRampToValueAtTime(400, now + stepDuration * 0.8);
    melodyGain.gain.setValueAtTime(phase === 3 ? 0.025 : 0.02, now);
    melodyGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.8);
    melodyOsc.connect(melodyFilter);
    melodyFilter.connect(melodyGain);
    melodyGain.connect(musicOut);
    melodyOsc.start(now);
    melodyOsc.stop(now + stepDuration * 0.8);

    // === Pad sustentado (fase 2 e 3) — atmosfera densa ===
    if (phase >= 2 && musicStep % 4 === 0) {
      const padDuration = stepDuration * 4;
      const padOsc = ctx.createOscillator();
      const padOsc2 = ctx.createOscillator();
      const padGain = ctx.createGain();
      const padFilter = ctx.createBiquadFilter();
      padOsc.type = "sawtooth";
      padOsc2.type = "sawtooth";
      padOsc.frequency.setValueAtTime(bassNotes[chordIndex] * 4, now); // 2 oitavas acima
      padOsc2.frequency.setValueAtTime(bassNotes[chordIndex] * 4 * 1.005, now); // detune
      padFilter.type = "lowpass";
      padFilter.frequency.setValueAtTime(800, now);
      padGain.gain.setValueAtTime(0, now);
      padGain.gain.linearRampToValueAtTime(0.018, now + padDuration * 0.3);
      padGain.gain.linearRampToValueAtTime(0, now + padDuration);
      padOsc.connect(padFilter);
      padOsc2.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(musicOut);
      padOsc.start(now);
      padOsc2.start(now);
      padOsc.stop(now + padDuration);
      padOsc2.stop(now + padDuration);
    }

    // === Lead arp rápido (apenas fase 3 — boss) ===
    if (phase === 3 && musicStep % 2 === 0) {
      const leadOsc = ctx.createOscillator();
      const leadGain = ctx.createGain();
      const leadFilter = ctx.createBiquadFilter();
      const leadIdx = (musicStep + 1) % chord.length;
      leadOsc.type = "triangle";
      leadOsc.frequency.setValueAtTime(chord[leadIdx] * 2, now); // 1 oitava acima
      leadFilter.type = "lowpass";
      leadFilter.frequency.setValueAtTime(3000, now);
      leadGain.gain.setValueAtTime(0.018, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.5);
      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(musicOut);
      leadOsc.start(now);
      leadOsc.stop(now + stepDuration * 0.5);
    }

    musicStep++;
  } catch {
    // Audio not available
  }
}

export function startMusic(phase: MusicTrack = 1) {
  if (musicPlaying && currentMusicPhase === phase) return;
  // Se já tocando outra fase, troca sem reiniciar contador
  if (musicPlaying) {
    if (musicInterval) clearInterval(musicInterval);
  } else {
    musicStep = 0;
  }
  musicPlaying = true;
  currentMusicPhase = phase;
  // BPM por fase: 0=80 (menu calmo) / 1=150 / 2=167 / 3=200
  const stepInterval =
    phase === 0 ? 750
    : phase === 3 ? 150
    : phase === 2 ? 180
    : 200;
  musicInterval = setInterval(playMusicStep, stepInterval);
}

// Helper de conveniência — inicia a trilha calma do menu
export function startMenuMusic() {
  startMusic(0);
}

export function stopMusic() {
  if (!musicPlaying) return;
  musicPlaying = false;
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  // Resetar cache do hi-hat — será recriado se AudioContext mudar
  hihatBuffer = null;
}

export function isMusicPlaying(): boolean {
  return musicPlaying;
}

// ============================
// Neon Escape - Settings (persistente via localStorage)
// ============================

// Ações do jogo que podem ser remapeadas
export type GameAction = "left" | "right" | "jump" | "down" | "shoot" | "pause";

// Cada ação tem até 2 teclas (primária + secundária)
export type KeyBindings = Record<GameAction, [string, string | null]>;

export interface GameSettings {
  keyBindings: KeyBindings;
  musicVolume: number; // 0-100
  sfxVolume: number;   // 0-100
  playerSpeedMultiplier: number; // 50-200 (porcentagem) — afeta velocidade horizontal do personagem
  crtEffect: boolean; // overlay CRT (scanlines + vignette)
  screenShakeEnabled: boolean; // permite desligar shake (motion sickness)
  showFps: boolean; // mostra contador de FPS no canto superior esquerdo
}

const STORAGE_KEY = "neon-escape-settings";

// Nomes legíveis para exibição de teclas
const KEY_DISPLAY_NAMES: Record<string, string> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Space: "ESPACO",
  Escape: "ESC",
  Enter: "ENTER",
  ShiftLeft: "SHIFT",
  ShiftRight: "SHIFT",
  ControlLeft: "CTRL",
  ControlRight: "CTRL",
  AltLeft: "ALT",
  AltRight: "ALT",
  Backspace: "BACKSPACE",
  Tab: "TAB",
};

export function getKeyDisplayName(code: string): string {
  if (KEY_DISPLAY_NAMES[code]) return KEY_DISPLAY_NAMES[code];
  // "KeyA" → "A", "Digit1" → "1"
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code.toUpperCase();
}

export function getDefaultSettings(): GameSettings {
  return {
    keyBindings: {
      left:  ["KeyA", "ArrowLeft"],
      right: ["KeyD", "ArrowRight"],
      jump:  ["KeyW", "Space"],
      down:  ["KeyS", "ArrowDown"],
      shoot: ["KeyJ", null],
      pause: ["Escape", null],
    },
    musicVolume: 70,
    sfxVolume: 80,
    playerSpeedMultiplier: 100,
    crtEffect: true,
    screenShakeEnabled: true,
    showFps: false,
  };
}

// Helper: retorna a velocidade do jogador aplicando o multiplicador das configurações
export function getPlayerSpeedMultiplier(): number {
  const s = loadSettings();
  // clamp por segurança caso settings antigos venham fora do range
  return Math.max(0.5, Math.min(2.0, s.playerSpeedMultiplier / 100));
}

let cachedSettings: GameSettings | null = null;

export function loadSettings(): GameSettings {
  if (cachedSettings) return cachedSettings;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      const defaults = getDefaultSettings();

      // Merge com defaults para garantir que novas ações não fiquem undefined
      cachedSettings = {
        keyBindings: { ...defaults.keyBindings, ...(parsed.keyBindings || {}) },
        musicVolume: parsed.musicVolume ?? defaults.musicVolume,
        sfxVolume: parsed.sfxVolume ?? defaults.sfxVolume,
        playerSpeedMultiplier: parsed.playerSpeedMultiplier ?? defaults.playerSpeedMultiplier,
        crtEffect: parsed.crtEffect ?? defaults.crtEffect,
        screenShakeEnabled: parsed.screenShakeEnabled ?? defaults.screenShakeEnabled,
        showFps: parsed.showFps ?? defaults.showFps,
      };
      return cachedSettings;
    }
  } catch {
    // localStorage indisponível ou corrompido
  }

  cachedSettings = getDefaultSettings();
  return cachedSettings;
}

export function saveSettings(settings: GameSettings): void {
  cachedSettings = settings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage cheio ou indisponível
  }
}

export function resetSettings(): GameSettings {
  const defaults = getDefaultSettings();
  saveSettings(defaults);
  return defaults;
}

// Verifica se uma tecla já está mapeada para outra ação
export function isKeyConflict(
  bindings: KeyBindings,
  action: GameAction,
  keyCode: string
): GameAction | null {
  for (const [act, keys] of Object.entries(bindings) as [GameAction, [string, string | null]][]) {
    if (act === action) continue;
    if (keys[0] === keyCode || keys[1] === keyCode) return act;
  }
  return null;
}

// Nomes das ações para exibição na UI
export const ACTION_LABELS: Record<GameAction, string> = {
  left: "Mover Esquerda",
  right: "Mover Direita",
  jump: "Pular",
  down: "Descer Plataforma",
  shoot: "Atirar",
  pause: "Pausar",
};

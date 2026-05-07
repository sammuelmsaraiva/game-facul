// ============================
// Neon Escape - Input Manager (keybindings configuráveis)
// ============================

import type { InputState } from "./types";
import { loadSettings } from "./settings";
import type { GameAction } from "./settings";

export function createInputState(): InputState {
  return {
    left: false,
    right: false,
    jump: false,
    down: false,
    shoot: false,
    pause: false,
    jumpPressed: false,
    shootPressed: false,
    pausePressed: false,
    unpausePressed: false,
    confirmPressed: false,
    leftPressed: false,
    rightPressed: false,
    clickPressed: false,
    cheatTogglePressed: false,
    cheatHealPressed: false,
    cheatSkipPressed: false,
    cheatAmmoPressed: false,
  };
}

// Constrói mapa reverso: keyCode → action, a partir dos bindings atuais
function buildKeyMap(): Record<string, GameAction> {
  const settings = loadSettings();
  const map: Record<string, GameAction> = {};

  for (const [action, keys] of Object.entries(settings.keyBindings) as [GameAction, [string, string | null]][]) {
    if (keys[0]) map[keys[0]] = action;
    if (keys[1]) map[keys[1]] = action;
  }

  return map;
}

// Mapa atualizado no setupInput e quando settings mudam
let currentKeyMap: Record<string, GameAction> = buildKeyMap();

// Chamado pela tela de configurações quando keybindings mudam
export function refreshKeyMap(): void {
  currentKeyMap = buildKeyMap();
}

const pressedKeys = new Set<string>();

export function setupInput(input: InputState): () => void {
  // Atualizar mapa ao iniciar (pega keybindings atuais)
  currentKeyMap = buildKeyMap();

  const onKeyDown = (e: KeyboardEvent) => {
    // P = despausar apenas se não estiver remapeado para outra ação
    if (e.code === "KeyP" && !currentKeyMap["KeyP"]) {
      e.preventDefault();
      if (!pressedKeys.has(e.code)) {
        pressedKeys.add(e.code);
        input.unpausePressed = true;
      }
      return;
    }

    // Enter = confirmar (apenas Enter, sem Space, para evitar confirmação acidental
    // ao usar Space como pulo durante telas de upgrade entre fases)
    if (e.code === "Enter" || e.code === "NumpadEnter") {
      if (!pressedKeys.has(e.code)) {
        pressedKeys.add(e.code);
        input.confirmPressed = true;
      }
    }

    // === Cheats de desenvolvedor (frame único) ===
    // Insert: liga/desliga God Mode (invencibilidade)
    if (e.code === "Insert" && !pressedKeys.has(e.code)) {
      e.preventDefault();
      pressedKeys.add(e.code);
      input.cheatTogglePressed = true;
    }
    // PageUp: vida cheia
    if (e.code === "PageUp" && !pressedKeys.has(e.code)) {
      e.preventDefault();
      pressedKeys.add(e.code);
      input.cheatHealPressed = true;
    }
    // PageDown: pular para fim da fase
    if (e.code === "PageDown" && !pressedKeys.has(e.code)) {
      e.preventDefault();
      pressedKeys.add(e.code);
      input.cheatSkipPressed = true;
    }
    // Home: +50 munição
    if (e.code === "Home" && !pressedKeys.has(e.code)) {
      e.preventDefault();
      pressedKeys.add(e.code);
      input.cheatAmmoPressed = true;
    }

    // Setas direcionais para navegação em menus (independente de keybinding de movimento)
    if (e.code === "ArrowLeft") {
      if (!pressedKeys.has(e.code)) {
        pressedKeys.add(e.code);
        input.leftPressed = true;
      }
    }
    if (e.code === "ArrowRight") {
      if (!pressedKeys.has(e.code)) {
        pressedKeys.add(e.code);
        input.rightPressed = true;
      }
    }

    const action = currentKeyMap[e.code];
    if (action) {
      e.preventDefault();
      if (!pressedKeys.has(e.code)) {
        pressedKeys.add(e.code);
        if (action === "jump") input.jumpPressed = true;
        if (action === "shoot") input.shootPressed = true;
        if (action === "pause") input.pausePressed = true;
      }
      input[action] = true;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === "KeyP" && !currentKeyMap["KeyP"]) {
      e.preventDefault();
      pressedKeys.delete(e.code);
      return;
    }
    if (e.code === "Enter" || e.code === "NumpadEnter" ||
        e.code === "ArrowLeft" || e.code === "ArrowRight" ||
        e.code === "Insert" || e.code === "PageUp" ||
        e.code === "PageDown" || e.code === "Home") {
      pressedKeys.delete(e.code);
    }
    const action = currentKeyMap[e.code];
    if (action) {
      e.preventDefault();
      pressedKeys.delete(e.code);
      input[action] = false;
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      input.shoot = true;
      input.shootPressed = true;
      input.clickPressed = true; // usado como confirmação em telas de menu/upgrade
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      input.shoot = false;
    }
  };

  const onBlur = () => {
    input.left = false;
    input.right = false;
    input.jump = false;
    input.down = false;
    input.shoot = false;
    input.pause = false;
    pressedKeys.clear();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("blur", onBlur);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
    window.removeEventListener("blur", onBlur);
    pressedKeys.clear();
  };
}

export function consumePressed(input: InputState) {
  input.jumpPressed = false;
  input.shootPressed = false;
  input.pausePressed = false;
  input.unpausePressed = false;
  input.confirmPressed = false;
  input.leftPressed = false;
  input.rightPressed = false;
  input.clickPressed = false;
  input.cheatTogglePressed = false;
  input.cheatHealPressed = false;
  input.cheatSkipPressed = false;
  input.cheatAmmoPressed = false;
}

export function resetInput(input: InputState) {
  input.left = false;
  input.right = false;
  input.jump = false;
  input.down = false;
  input.shoot = false;
  input.pause = false;
  input.jumpPressed = false;
  input.shootPressed = false;
  input.pausePressed = false;
  input.unpausePressed = false;
  input.confirmPressed = false;
  input.leftPressed = false;
  input.rightPressed = false;
  input.clickPressed = false;
  input.cheatTogglePressed = false;
  input.cheatHealPressed = false;
  input.cheatSkipPressed = false;
  input.cheatAmmoPressed = false;
  pressedKeys.clear();
}

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
    // P = despausar (tecla fixa, não remapeável)
    if (e.code === "KeyP") {
      e.preventDefault();
      if (!pressedKeys.has(e.code)) {
        pressedKeys.add(e.code);
        input.unpausePressed = true;
      }
      return;
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
    if (e.code === "KeyP") {
      e.preventDefault();
      pressedKeys.delete(e.code);
      return;
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
  pressedKeys.clear();
}

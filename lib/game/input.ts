// ============================
// Neon Escape - Input Manager
// ============================

import type { InputState } from "./types";

export function createInputState(): InputState {
  return {
    left: false,
    right: false,
    jump: false,
    shoot: false,
    pause: false,
    jumpPressed: false,
    shootPressed: false,
    pausePressed: false,
  };
}

const keyMap: Record<string, keyof InputState> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "jump",
  KeyA: "left",
  KeyD: "right",
  KeyW: "jump",
  Space: "jump",
  KeyJ: "shoot",
  Escape: "pause",
  KeyP: "pause",
};

const pressedKeys = new Set<string>();

export function setupInput(input: InputState): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    const action = keyMap[e.code];
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
    const action = keyMap[e.code];
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
}

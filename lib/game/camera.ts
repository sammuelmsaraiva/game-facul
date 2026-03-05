// ============================
// Chrome Rebel - Camera System
// ============================

import type { Camera, Player, GameState } from "./types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CAMERA_LERP,
  CAMERA_OFFSET_X,
} from "./constants";

export function createCamera(): Camera {
  return {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    shakeIntensity: 0,
    shakeTimer: 0,
  };
}

export function updateCamera(camera: Camera, player: Player, state: GameState) {
  // Target follows the player with offset
  camera.targetX = player.x - CAMERA_OFFSET_X;
  camera.targetY = 0; // Fixed vertical camera

  // Smooth interpolation
  camera.x += (camera.targetX - camera.x) * CAMERA_LERP;
  camera.y += (camera.targetY - camera.y) * CAMERA_LERP;

  // Clamp to level bounds
  if (camera.x < 0) camera.x = 0;
  const maxX = state.level.totalWidth - CANVAS_WIDTH;
  if (camera.x > maxX) camera.x = maxX;

  // Boss arena lock
  const bossSection = state.level.sections.boss;
  if (player.x >= bossSection.startX) {
    camera.x = bossSection.startX;
  }

  // Screen shake
  if (camera.shakeTimer > 0) {
    camera.shakeTimer--;
    camera.shakeIntensity *= 0.9;
  } else {
    camera.shakeIntensity = 0;
  }
}

export function shakeCamera(camera: Camera, intensity: number, duration: number) {
  camera.shakeIntensity = intensity;
  camera.shakeTimer = duration;
}

export function getCameraShakeOffset(camera: Camera): { sx: number; sy: number } {
  if (camera.shakeTimer <= 0) return { sx: 0, sy: 0 };
  return {
    sx: (Math.random() - 0.5) * camera.shakeIntensity * 2,
    sy: (Math.random() - 0.5) * camera.shakeIntensity * 2,
  };
}

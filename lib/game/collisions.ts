// ============================
// Neon Escape - Collision Detection (AABB)
// ============================

import type { Rect } from "./types";

export function aabb(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Check if player is standing on top of a platform
 */
export function isLandingOnTop(
  playerRect: Rect,
  platformRect: Rect,
  playerVY: number
): boolean {
  if (playerVY < 0) return false; // Moving upward

  const playerBottom = playerRect.y + playerRect.height;
  const platformTop = platformRect.y;
  const previousBottom = playerBottom - playerVY;

  // Tolerância proporcional à velocidade vertical para plataformas móveis rápidas
  const tolerance = Math.max(4, Math.abs(playerVY) + 1);

  // Was above the platform last frame and now overlapping
  return (
    previousBottom <= platformTop + tolerance &&
    playerBottom >= platformTop &&
    playerRect.x + playerRect.width > platformRect.x &&
    playerRect.x < platformRect.x + platformRect.width
  );
}


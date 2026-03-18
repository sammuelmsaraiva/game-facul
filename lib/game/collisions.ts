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

export function rectOverlap(
  a: Rect,
  b: Rect
): { overlapX: number; overlapY: number; fromLeft: boolean; fromTop: boolean } | null {
  const overlapLeft = a.x + a.width - b.x;
  const overlapRight = b.x + b.width - a.x;
  const overlapTop = a.y + a.height - b.y;
  const overlapBottom = b.y + b.height - a.y;

  if (overlapLeft <= 0 || overlapRight <= 0 || overlapTop <= 0 || overlapBottom <= 0) {
    return null;
  }

  const overlapX = overlapLeft < overlapRight ? overlapLeft : -overlapRight;
  const overlapY = overlapTop < overlapBottom ? overlapTop : -overlapBottom;

  return {
    overlapX,
    overlapY,
    fromLeft: overlapLeft < overlapRight,
    fromTop: overlapTop < overlapBottom,
  };
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

export function pointInRect(px: number, py: number, rect: Rect): boolean {
  return (
    px >= rect.x &&
    px <= rect.x + rect.width &&
    py >= rect.y &&
    py <= rect.y + rect.height
  );
}

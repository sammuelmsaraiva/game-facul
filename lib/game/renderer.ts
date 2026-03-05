// ============================
// Chrome Rebel - Renderer (Canvas 2D)
// ============================

import type { GameState, Player, Enemy, Platform, Projectile, Collectible, BackgroundBuilding } from "./types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  COLORS,
} from "./constants";
import { getCameraShakeOffset } from "./camera";
import { renderParticles } from "./particles";

// ---------- Main Render ----------
export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const { sx, sy } = getCameraShakeOffset(state.camera);
  const camX = state.camera.x + sx;
  const camY = state.camera.y + sy;

  ctx.save();

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, COLORS.backgroundGradientTop);
  grad.addColorStop(1, COLORS.backgroundGradientBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Background buildings (parallax)
  renderBackground(ctx, state.backgroundBuildings, camX, camY, state.time);

  // Platforms
  for (const platform of state.platforms) {
    renderPlatform(ctx, platform, camX, camY);
  }

  // Collectibles
  for (const col of state.collectibles) {
    if (!col.collected) {
      renderCollectible(ctx, col, camX, camY, state.time);
    }
  }

  // Enemies
  for (const enemy of state.enemies) {
    if (enemy.alive) {
      renderEnemy(ctx, enemy, camX, camY, state.time);
    }
  }

  // Projectiles
  for (const proj of state.projectiles) {
    if (proj.alive) {
      renderProjectile(ctx, proj, camX, camY);
    }
  }

  // Player
  if (state.player.alive) {
    renderPlayer(ctx, state.player, camX, camY, state.time);
  }

  // Particles
  renderParticles(ctx, state.particles, camX, camY);

  // HUD (drawn last, no camera offset)
  renderHUD(ctx, state);

  // Pause overlay
  if (state.screen === "paused") {
    renderPauseOverlay(ctx);
  }

  ctx.restore();
}

// ---------- Background ----------
function renderBackground(
  ctx: CanvasRenderingContext2D,
  buildings: BackgroundBuilding[],
  camX: number,
  _camY: number,
  time: number
) {
  const parallax = 0.3;
  for (const b of buildings) {
    const screenX = b.x - camX * parallax;
    if (screenX + b.width < -50 || screenX > CANVAS_WIDTH + 50) continue;

    const buildingY = GROUND_Y - b.height;
    ctx.fillStyle = b.color;
    ctx.fillRect(screenX, buildingY, b.width, b.height + 40);

    // Windows
    for (const w of b.windows) {
      if (w.lit) {
        const flicker = Math.sin(time * 0.03 + w.x * 7 + w.y * 3) > -0.8;
        ctx.fillStyle = flicker ? COLORS.cyan + "40" : COLORS.cyan + "15";
        ctx.fillRect(screenX + w.x, buildingY + w.y, 8, 10);
      }
    }
  }

  // Horizon line glow
  ctx.save();
  ctx.strokeStyle = COLORS.cyan + "20";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 20);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 20);
  ctx.stroke();
  ctx.restore();
}

// ---------- Platform ----------
function renderPlatform(
  ctx: CanvasRenderingContext2D,
  platform: Platform,
  camX: number,
  camY: number
) {
  const x = platform.x - camX;
  const y = platform.y - camY;

  if (x + platform.width < -10 || x > CANVAS_WIDTH + 10) return;

  // Is this a ground platform?
  const isGround = platform.y >= GROUND_Y;

  ctx.save();

  if (isGround) {
    // Ground - darker, solid
    ctx.fillStyle = "#0f0f1e";
    ctx.fillRect(x, y, platform.width, platform.height);

    // Top edge glow
    ctx.strokeStyle = platform.glowColor + "80";
    ctx.shadowColor = platform.glowColor;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + platform.width, y);
    ctx.stroke();
  } else {
    // Floating platform
    ctx.fillStyle = "#16162a";
    ctx.fillRect(x, y, platform.width, platform.height);

    // Neon border
    ctx.strokeStyle = platform.glowColor;
    ctx.shadowColor = platform.glowColor;
    ctx.shadowBlur = 8;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, platform.width, platform.height);

    // Inner highlight
    ctx.fillStyle = platform.glowColor + "15";
    ctx.fillRect(x + 2, y + 2, platform.width - 4, platform.height - 4);
  }

  ctx.restore();
}

// ---------- Player ----------
function renderPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  camX: number,
  camY: number,
  time: number
) {
  const x = player.x - camX;
  const y = player.y - camY;

  // Invincibility blink
  if (player.invincible && Math.floor(time * 0.5) % 2 === 0) return;

  ctx.save();

  const facingRight = player.direction === "right";

  // Body glow
  ctx.shadowColor = COLORS.playerGlow;
  ctx.shadowBlur = 10;

  // Legs
  const legOffset = player.isGrounded ? Math.sin(time * 0.2) * 3 : 0;
  ctx.fillStyle = "#1a3a1a";
  ctx.fillRect(x + 6, y + player.height - 16, 8, 16);
  ctx.fillRect(x + player.width - 14, y + player.height - 16 + legOffset, 8, 16);

  // Body (torso)
  ctx.fillStyle = "#0d2b0d";
  ctx.fillRect(x + 4, y + 12, player.width - 8, player.height - 28);

  // Chest highlight
  ctx.fillStyle = COLORS.neonGreen + "40";
  ctx.fillRect(x + 8, y + 16, player.width - 16, 8);

  // Head
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(x + 6, y, player.width - 12, 14);

  // Visor (neon green)
  ctx.fillStyle = COLORS.neonGreen;
  ctx.shadowColor = COLORS.neonGreen;
  ctx.shadowBlur = 12;
  if (facingRight) {
    ctx.fillRect(x + 14, y + 4, 14, 5);
  } else {
    ctx.fillRect(x + 4, y + 4, 14, 5);
  }

  // Arm / gun
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#1a3a1a";
  if (facingRight) {
    ctx.fillRect(x + player.width - 4, y + 18, 8, 6);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillRect(x + player.width + 2, y + 19, 6, 4);
  } else {
    ctx.fillRect(x - 4, y + 18, 8, 6);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillRect(x - 8, y + 19, 6, 4);
  }

  // Cybernetic lines on body
  ctx.strokeStyle = COLORS.neonGreen + "60";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + player.width / 2, y + 14);
  ctx.lineTo(x + player.width / 2, y + player.height - 16);
  ctx.stroke();

  ctx.restore();
}

// ---------- Enemy ----------
function renderEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  camX: number,
  camY: number,
  time: number
) {
  const x = enemy.x - camX;
  const y = enemy.y - camY;

  if (x + enemy.width < -50 || x > CANVAS_WIDTH + 50) return;

  ctx.save();

  switch (enemy.type) {
    case "drone":
      renderDrone(ctx, x, y, enemy, time);
      break;
    case "turret":
      renderTurret(ctx, x, y, enemy, time);
      break;
    case "boss":
      renderBoss(ctx, x, y, enemy, time);
      break;
  }

  ctx.restore();
}

function renderDrone(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  enemy: Enemy,
  time: number
) {
  // Body
  ctx.fillStyle = COLORS.droneBody;
  ctx.shadowColor = COLORS.droneGlow;
  ctx.shadowBlur = 8;

  // Hexagonal-ish shape
  ctx.beginPath();
  ctx.moveTo(x + enemy.width / 2, y);
  ctx.lineTo(x + enemy.width, y + enemy.height * 0.3);
  ctx.lineTo(x + enemy.width, y + enemy.height * 0.7);
  ctx.lineTo(x + enemy.width / 2, y + enemy.height);
  ctx.lineTo(x, y + enemy.height * 0.7);
  ctx.lineTo(x, y + enemy.height * 0.3);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = COLORS.red;
  ctx.shadowColor = COLORS.red;
  ctx.shadowBlur = 6;
  const eyeX = x + enemy.width / 2 - 3;
  const eyeY = y + enemy.height * 0.35;
  ctx.fillRect(eyeX, eyeY, 6, 4);

  // Propeller flicker
  ctx.fillStyle = COLORS.orange + "60";
  ctx.shadowBlur = 0;
  const propW = 10 + Math.sin(time * 0.5) * 5;
  ctx.fillRect(x + enemy.width / 2 - propW, y - 3, propW * 2, 2);
}

function renderTurret(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  enemy: Enemy,
  time: number
) {
  // Base
  ctx.fillStyle = "#2a0a0a";
  ctx.fillRect(x, y + enemy.height * 0.5, enemy.width, enemy.height * 0.5);

  // Turret head
  ctx.fillStyle = COLORS.turretBody;
  ctx.shadowColor = COLORS.turretGlow;
  ctx.shadowBlur = 6;
  ctx.fillRect(x + 4, y, enemy.width - 8, enemy.height * 0.55);

  // Barrel
  const barrelY = y + enemy.height * 0.2;
  if (enemy.direction === "right") {
    ctx.fillRect(x + enemy.width - 4, barrelY, 12, 6);
  } else {
    ctx.fillRect(x - 8, barrelY, 12, 6);
  }

  // Scan line
  ctx.fillStyle = COLORS.red;
  ctx.shadowColor = COLORS.red;
  ctx.shadowBlur = 4;
  const scanY = y + 4 + (Math.sin(time * 0.1) + 1) * 6;
  ctx.fillRect(x + 8, scanY, enemy.width - 16, 2);
}

function renderBoss(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  enemy: Enemy,
  time: number
) {
  const cx = x + enemy.width / 2;
  const cy = y + enemy.height / 2;
  const phase2 = enemy.bossPhase === 2;
  const pulseScale = 1 + Math.sin(time * 0.05) * 0.05;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulseScale, pulseScale);
  ctx.translate(-cx, -cy);

  // Outer glow ring
  ctx.strokeStyle = phase2 ? COLORS.red + "40" : COLORS.bossGlow + "40";
  ctx.shadowColor = phase2 ? COLORS.red : COLORS.bossGlow;
  ctx.shadowBlur = 20;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, enemy.width / 2 + 10, 0, Math.PI * 2);
  ctx.stroke();

  // Main hexagonal body
  ctx.fillStyle = phase2 ? "#3a0020" : "#1a0040";
  ctx.strokeStyle = phase2 ? COLORS.red : COLORS.bossBody;
  ctx.shadowColor = phase2 ? COLORS.red : COLORS.bossGlow;
  ctx.shadowBlur = 15;
  ctx.lineWidth = 2;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 6 + time * 0.01;
    const px = cx + Math.cos(angle) * (enemy.width / 2);
    const py = cy + Math.sin(angle) * (enemy.height / 2);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner core
  ctx.fillStyle = phase2 ? COLORS.red : COLORS.magenta;
  ctx.shadowColor = phase2 ? COLORS.red : COLORS.magenta;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, 15 + Math.sin(time * 0.08) * 5, 0, Math.PI * 2);
  ctx.fill();

  // Core eye
  ctx.fillStyle = COLORS.white;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  // Health bar
  ctx.shadowBlur = 0;
  const barW = enemy.width;
  const barH = 6;
  const barX = x;
  const barY = y - 15;
  ctx.fillStyle = "#333";
  ctx.fillRect(barX, barY, barW, barH);
  const healthRatio = enemy.health / enemy.maxHealth;
  ctx.fillStyle = healthRatio > 0.5 ? COLORS.magenta : COLORS.red;
  ctx.fillRect(barX, barY, barW * healthRatio, barH);
  ctx.strokeStyle = COLORS.white + "40";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  // Boss name
  ctx.fillStyle = COLORS.white;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("OMNICORE", cx, barY - 4);

  ctx.restore();
}

// ---------- Projectile ----------
function renderProjectile(
  ctx: CanvasRenderingContext2D,
  proj: Projectile,
  camX: number,
  camY: number
) {
  // Trail
  ctx.save();
  for (let i = 0; i < proj.trail.length; i++) {
    const t = proj.trail[i];
    const alpha = (i / proj.trail.length) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = proj.color;
    const size = proj.width * (i / proj.trail.length);
    ctx.fillRect(t.x - camX, t.y - camY, size, proj.height * 0.8);
  }
  ctx.restore();

  // Bullet
  ctx.save();
  ctx.fillStyle = proj.color;
  ctx.shadowColor = proj.color;
  ctx.shadowBlur = 8;
  ctx.fillRect(proj.x - camX, proj.y - camY, proj.width, proj.height);
  ctx.restore();
}

// ---------- Collectible ----------
function renderCollectible(
  ctx: CanvasRenderingContext2D,
  col: Collectible,
  camX: number,
  camY: number,
  time: number
) {
  const x = col.x - camX;
  const y = col.y - camY + Math.sin((time + col.animTimer) * 0.06) * 4;

  if (x + col.width < -10 || x > CANVAS_WIDTH + 10) return;

  ctx.save();

  let color: string;
  switch (col.type) {
    case "health":
      color = COLORS.healthPickup;
      break;
    case "ammo":
      color = COLORS.ammoPickup;
      break;
    case "data_chip":
      color = COLORS.dataChip;
      break;
  }

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  // Diamond shape
  const cx = x + col.width / 2;
  const cy = y + col.height / 2;
  const s = col.width / 2;

  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s, cy);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - s, cy);
  ctx.closePath();
  ctx.fill();

  // Inner glow
  ctx.fillStyle = COLORS.white + "60";
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------- HUD ----------
function renderHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  const player = state.player;

  ctx.save();
  ctx.shadowBlur = 0;

  // Health (cyber hearts)
  for (let i = 0; i < player.maxHealth; i++) {
    const hx = 16 + i * 28;
    const hy = 16;
    if (i < player.health) {
      ctx.fillStyle = COLORS.hudHealth;
      ctx.shadowColor = COLORS.hudHealth;
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = "#333";
      ctx.shadowBlur = 0;
    }
    // Heart-like shape (simplified diamond)
    ctx.beginPath();
    ctx.moveTo(hx + 10, hy);
    ctx.lineTo(hx + 20, hy + 10);
    ctx.lineTo(hx + 10, hy + 20);
    ctx.lineTo(hx, hy + 10);
    ctx.closePath();
    ctx.fill();
  }

  // Ammo
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.hudAmmo;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`AMMO: ${player.ammo}`, 16, 54);

  // Small ammo bar
  ctx.fillStyle = "#222";
  ctx.fillRect(16, 58, 100, 4);
  ctx.fillStyle = COLORS.hudAmmo;
  const ammoRatio = Math.min(1, player.ammo / 40);
  ctx.fillRect(16, 58, 100 * ammoRatio, 4);

  // Score
  ctx.fillStyle = COLORS.hudScore;
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`SCORE: ${player.score}`, CANVAS_WIDTH - 16, 30);

  // Section indicator
  const section = getCurrentSection(state);
  ctx.fillStyle = COLORS.white + "80";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText(section.toUpperCase(), CANVAS_WIDTH - 16, 48);

  ctx.restore();
}

function getCurrentSection(state: GameState): string {
  const px = state.player.x;
  if (px < state.level.sections.streets.endX) return "As Ruas";
  if (px < state.level.sections.ducts.endX) return "Os Dutos";
  return "Nucleo da IA";
}

// ---------- Pause Overlay ----------
function renderPauseOverlay(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 15;
  ctx.font = "bold 36px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PAUSADO", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);

  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.white + "80";
  ctx.font = "14px monospace";
  ctx.fillText("Pressione ESC ou P para continuar", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);

  ctx.restore();
}

// ============================
// Neon Escape - Renderer (Canvas 2D)
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

  // Damage flash overlay (GDD: tela pisca vermelho ao receber dano)
  if (state.damageFlashTimer > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 40, ${state.damageFlashTimer / 15 * 0.25})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Zone transition overlay
  if (state.zoneTransitionTimer > 0) {
    renderZoneTransition(ctx, state.zoneTransitionName, state.zoneTransitionTimer);
  }

  // Ready overlay (tutorial de controles)
  if (state.screen === "ready") {
    renderReadyOverlay(ctx, state.time);
  }

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
  // === CAMADA 1: Céu distante (parallax 0.1x) — estrelas e nuvens tóxicas ===
  for (let i = 0; i < 40; i++) {
    const starX = ((i * 193 + 50) % (CANVAS_WIDTH + 100)) - 50 - (camX * 0.05) % (CANVAS_WIDTH + 100);
    const starY = (i * 67) % (CANVAS_HEIGHT * 0.5);
    const twinkle = Math.sin(time * 0.02 + i * 3) > 0.3;
    if (twinkle) {
      ctx.fillStyle = i % 5 === 0 ? COLORS.cyan + "25" : COLORS.white + "15";
      ctx.fillRect(starX, starY, 1, 1);
    }
  }

  // Nuvens tóxicas distantes
  for (let i = 0; i < 5; i++) {
    const cloudX = ((i * 400 + time * 0.1) % (CANVAS_WIDTH + 300)) - 150 - camX * 0.1;
    const cloudY = 30 + i * 25 + Math.sin(time * 0.005 + i) * 10;
    const cloudW = 120 + i * 30;
    ctx.fillStyle = COLORS.magenta + "08";
    ctx.beginPath();
    ctx.ellipse(cloudX + cloudW / 2, cloudY, cloudW / 2, 12 + i * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // === CAMADA 2: Prédios (parallax 0.3x) — existente ===
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

  // === CAMADA 3: Foreground próximo (parallax 0.6x) — postes e detritos ===
  const fgParallax = 0.6;
  for (let i = 0; i < 15; i++) {
    const poleBaseX = i * 500 + 200;
    const screenX = poleBaseX - camX * fgParallax;
    if (screenX < -20 || screenX > CANVAS_WIDTH + 20) continue;

    // Poste de luz
    ctx.fillStyle = "#0a0a16";
    ctx.fillRect(screenX, GROUND_Y - 80, 3, 80);

    // Luz do poste (intermitente)
    const lightOn = Math.sin(time * 0.015 + i * 5) > -0.5;
    if (lightOn) {
      ctx.fillStyle = COLORS.cyan + "12";
      ctx.beginPath();
      ctx.moveTo(screenX + 1.5, GROUND_Y - 80);
      ctx.lineTo(screenX - 15, GROUND_Y - 10);
      ctx.lineTo(screenX + 18, GROUND_Y - 10);
      ctx.closePath();
      ctx.fill();
    }
  }
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
    case "tracker":
      renderTracker(ctx, x, y, enemy, time);
      break;
    case "turret":
      renderTurret(ctx, x, y, enemy, time);
      break;
    case "boss":
      renderBoss(ctx, x, y, enemy, time);
      break;
  }

  // Barra de HP acima do inimigo (exceto boss que tem HUD próprio, e drones de 1 HP)
  if (enemy.type !== "boss" && enemy.maxHealth > 1 && enemy.health < enemy.maxHealth) {
    const barW = enemy.width;
    const barH = 3;
    const barX = x;
    const barY = y - 8;
    const ratio = enemy.health / enemy.maxHealth;

    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = ratio > 0.5 ? COLORS.neonGreen : ratio > 0.25 ? COLORS.yellow : COLORS.red;
    ctx.fillRect(barX, barY, barW * ratio, barH);
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

function renderTracker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  enemy: Enemy,
  time: number
) {
  const isChasing = enemy.trackingPlayer;

  // Corpo triangular agressivo (apontando na direção do movimento)
  ctx.fillStyle = isChasing ? COLORS.trackerBody : COLORS.trackerGlow;
  ctx.shadowColor = COLORS.trackerGlow;
  ctx.shadowBlur = isChasing ? 14 : 6;

  const cx = x + enemy.width / 2;
  const cy = y + enemy.height / 2;
  const facingRight = enemy.direction === "right";

  ctx.beginPath();
  if (facingRight) {
    ctx.moveTo(x + enemy.width, cy); // ponta direita
    ctx.lineTo(x, y); // canto superior esquerdo
    ctx.lineTo(x + 6, cy); // reentrância
    ctx.lineTo(x, y + enemy.height); // canto inferior esquerdo
  } else {
    ctx.moveTo(x, cy); // ponta esquerda
    ctx.lineTo(x + enemy.width, y); // canto superior direito
    ctx.lineTo(x + enemy.width - 6, cy); // reentrância
    ctx.lineTo(x + enemy.width, y + enemy.height); // canto inferior direito
  }
  ctx.closePath();
  ctx.fill();

  // Olho central — pulsa vermelho quando perseguindo
  const eyeSize = isChasing ? 5 + Math.sin(time * 0.3) * 1.5 : 4;
  ctx.fillStyle = isChasing ? COLORS.red : COLORS.magenta;
  ctx.shadowColor = isChasing ? COLORS.red : COLORS.magenta;
  ctx.shadowBlur = isChasing ? 10 : 4;
  ctx.beginPath();
  ctx.arc(cx, cy, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  // Trilha de energia quando perseguindo
  if (isChasing) {
    ctx.fillStyle = COLORS.trackerGlow + "30";
    ctx.shadowBlur = 0;
    const trailX = facingRight ? x - 8 : x + enemy.width;
    ctx.fillRect(trailX, cy - 2, 8 + Math.sin(time * 0.4) * 3, 4);
  }
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
  const phase = enemy.bossPhase || 1;
  const pulseSpeed = phase === 3 ? 0.1 : phase === 2 ? 0.07 : 0.05;
  const pulseScale = 1 + Math.sin(time * pulseSpeed) * (0.03 + phase * 0.02);

  // Cores por fase
  const glowColor = phase === 3 ? COLORS.yellow : phase === 2 ? COLORS.red : COLORS.bossGlow;
  const bodyFill = phase === 3 ? "#3a3a00" : phase === 2 ? "#3a0020" : "#1a0040";
  const bodyStroke = phase === 3 ? COLORS.yellow : phase === 2 ? COLORS.red : COLORS.bossBody;
  const coreColor = phase === 3 ? COLORS.yellow : phase === 2 ? COLORS.red : COLORS.magenta;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulseScale, pulseScale);
  ctx.translate(-cx, -cy);

  // Outer glow ring
  ctx.strokeStyle = glowColor + "40";
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = phase === 3 ? 30 : 20;
  ctx.lineWidth = phase === 3 ? 3 : 2;
  ctx.beginPath();
  ctx.arc(cx, cy, enemy.width / 2 + 10, 0, Math.PI * 2);
  ctx.stroke();

  // Fase 3: segundo anel externo pulsante
  if (phase === 3) {
    ctx.strokeStyle = COLORS.red + "30";
    ctx.shadowColor = COLORS.red;
    ctx.shadowBlur = 15;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, enemy.width / 2 + 20 + Math.sin(time * 0.12) * 5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Main hexagonal body
  ctx.fillStyle = bodyFill;
  ctx.strokeStyle = bodyStroke;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15;
  ctx.lineWidth = 2;

  const rotationSpeed = phase === 3 ? 0.025 : phase === 2 ? 0.015 : 0.01;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 6 + time * rotationSpeed;
    const px = cx + Math.cos(angle) * (enemy.width / 2);
    const py = cy + Math.sin(angle) * (enemy.height / 2);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner core
  ctx.fillStyle = coreColor;
  ctx.shadowColor = coreColor;
  ctx.shadowBlur = phase === 3 ? 30 : 20;
  ctx.beginPath();
  ctx.arc(cx, cy, 15 + Math.sin(time * 0.08) * 5, 0, Math.PI * 2);
  ctx.fill();

  // Core eye
  ctx.fillStyle = COLORS.white;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

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

  // Ammo (GDD: pisca vermelho quando munição baixa)
  ctx.shadowBlur = 0;
  const ammoLow = player.ammo <= 3;
  const ammoBlink = ammoLow && Math.floor(state.time * 0.15) % 2 === 0;
  ctx.fillStyle = ammoBlink ? COLORS.red : COLORS.hudAmmo;
  if (ammoBlink) {
    ctx.shadowColor = COLORS.red;
    ctx.shadowBlur = 8;
  }
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`AMMO: ${player.ammo}`, 16, 54);
  ctx.shadowBlur = 0;

  // Small ammo bar
  ctx.fillStyle = "#222";
  ctx.fillRect(16, 58, 100, 4);
  ctx.fillStyle = ammoLow ? COLORS.red : COLORS.hudAmmo;
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

  // Boss HP bar — topo central (GDD: aparece apenas na Zona 3)
  const boss = state.enemies.find((e) => e.type === "boss" && e.alive);
  if (boss && state.player.x >= state.level.sections.boss.startX) {
    const barW = 300;
    const barH = 10;
    const barX = CANVAS_WIDTH / 2 - barW / 2;
    const barY = 16;
    const phase = boss.bossPhase || 1;
    const healthRatio = boss.health / boss.maxHealth;
    const barColor = phase === 3 ? COLORS.yellow : phase === 2 ? COLORS.red : COLORS.magenta;

    // Nome do boss
    ctx.fillStyle = COLORS.white;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`OMNICORE - FASE ${phase}`, CANVAS_WIDTH / 2, barY - 4);

    // Fundo da barra
    ctx.fillStyle = "#222";
    ctx.fillRect(barX, barY, barW, barH);

    // Barra de vida
    ctx.fillStyle = barColor;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(barX, barY, barW * healthRatio, barH);
    ctx.shadowBlur = 0;

    // Borda
    ctx.strokeStyle = COLORS.white + "40";
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
  }

  ctx.restore();
}

// ---------- Ready Overlay (Tutorial) ----------
function renderReadyOverlay(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();

  // Fundo escuro
  ctx.fillStyle = "rgba(5, 5, 16, 0.85)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Título
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 20;
  ctx.font = "bold 32px monospace";
  ctx.textAlign = "center";
  ctx.fillText("PREPARADO?", CANVAS_WIDTH / 2, 160);
  ctx.shadowBlur = 0;

  // Subtítulo
  ctx.fillStyle = COLORS.white + "80";
  ctx.font = "14px monospace";
  ctx.fillText("Aprenda os controles antes de entrar na batalha", CANVAS_WIDTH / 2, 195);

  // Linha decorativa
  ctx.strokeStyle = COLORS.cyan + "40";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2 - 200, 215);
  ctx.lineTo(CANVAS_WIDTH / 2 + 200, 215);
  ctx.stroke();

  // Controles
  const controls = [
    { key: "A / D  ou  ← →", desc: "Mover" },
    { key: "W / ↑ / ESPACO", desc: "Pular" },
    { key: "S / ↓", desc: "Descer de plataformas" },
    { key: "J / CLIQUE", desc: "Atirar" },
    { key: "ESC", desc: "Pausar" },
  ];

  const startY = 245;
  const spacing = 42;

  controls.forEach((ctrl, i) => {
    const y = startY + i * spacing;

    // Tecla
    ctx.fillStyle = COLORS.cyan;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "right";
    ctx.fillText(ctrl.key, CANVAS_WIDTH / 2 - 20, y);

    // Descrição
    ctx.fillStyle = COLORS.white + "cc";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(ctrl.desc, CANVAS_WIDTH / 2 + 20, y);
  });

  // Dica de objetivo
  ctx.fillStyle = COLORS.magenta + "aa";
  ctx.font = "13px monospace";
  ctx.textAlign = "center";
  const objY = startY + controls.length * spacing + 30;
  ctx.fillText("Destrua os drones e derrote a OMNICORE!", CANVAS_WIDTH / 2, objY);

  // Prompt piscante
  const blink = Math.sin(time * 0.08) > 0;
  if (blink) {
    ctx.fillStyle = COLORS.yellow;
    ctx.shadowColor = COLORS.yellow;
    ctx.shadowBlur = 10;
    ctx.font = "bold 18px monospace";
    ctx.fillText("PRESSIONE QUALQUER TECLA PARA COMECAR", CANVAS_WIDTH / 2, objY + 60);
  }

  ctx.restore();
}

function getCurrentSection(state: GameState): string {
  const px = state.player.x;
  if (px < state.level.sections.streets.endX) return "As Ruas";
  if (px < state.level.sections.ducts.endX) return "Estruturas Elevadas";
  return "Confronto Final";
}

// ---------- Zone Transition ----------
function renderZoneTransition(ctx: CanvasRenderingContext2D, zoneName: string, timer: number) {
  ctx.save();

  // Fade in nos primeiros 30 frames, fade out nos últimos 30
  let alpha = 1;
  if (timer > 90) alpha = (120 - timer) / 30; // fade in
  else if (timer < 30) alpha = timer / 30; // fade out

  // Fundo semi-transparente
  ctx.fillStyle = `rgba(10, 10, 26, ${0.5 * alpha})`;
  ctx.fillRect(0, CANVAS_HEIGHT * 0.35, CANVAS_WIDTH, CANVAS_HEIGHT * 0.3);

  // Linhas decorativas
  ctx.strokeStyle = COLORS.cyan + Math.floor(alpha * 100).toString(16).padStart(2, "0");
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH * 0.2, CANVAS_HEIGHT * 0.42);
  ctx.lineTo(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.42);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH * 0.2, CANVAS_HEIGHT * 0.58);
  ctx.lineTo(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.58);
  ctx.stroke();

  // Nome da zona
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 20;
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText(zoneName, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8);

  ctx.restore();
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

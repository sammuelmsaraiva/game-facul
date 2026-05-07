// ============================
// Neon Escape - Renderer (Canvas 2D)
// ============================

import type { GameState, Player, Enemy, Platform, Projectile, Collectible, BackgroundBuilding } from "./types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_Y,
  COLORS,
  PLAYER_START_AMMO,
} from "./constants";
import { getCameraShakeOffset } from "./camera";
import { renderParticles, renderDamageNumbers } from "./particles";
import { loadSettings, getKeyDisplayName, ACTION_LABELS, type GameAction } from "./settings";

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

  // Damage numbers (acima das partículas, abaixo do HUD)
  renderDamageNumbers(ctx, state.damageNumbers, camX, camY);

  // HUD (drawn last, no camera offset)
  renderHUD(ctx, state);

  // Damage flash overlay (GDD: tela pisca vermelho ao receber dano)
  if (state.damageFlashTimer > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 0, 40, ${state.damageFlashTimer / 15 * 0.25})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Indicador de objetivo: seta na borda direita quando player fica parado >3s
  // (apenas durante gameplay normal e quando há "para onde ir")
  if (
    state.screen === "playing" &&
    state.idleTimer > 180 &&
    state.level.phaseEndX > 0 &&
    state.player.x < state.level.phaseEndX - 100
  ) {
    renderObjectiveArrow(ctx, state.time);
  }

  // Sequência cinematográfica de morte: vermelho → preto + texto "VOCE FOI ABATIDO"
  if (state.deathSequenceTimer > 0) {
    renderDeathSequenceOverlay(ctx, state);
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
    renderPauseOverlay(ctx, state);
  }

  // Upgrade overlay (entre fases)
  if (state.screen === "upgrade") {
    renderUpgradeOverlay(ctx, state);
  }

  // Tela de fase completa (resumo + prompt)
  if (state.screen === "phase_complete") {
    renderPhaseCompleteOverlay(ctx, state);
  }

  // Loading (fade entre fases)
  if (state.screen === "phase_loading") {
    renderPhaseLoadingOverlay(ctx, state);
  }

  // CRT overlay (scanlines + vignette) — desenha por último, sobre tudo
  const settings = loadSettings();
  if (settings.crtEffect) {
    renderCRTOverlay(ctx);
  }

  ctx.restore();
}

// ---------- Objective Arrow (indicador de "siga em frente") ----------
function renderObjectiveArrow(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();
  // Pulsa horizontalmente
  const offset = Math.sin(time * 0.12) * 12;
  const baseX = CANVAS_WIDTH - 80 + offset;
  const baseY = CANVAS_HEIGHT / 2;
  const alpha = 0.5 + Math.sin(time * 0.08) * 0.3;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS.yellow;
  ctx.shadowColor = COLORS.yellow;
  ctx.shadowBlur = 20;

  // Seta triangular grande
  ctx.beginPath();
  ctx.moveTo(baseX + 30, baseY);
  ctx.lineTo(baseX, baseY - 25);
  ctx.lineTo(baseX, baseY - 8);
  ctx.lineTo(baseX - 30, baseY - 8);
  ctx.lineTo(baseX - 30, baseY + 8);
  ctx.lineTo(baseX, baseY + 8);
  ctx.lineTo(baseX, baseY + 25);
  ctx.closePath();
  ctx.fill();

  // Texto "SIGA"
  ctx.shadowBlur = 8;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "right";
  ctx.fillText("SIGA", baseX - 40, baseY + 5);

  ctx.restore();
}

// ---------- Death Sequence Overlay ----------
// Animação cinematográfica de 1.25s: tinta vermelha sobe → escurece pra preto + texto
function renderDeathSequenceOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  const total = 75;
  const elapsed = total - state.deathSequenceTimer;
  // Fase 1 (0-30 frames): vermelho sobe até 60%
  // Fase 2 (30-60 frames): vermelho transita para preto
  // Fase 3 (60-75 frames): texto aparece e tudo fica preto
  let redAlpha = 0;
  let blackAlpha = 0;

  if (elapsed < 30) {
    redAlpha = (elapsed / 30) * 0.6;
  } else if (elapsed < 60) {
    redAlpha = 0.6 - ((elapsed - 30) / 30) * 0.4;
    blackAlpha = ((elapsed - 30) / 30) * 0.7;
  } else {
    redAlpha = 0.2;
    blackAlpha = 0.7 + ((elapsed - 60) / 15) * 0.3;
  }

  ctx.save();
  // Camada vermelha (impacto)
  ctx.fillStyle = `rgba(180, 0, 30, ${redAlpha})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  // Camada preta (fade out)
  ctx.fillStyle = `rgba(0, 0, 0, ${blackAlpha})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Texto "ABATIDO" aparecendo na fase 3
  if (elapsed > 45) {
    const textAlpha = Math.min(1, (elapsed - 45) / 15);
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = COLORS.red;
    ctx.shadowColor = COLORS.red;
    ctx.shadowBlur = 25;
    ctx.font = "bold 64px monospace";
    ctx.textAlign = "center";
    // Pequeno glitch shake
    const glitchX = (Math.random() - 0.5) * 4;
    ctx.fillText("ABATIDO", CANVAS_WIDTH / 2 + glitchX, CANVAS_HEIGHT / 2);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------- CRT Overlay (Scanlines + Vignette) ----------
// Inspirado em Hotline Miami / Katana ZERO. Adiciona linhas de varredura horizontais
// e um vignette radial escuro nos cantos para emular tubo CRT.
function renderCRTOverlay(ctx: CanvasRenderingContext2D) {
  ctx.save();

  // Scanlines: linhas horizontais escuras de 2px alternadas a cada 4px
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
    ctx.fillRect(0, y, CANVAS_WIDTH, 2);
  }

  // Vignette radial: cantos escurecidos
  const grad = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.35,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.85
  );
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.7, "rgba(0, 0, 0, 0.35)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.75)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.restore();
}

// ---------- Phase Complete Overlay ----------
function renderPhaseCompleteOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();

  // Fundo escuro pulsante
  const pulse = 0.85 + Math.sin(state.time * 0.04) * 0.04;
  ctx.fillStyle = `rgba(5, 5, 16, ${pulse})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Título grande "FASE X CONCLUIDA"
  ctx.fillStyle = COLORS.neonGreen;
  ctx.shadowColor = COLORS.neonGreen;
  ctx.shadowBlur = 30;
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.fillText("OBJETIVO ALCANCADO", CANVAS_WIDTH / 2, 140);
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 30;
  ctx.font = "bold 64px monospace";
  ctx.fillText(`FASE ${state.currentPhase} CONCLUIDA`, CANVAS_WIDTH / 2, 230);
  ctx.shadowBlur = 0;

  // Card de estatísticas
  const cardX = CANVAS_WIDTH / 2 - 280;
  const cardY = 280;
  const cardW = 560;
  const cardH = 200;

  ctx.fillStyle = "#0e0e22";
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 2;
  ctx.strokeRect(cardX, cardY, cardW, cardH);
  ctx.shadowBlur = 0;

  // Stats
  ctx.fillStyle = COLORS.white + "cc";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "left";
  const earned = state.player.score - state.phaseScore;
  const lines: [string, string, string][] = [
    ["VIDA RESTANTE", `${state.player.health} / ${state.player.maxHealth}`, COLORS.healthPickup],
    ["MUNICAO ATUAL", `${state.player.ammo}`, COLORS.ammoPickup],
    ["PONTOS GANHOS", `+${earned}`, COLORS.dataChip],
    ["PONTUACAO TOTAL", `${state.player.score}`, COLORS.hudScore],
  ];
  lines.forEach((line, i) => {
    const y = cardY + 38 + i * 36;
    ctx.fillStyle = COLORS.white + "aa";
    ctx.fillText(line[0], cardX + 30, y);
    ctx.fillStyle = line[2];
    ctx.shadowColor = line[2];
    ctx.shadowBlur = 8;
    ctx.textAlign = "right";
    ctx.fillText(line[1], cardX + cardW - 30, y);
    ctx.textAlign = "left";
    ctx.shadowBlur = 0;
  });

  // Próxima fase
  const nextPhaseLabel = state.currentPhase === 1 ? "ESTRUTURAS ELEVADAS" : "CONFRONTO FINAL";
  ctx.fillStyle = COLORS.magenta;
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 12;
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`>> PROXIMA FASE: ${nextPhaseLabel}`, CANVAS_WIDTH / 2, 520);
  ctx.shadowBlur = 0;

  // Prompt piscante "ENTER" — botão grande e claro
  const blink = Math.sin(state.time * 0.08) > 0;
  const btnY = 580;
  const btnW = 360;
  const btnH = 50;
  const btnX = CANVAS_WIDTH / 2 - btnW / 2;

  ctx.fillStyle = blink ? COLORS.yellow + "30" : COLORS.yellow + "10";
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = COLORS.yellow;
  ctx.shadowColor = COLORS.yellow;
  ctx.shadowBlur = blink ? 18 : 8;
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.yellow;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText("[ ENTER ] AVANCAR", CANVAS_WIDTH / 2, btnY + 32);

  ctx.restore();
}

// ---------- Phase Loading Overlay (fade out) ----------
function renderPhaseLoadingOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  // alpha aumenta enquanto o timer decresce (fade in para preto)
  const total = 90;
  const elapsed = total - state.phaseTransitionTimer;
  const alpha = Math.min(1, elapsed / 60);

  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Texto "Carregando próxima fase..." centralizado, aparece após 30 frames
  if (elapsed > 20) {
    const textAlpha = Math.min(1, (elapsed - 20) / 30);
    ctx.globalAlpha = textAlpha;
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 20;
    ctx.font = "bold 32px monospace";
    ctx.textAlign = "center";
    ctx.fillText("CARREGANDO...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    ctx.shadowBlur = 0;

    // Loading bar
    const barW = 400;
    const barH = 8;
    const barX = CANVAS_WIDTH / 2 - barW / 2;
    const barY = CANVAS_HEIGHT / 2 + 30;
    ctx.fillStyle = COLORS.darkGray;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = COLORS.cyan;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 8;
    const progress = Math.min(1, (elapsed - 20) / 70);
    ctx.fillRect(barX, barY, barW * progress, barH);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
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

  // === Squash & Stretch ===
  // Pulo: estica vertical (1.15x altura, 0.9x largura)
  // Pouso: achata vertical (0.85x altura, 1.15x largura)
  let scaleX = 1, scaleY = 1;
  if (player.jumpAnimTimer > 0) {
    const t = player.jumpAnimTimer / 8;
    scaleY = 1 + t * 0.15;
    scaleX = 1 - t * 0.10;
  } else if (player.landAnimTimer > 0) {
    const t = player.landAnimTimer / 6;
    scaleY = 1 - t * 0.15;
    scaleX = 1 + t * 0.15;
  }
  // Aplica transform centrado na base do sprite (chão dos pés)
  if (scaleX !== 1 || scaleY !== 1) {
    const cx = x + player.width / 2;
    const baseY = y + player.height;
    ctx.translate(cx, baseY);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-cx, -baseY);
  }

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

  // Arm / gun (só desenha o cano da arma se o jogador pode atirar)
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#1a3a1a";
  if (facingRight) {
    ctx.fillRect(x + player.width - 4, y + 18, 8, 6);
    if (player.canShoot) {
      const gunColor = player.weaponMode === "shotgun"
        ? COLORS.orange
        : player.weaponMode === "rapid"
        ? COLORS.yellow
        : COLORS.cyan;
      ctx.fillStyle = gunColor;
      ctx.shadowColor = gunColor;
      ctx.fillRect(x + player.width + 2, y + 19, 6, 4);
    }
  } else {
    ctx.fillRect(x - 4, y + 18, 8, 6);
    if (player.canShoot) {
      const gunColor = player.weaponMode === "shotgun"
        ? COLORS.orange
        : player.weaponMode === "rapid"
        ? COLORS.yellow
        : COLORS.cyan;
      ctx.fillStyle = gunColor;
      ctx.shadowColor = gunColor;
      ctx.fillRect(x - 8, y + 19, 6, 4);
    }
  }

  // Cybernetic lines on body
  ctx.strokeStyle = COLORS.neonGreen + "60";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + player.width / 2, y + 14);
  ctx.lineTo(x + player.width / 2, y + player.height - 16);
  ctx.stroke();

  // Muzzle flash — clarão circular brilhante na ponta do cano
  if (player.muzzleFlashTimer > 0 && player.canShoot) {
    const flashAlpha = player.muzzleFlashTimer / 4;
    const flashSize = 12 + (1 - flashAlpha) * 6;
    const flashX = facingRight ? x + player.width + 8 : x - 8;
    const flashY = y + 21;
    ctx.fillStyle = `rgba(255, 255, 220, ${flashAlpha})`;
    ctx.shadowColor = "#ffffaa";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

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

  // Hit flash: overlay branco sobre o inimigo no momento do dano
  if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) {
    const alpha = enemy.hitFlashTimer / 5;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillRect(x - 4, y - 4, enemy.width + 8, enemy.height + 8);
    ctx.globalCompositeOperation = "source-over";
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

  // === TENTÁCULOS ondulantes (atrás do corpo) ===
  // Número de tentáculos aumenta por fase: 6 / 8 / 10
  // Comprimento e amplitude também escalam — fase 3 fica bem ameaçador
  const tentacleCount = phase === 3 ? 10 : phase === 2 ? 8 : 6;
  const segments = 6;
  const baseLen = phase === 3 ? 70 : phase === 2 ? 55 : 42;
  const segLen = baseLen / segments;
  const tentacleColor = phase === 3 ? COLORS.yellow : phase === 2 ? COLORS.red : COLORS.magenta;
  const waveSpeed = phase === 3 ? 0.18 : phase === 2 ? 0.13 : 0.09;
  const baseRadius = enemy.width / 2 - 4;

  ctx.save();
  ctx.strokeStyle = tentacleColor;
  ctx.shadowColor = tentacleColor;
  for (let t = 0; t < tentacleCount; t++) {
    const baseAngle = (Math.PI * 2 * t) / tentacleCount + time * 0.005;
    const baseX = cx + Math.cos(baseAngle) * baseRadius;
    const baseY = cy + Math.sin(baseAngle) * (enemy.height / 2 - 4);

    let prevX = baseX, prevY = baseY;
    for (let s = 1; s <= segments; s++) {
      const t01 = s / segments;
      // Ondulação senoidal — cada segmento defasado
      const wave = Math.sin(time * waveSpeed + t * 1.7 + s * 0.6) * (4 + s * 1.4);
      const angle = baseAngle + wave * 0.05;
      const stepLen = segLen * (1 - t01 * 0.2); // segmentos finais menores
      const nx = prevX + Math.cos(angle) * stepLen;
      const ny = prevY + Math.sin(angle) * stepLen;

      // Cada segmento tem espessura decrescente
      const thick = Math.max(1, 5 * (1 - t01));
      ctx.lineWidth = thick;
      ctx.shadowBlur = phase === 3 ? 12 : 8;
      // Alpha decresce até a ponta
      const alpha = Math.floor((1 - t01 * 0.5) * 255).toString(16).padStart(2, "0");
      ctx.strokeStyle = tentacleColor + alpha;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      prevX = nx;
      prevY = ny;
    }
    // Bolha luminosa na ponta (terminação ameaçadora)
    ctx.fillStyle = tentacleColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(prevX, prevY, 3 + Math.sin(time * 0.2 + t) * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

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
  let glowColor: string;
  switch (col.type) {
    case "health":
      color = COLORS.healthPickup;
      glowColor = COLORS.healthPickupGlow;
      break;
    case "ammo":
      color = COLORS.ammoPickup;
      glowColor = COLORS.ammoPickupGlow;
      break;
    case "data_chip":
      color = COLORS.dataChip;
      glowColor = COLORS.dataChipGlow;
      break;
  }

  const cx = x + col.width / 2;
  const cy = y + col.height / 2;
  const s = col.width / 2;
  const pulse = 1 + Math.sin((time + col.animTimer) * 0.1) * 0.12;

  // Halo externo pulsante (mais sutil)
  ctx.fillStyle = glowColor + "18";
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 1.5 * pulse, 0, Math.PI * 2);
  ctx.fill();

  // Anel intermediário
  ctx.shadowBlur = 10;
  ctx.fillStyle = color + "50";
  ctx.beginPath();
  ctx.arc(cx, cy, s * 1.05, 0, Math.PI * 2);
  ctx.fill();

  // Diamante principal
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s, cy);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - s, cy);
  ctx.closePath();
  ctx.fill();

  // Borda interna nítida (alto contraste)
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.white + "ee";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s, cy);
  ctx.lineTo(cx, cy + s);
  ctx.lineTo(cx - s, cy);
  ctx.closePath();
  ctx.stroke();

  // Núcleo branco brilhante
  ctx.fillStyle = COLORS.white;
  ctx.shadowColor = COLORS.white;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------- HUD ----------
function renderHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  const player = state.player;

  ctx.save();
  ctx.shadowBlur = 0;

  // Health (cyber hearts) — maiores
  const heartSize = 30;
  const heartGap = 8;
  for (let i = 0; i < player.maxHealth; i++) {
    const hx = 18 + i * (heartSize + heartGap);
    const hy = 18;
    if (i < player.health) {
      ctx.fillStyle = COLORS.hudHealth;
      ctx.shadowColor = COLORS.hudHealth;
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = "#333";
      ctx.shadowBlur = 0;
    }
    ctx.beginPath();
    ctx.moveTo(hx + heartSize / 2, hy);
    ctx.lineTo(hx + heartSize, hy + heartSize / 2);
    ctx.lineTo(hx + heartSize / 2, hy + heartSize);
    ctx.lineTo(hx, hy + heartSize / 2);
    ctx.closePath();
    ctx.fill();
  }

  // Ammo (só exibe quando arma desbloqueada — GDD: pisca vermelho quando baixa)
  if (player.canShoot) {
    ctx.shadowBlur = 0;
    const ammoLow = player.ammo <= 3;
    const ammoBlink = ammoLow && Math.floor(state.time * 0.15) % 2 === 0;
    ctx.fillStyle = ammoBlink ? COLORS.red : COLORS.hudAmmo;
    if (ammoBlink) {
      ctx.shadowColor = COLORS.red;
      ctx.shadowBlur = 12;
    }
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "left";
    const weaponLabel =
      player.weaponMode === "shotgun"
        ? "SPREAD"
        : player.weaponMode === "rapid"
        ? "RAPID"
        : "AMMO";
    ctx.fillText(`${weaponLabel}: ${player.ammo}`, 18, 78);
    ctx.shadowBlur = 0;

    // Barra de munição maior
    ctx.fillStyle = "#222";
    ctx.fillRect(18, 86, 180, 8);
    ctx.fillStyle = ammoLow ? COLORS.red : COLORS.hudAmmo;
    ctx.shadowColor = ammoLow ? COLORS.red : COLORS.hudAmmo;
    ctx.shadowBlur = 4;
    const ammoRatio = Math.min(1, player.ammo / PLAYER_START_AMMO);
    ctx.fillRect(18, 86, 180 * ammoRatio, 8);
    ctx.shadowBlur = 0;
  } else {
    // Fase 1: arma bloqueada — mostra munição armazenada
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.white + "90";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "left";
    ctx.fillText("ARMA: [BLOQUEADA]", 18, 76);

    ctx.fillStyle = COLORS.cyan + "b0";
    ctx.font = "bold 14px monospace";
    ctx.fillText(`MUNICAO ESTOCADA: ${player.ammo}`, 18, 96);

    ctx.fillStyle = "#222";
    ctx.fillRect(18, 102, 180, 6);
    ctx.fillStyle = COLORS.cyan + "80";
    const stockRatio = Math.min(1, player.ammo / PLAYER_START_AMMO);
    ctx.fillRect(18, 102, 180 * stockRatio, 6);
  }

  // Score — bem maior, com glow + pulse animado quando ganha pontos
  const pulseT = state.scorePulseTimer / 22;
  const scoreScale = 1 + pulseT * 0.15;
  ctx.save();
  ctx.fillStyle = COLORS.hudScore;
  ctx.shadowColor = COLORS.hudScore;
  ctx.shadowBlur = 10 + pulseT * 12;
  ctx.font = `bold ${Math.round(26 * scoreScale)}px monospace`;
  ctx.textAlign = "right";
  ctx.fillText(`SCORE: ${player.score}`, CANVAS_WIDTH - 18, 42);
  ctx.restore();

  // Section indicator
  const section = getCurrentSection(state);
  ctx.fillStyle = COLORS.cyan + "c0";
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 6;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "right";
  ctx.fillText(section.toUpperCase(), CANVAS_WIDTH - 18, 68);
  ctx.shadowBlur = 0;

  // Indicador de GOD MODE (cheat de dev) — pisca no canto inferior direito
  if (state.cheatInvincible) {
    const blink = Math.sin(state.time * 0.18) > 0;
    ctx.fillStyle = blink ? COLORS.yellow : COLORS.yellow + "60";
    ctx.shadowColor = COLORS.yellow;
    ctx.shadowBlur = blink ? 16 : 6;
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "right";
    ctx.fillText("◆ GOD MODE ◆", CANVAS_WIDTH - 18, CANVAS_HEIGHT - 20);
    ctx.shadowBlur = 0;
  }

  // Boss HP bar — topo central (GDD: aparece apenas na Zona 3)
  const boss = state.enemies.find((e) => e.type === "boss" && e.alive);
  if (boss && state.player.x >= state.level.sections.boss.startX) {
    const barW = 420;
    const barH = 16;
    const barX = CANVAS_WIDTH / 2 - barW / 2;
    const barY = 28;
    const phase = boss.bossPhase || 1;
    const healthRatio = boss.health / boss.maxHealth;
    const barColor = phase === 3 ? COLORS.yellow : phase === 2 ? COLORS.red : COLORS.magenta;

    // Nome do boss
    ctx.fillStyle = COLORS.white;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 10;
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`OMNICORE - FASE ${phase}`, CANVAS_WIDTH / 2, barY - 8);
    ctx.shadowBlur = 0;

    // Fundo da barra
    ctx.fillStyle = "#222";
    ctx.fillRect(barX, barY, barW, barH);

    // Barra de vida
    ctx.fillStyle = barColor;
    ctx.shadowColor = barColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(barX, barY, barW * healthRatio, barH);
    ctx.shadowBlur = 0;

    // Borda
    ctx.strokeStyle = COLORS.white + "60";
    ctx.lineWidth = 2;
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

  // Controles (lidos das configurações do jogador)
  const settings = loadSettings();
  const bindings = settings.keyBindings;
  // Agrupa left+right como "Mover" para exibição compacta
  const leftKeys = [bindings.left[0], bindings.left[1]].filter(Boolean).map(k => getKeyDisplayName(k!));
  const rightKeys = [bindings.right[0], bindings.right[1]].filter(Boolean).map(k => getKeyDisplayName(k!));
  const moveKey = leftKeys[0] + " / " + rightKeys[0]
    + (leftKeys[1] && rightKeys[1] ? "  ou  " + leftKeys[1] + " / " + rightKeys[1] : "");

  function formatKeys(action: GameAction): string {
    const keys = bindings[action];
    const parts = [keys[0], keys[1]].filter(Boolean).map(k => getKeyDisplayName(k!));
    if (action === "shoot") parts.push("CLIQUE");
    return parts.join(" / ");
  }

  const controls = [
    { key: moveKey, desc: "Mover" },
    { key: formatKeys("jump"), desc: ACTION_LABELS.jump },
    { key: formatKeys("down"), desc: ACTION_LABELS.down },
    { key: formatKeys("shoot"), desc: ACTION_LABELS.shoot },
    { key: formatKeys("pause"), desc: ACTION_LABELS.pause },
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

// ---------- Upgrade Overlay (Recompensa entre fases) ----------
function renderUpgradeOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();

  // Fundo escuro
  ctx.fillStyle = "rgba(5, 5, 16, 0.92)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const confirmAnim = state.upgradeConfirmAnim;

  if (state.pendingUpgrade === "weapon_unlock") {
    renderWeaponUnlockCard(ctx, state.time, confirmAnim);
  } else if (state.pendingUpgrade === "weapon_choice") {
    renderWeaponChoiceCard(ctx, state.upgradeSelection, state.time, confirmAnim);
  } else if (state.pendingUpgrade === "intro_enemies") {
    renderEnemiesIntroCard(ctx, state.time, state.currentZone, confirmAnim);
  } else if (state.pendingUpgrade === "intro_collectibles") {
    renderCollectiblesIntroCard(ctx, state.time, confirmAnim);
  }

  ctx.restore();
}

// Botão de confirmação reutilizável — mostra animação verde quando confirmAnim>0
function drawConfirmButton(
  ctx: CanvasRenderingContext2D,
  time: number,
  confirmAnim: number
) {
  const isConfirming = confirmAnim > 0;
  const blink = Math.sin(time * 0.08) > 0;

  const btnY = 600;
  const btnW = 360;
  const btnH = 50;
  const btnX = CANVAS_WIDTH / 2 - btnW / 2;

  const color = isConfirming ? COLORS.neonGreen : COLORS.yellow;
  const bgAlpha = isConfirming ? "55" : (blink ? "30" : "12");

  ctx.save();
  ctx.fillStyle = color + bgAlpha;
  ctx.fillRect(btnX, btnY, btnW, btnH);
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = isConfirming ? 24 : (blink ? 14 : 6);
  ctx.lineWidth = 2;
  ctx.strokeRect(btnX, btnY, btnW, btnH);
  ctx.shadowBlur = 0;

  ctx.fillStyle = color;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    isConfirming ? "CONFIRMADO!" : "[ ENTER ] CONFIRMAR",
    CANVAS_WIDTH / 2,
    btnY + 33
  );
  ctx.restore();
}

// ---------- Intro: Inimigos (1 vez por zona, conteúdo específico) ----------
type EnemyIntroEntry = {
  title: string;
  iconType: "drone" | "tracker" | "turret" | "boss";
  body: string;
  glow: string;
  description: string[];
};

function renderEnemiesIntroCard(
  ctx: CanvasRenderingContext2D,
  time: number,
  zone: "streets" | "ducts" | "boss",
  confirmAnim: number
) {
  // Configuração por zona: subtítulo + narrativa + lista de inimigos a exibir
  let zoneLabel = "";
  let title = "";
  let narrative: string[] = [];
  let entries: EnemyIntroEntry[] = [];

  if (zone === "streets") {
    zoneLabel = "ZONA 1 — AS RUAS";
    title = "RECONHECIMENTO INIMIGO";
    narrative = [
      '"Os primeiros drones de patrulha estao vigiando a area.',
      'Eles nao atacam a distancia, mas o contato direto e perigoso. Cuidado."',
    ];
    entries = [{
      title: "DRONE",
      iconType: "drone",
      body: COLORS.droneBody,
      glow: COLORS.droneGlow,
      description: [
        "Patrulheiro autonomo de rota fixa.",
        "",
        "AMEACA: 1 / 5",
        "  HP: 1   Pontos: +10",
        "",
        "Move-se entre dois pontos sem",
        "atacar. O dano vem do contato",
        "fisico — desvie e siga em frente.",
        "",
        "DICA: ainda nao tem arma; use o",
        "pulo para escapar.",
      ],
    }];
  } else if (zone === "ducts") {
    zoneLabel = "ZONA 2 — ESTRUTURAS ELEVADAS";
    title = "AMEACAS REFORCADAS";
    narrative = [
      '"A IA reagiu. Os drones aceleraram e agora ha sentinelas',
      'fixas atirando a distancia. Mantenha o ritmo — nao pare."',
    ];
    entries = [
      {
        title: "DRONE RAPIDO",
        iconType: "drone",
        body: COLORS.droneBody,
        glow: COLORS.droneGlow,
        description: [
          "Versao acelerada do drone basico.",
          "",
          "AMEACA: 2 / 5",
          "  HP: 1   Pontos: +10",
          "",
          "Patrulha mais rapido que na Zona 1",
          "(velocidade 3.5 u/s). Mesma ideia:",
          "evite contato fisico.",
          "",
          "Agora voce ja tem arma — mire",
          "e desfaca os mais incomodos.",
        ],
      },
      {
        title: "ATIRADOR",
        iconType: "turret",
        body: COLORS.turretBody,
        glow: COLORS.turretGlow,
        description: [
          "Sentinela fixa, armada com blaster.",
          "",
          "AMEACA: 4 / 5",
          "  HP: 3   Pontos: +40",
          "",
          "Fica parado em chao ou plataforma.",
          "Dispara projeteis a cada 2.5s.",
          "Use plataformas como cobertura.",
          "",
          "DICA: ao destruir, dropa",
          "+5 de municao bonus.",
        ],
      },
    ];
  } else {
    // boss
    zoneLabel = "ZONA 3 — CONFRONTO FINAL";
    title = "OMNICORE EM CAMPO";
    narrative = [
      '"O OMNICORE e o nucleo da rede que controla tudo isso.',
      'Vai invocar rastreadores em ondas. Foque no nucleo, mas nao ignore os cacadores."',
    ];
    entries = [
      {
        title: "OMNICORE",
        iconType: "boss",
        body: COLORS.bossBody,
        glow: COLORS.bossGlow,
        description: [
          "Boss final. 3 fases progressivas.",
          "",
          "AMEACA: 5 / 5",
          "  HP: 15   Pontos: +500",
          "",
          "Contato causa 2 de dano (dobro).",
          "Cada fase reduz o cooldown e",
          "intensifica os ataques.",
          "",
          "DICA: use as plataformas elevadas",
          "para evitar tiros e abater rapido.",
        ],
      },
      {
        title: "RASTREADOR",
        iconType: "tracker",
        body: COLORS.trackerBody,
        glow: COLORS.trackerGlow,
        description: [
          "Invocado pelo boss durante a luta.",
          "",
          "AMEACA: 3 / 5",
          "  HP: 2   Pontos: +25",
          "",
          "Detecta voce e parte para",
          "perseguicao agressiva. Aparece",
          "em ondas de 3 unidades.",
          "",
          "DICA: priorize abater para nao",
          "ser cercado durante o combate.",
        ],
      },
    ];
  }

  // Banner
  ctx.fillStyle = COLORS.red;
  ctx.shadowColor = COLORS.red;
  ctx.shadowBlur = 18;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(zoneLabel, CANVAS_WIDTH / 2, 70);
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 18;
  ctx.font = "bold 32px monospace";
  ctx.fillText(title, CANVAS_WIDTH / 2, 115);
  ctx.shadowBlur = 0;

  // Narrativa
  ctx.fillStyle = COLORS.white + "cc";
  ctx.font = "italic 14px monospace";
  narrative.forEach((line, i) => {
    ctx.fillText(line, CANVAS_WIDTH / 2, 150 + i * 22);
  });

  // Cards (centralizados de acordo com a quantidade)
  const cardW = entries.length === 1 ? 480 : 380;
  const cardH = 360;
  const gap = 24;
  const totalW = cardW * entries.length + gap * (entries.length - 1);
  const startX = CANVAS_WIDTH / 2 - totalW / 2;
  const cardY = 210;

  entries.forEach((entry, i) => {
    drawEnemyInfoCard(
      ctx,
      startX + (cardW + gap) * i,
      cardY,
      cardW,
      cardH,
      entry.title,
      entry.body,
      entry.glow,
      entry.iconType,
      entry.description,
      time
    );
  });

  // Prompt — botão grande e claro
  drawConfirmButton(ctx, time, confirmAnim);
}

function drawEnemyInfoCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  title: string,
  color: string, glowColor: string,
  iconType: "drone" | "tracker" | "turret" | "boss",
  description: string[],
  time: number
) {
  ctx.save();

  // Fundo do card
  ctx.fillStyle = "#0c0c1e";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14 + Math.sin(time * 0.05) * 3;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0;

  // Área do ícone — boss usa caixa maior
  const iconCX = x + w / 2;
  const iconCY = y + 80;
  const iconW = iconType === "boss" ? 90 : 48;
  const iconH = iconType === "boss" ? 76 : 38;

  const fakeEnemy = {
    x: iconCX - iconW / 2,
    y: iconCY - iconH / 2,
    width: iconW,
    height: iconH,
    vx: 0, vy: 0, type: iconType, health: 1, maxHealth: 1, alive: true,
    direction: "right" as const,
    shootCooldown: 0, shootTimer: 0, patrolMinX: 0, patrolMaxX: 0,
    animTimer: 0, trackingPlayer: false,
    bossPhase: 1,
  };

  if (iconType === "drone") {
    renderDrone(ctx, fakeEnemy.x, fakeEnemy.y, fakeEnemy as never, time);
  } else if (iconType === "tracker") {
    renderTracker(ctx, fakeEnemy.x, fakeEnemy.y, fakeEnemy as never, time);
  } else if (iconType === "turret") {
    renderTurret(ctx, fakeEnemy.x, fakeEnemy.y, fakeEnemy as never, time);
  } else {
    renderBoss(ctx, fakeEnemy.x, fakeEnemy.y, fakeEnemy as never, time);
  }

  // Título
  ctx.fillStyle = color;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText(title, x + w / 2, y + 140);
  ctx.shadowBlur = 0;

  // Descrição
  ctx.fillStyle = COLORS.white + "cc";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  description.forEach((line, i) => {
    ctx.fillText(line, x + 22, y + 168 + i * 17);
  });

  ctx.restore();
}

// ---------- Intro: Coletáveis (primeira aparição) ----------
function renderCollectiblesIntroCard(ctx: CanvasRenderingContext2D, time: number, confirmAnim: number) {
  // Banner
  ctx.fillStyle = COLORS.neonGreen;
  ctx.shadowColor = COLORS.neonGreen;
  ctx.shadowBlur = 18;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText("RECURSOS DA ZONA — INSPECAO", CANVAS_WIDTH / 2, 70);
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 18;
  ctx.font = "bold 32px monospace";
  ctx.fillText("ITENS COLETAVEIS", CANVAS_WIDTH / 2, 115);
  ctx.shadowBlur = 0;

  // Narrativa
  ctx.fillStyle = COLORS.white + "cc";
  ctx.font = "italic 14px monospace";
  ctx.fillText('"Cada bolinha encontrada pelo caminho conta.', CANVAS_WIDTH / 2, 150);
  ctx.fillText('Vida mantem voce de pe, dados aumentam sua pontuacao final."', CANVAS_WIDTH / 2, 172);

  // 2 cards (vida + chip de dados — munição é apresentada junto com a arma na Zona 2)
  const cardW = 420;
  const cardH = 360;
  const gap = 30;
  const totalW = cardW * 2 + gap;
  const startX = CANVAS_WIDTH / 2 - totalW / 2;
  const cardY = 210;

  drawPickupInfoCard(
    ctx, startX, cardY, cardW, cardH,
    "VIDA",
    COLORS.healthPickup, COLORS.healthPickupGlow,
    "health",
    [
      "Recupera saude perdida.",
      "",
      "EFEITO: +1 de vida",
      "",
      "Cor: rosa-coral pulsante.",
      "",
      "Uso: a vida nao regenera",
      "sozinha — pegue toda que",
      "encontrar antes de zonas",
      "mais perigosas.",
    ],
    time
  );

  drawPickupInfoCard(
    ctx, startX + cardW + gap, cardY, cardW, cardH,
    "CHIP DE DADOS",
    COLORS.dataChip, COLORS.dataChipGlow,
    "data_chip",
    [
      "Pontuacao bonus.",
      "",
      "EFEITO: +100 de score",
      "",
      "Cor: dourado quente.",
      "",
      "Uso: nao da habilidade,",
      "mas conta no ranking final.",
      "Pegue todos para 100%.",
    ],
    time
  );

  // Prompt — botão grande e claro
  drawConfirmButton(ctx, time, confirmAnim);
}

function drawPickupInfoCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  title: string,
  color: string, glowColor: string,
  type: "health" | "ammo" | "data_chip",
  description: string[],
  time: number
) {
  ctx.save();

  // Fundo
  ctx.fillStyle = "#0c0c1e";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14 + Math.sin(time * 0.05) * 3;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0;

  // Ícone (reusa o renderCollectible com fake)
  const iconCX = x + w / 2;
  const iconCY = y + 70;
  const fakeCol = {
    x: iconCX - 18, y: iconCY - 18, width: 36, height: 36,
    type, collected: false, animTimer: 0, value: 0,
  };
  // Usa renderCollectible com camera 0,0
  renderCollectible(ctx, fakeCol as never, 0, 0, time);

  // Título
  ctx.fillStyle = color;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText(title, x + w / 2, y + 140);
  ctx.shadowBlur = 0;

  // Descrição
  ctx.fillStyle = COLORS.white + "cc";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  description.forEach((line, i) => {
    ctx.fillText(line, x + 22, y + 168 + i * 17);
  });

  ctx.restore();
}

function renderWeaponUnlockCard(ctx: CanvasRenderingContext2D, time: number, confirmAnim: number) {
  // Banner superior
  ctx.fillStyle = COLORS.neonGreen;
  ctx.shadowColor = COLORS.neonGreen;
  ctx.shadowBlur = 20;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ZONA 2 DESBLOQUEADA", CANVAS_WIDTH / 2, 80);
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 24;
  ctx.font = "bold 38px monospace";
  ctx.fillText("VOCE GANHOU UMA ARMA", CANVAS_WIDTH / 2, 130);
  ctx.shadowBlur = 0;

  // Subtexto
  ctx.fillStyle = COLORS.white + "cc";
  ctx.font = "italic 14px monospace";
  ctx.fillText("Aprenda a arma e o recurso que a alimenta:", CANVAS_WIDTH / 2, 160);

  // Dois cards lado a lado: BLASTER e MUNIÇÃO
  const cardW = 480;
  const cardH = 380;
  const gap = 30;
  const totalW = cardW * 2 + gap;
  const startX = CANVAS_WIDTH / 2 - totalW / 2;
  const cardY = 195;

  // === Card 1: BLASTER PADRAO ===
  ctx.fillStyle = "#0e0e22";
  ctx.fillRect(startX, cardY, cardW, cardH);
  ctx.strokeStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 14 + Math.sin(time * 0.05) * 3;
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, cardY, cardW, cardH);
  ctx.shadowBlur = 0;

  // Ícone arma centralizado
  const gunCX = startX + cardW / 2;
  const gunCY = cardY + 80;
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 14;
  ctx.fillRect(gunCX - 32, gunCY - 5, 60, 11);
  ctx.fillRect(gunCX + 26, gunCY - 11, 16, 22);
  ctx.fillRect(gunCX - 42, gunCY + 6, 16, 9);
  ctx.shadowBlur = 0;

  // Título
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 10;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText("BLASTER PADRAO", gunCX, cardY + 145);
  ctx.shadowBlur = 0;

  // Descrição
  ctx.fillStyle = COLORS.white + "cc";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  const gunLines = [
    "Tiro unico de longo alcance.",
    "",
    "MECANICAS:",
    "  - Pressione J ou clique para atirar",
    "  - Cada disparo gasta 1 de municao",
    "  - Direcao segue para onde voce olha",
    "",
    "DICA: na Zona Final voce escolhe",
    "um upgrade — espingarda ou rapido.",
  ];
  gunLines.forEach((line, i) => {
    ctx.fillText(line, startX + 30, cardY + 178 + i * 19);
  });

  // === Card 2: MUNIÇÃO ===
  const ammoCardX = startX + cardW + gap;
  ctx.fillStyle = "#0e0e22";
  ctx.fillRect(ammoCardX, cardY, cardW, cardH);
  ctx.strokeStyle = COLORS.ammoPickup;
  ctx.shadowColor = COLORS.ammoPickupGlow;
  ctx.shadowBlur = 14 + Math.sin(time * 0.05) * 3;
  ctx.lineWidth = 2;
  ctx.strokeRect(ammoCardX, cardY, cardW, cardH);
  ctx.shadowBlur = 0;

  // Ícone do coletável de munição
  const ammoIconCX = ammoCardX + cardW / 2;
  const ammoIconCY = cardY + 80;
  const fakeAmmoCol = {
    x: ammoIconCX - 18, y: ammoIconCY - 18, width: 36, height: 36,
    type: "ammo" as const, collected: false, animTimer: 0, value: 0,
  };
  renderCollectible(ctx, fakeAmmoCol as never, 0, 0, time);

  // Título
  ctx.fillStyle = COLORS.ammoPickup;
  ctx.shadowColor = COLORS.ammoPickupGlow;
  ctx.shadowBlur = 10;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText("MUNICAO", ammoIconCX, cardY + 145);
  ctx.shadowBlur = 0;

  // Descrição
  ctx.fillStyle = COLORS.white + "cc";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  const ammoLines = [
    "Recarrega o blaster.",
    "",
    "EFEITO: +10 municoes",
    "",
    "Cor: turquesa suave pulsante.",
    "",
    "Sem municao a arma para de",
    "atirar — colete sempre que",
    "encontrar pelo caminho.",
    "",
    "DICA: atiradores derrubados",
    "dropam +5 de municao bonus.",
  ];
  ammoLines.forEach((line, i) => {
    ctx.fillText(line, ammoCardX + 30, cardY + 178 + i * 17);
  });

  // Botão de confirmação
  drawConfirmButton(ctx, time, confirmAnim);
}

function renderWeaponChoiceCard(
  ctx: CanvasRenderingContext2D,
  selection: number,
  time: number,
  confirmAnim: number
) {
  // Banner
  ctx.fillStyle = COLORS.magenta;
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 20;
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ZONA FINAL DESBLOQUEADA", CANVAS_WIDTH / 2, 80);
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.yellow;
  ctx.shadowColor = COLORS.yellow;
  ctx.shadowBlur = 24;
  ctx.font = "bold 38px monospace";
  ctx.fillText("ESCOLHA SEU UPGRADE", CANVAS_WIDTH / 2, 140);
  ctx.shadowBlur = 0;

  ctx.fillStyle = COLORS.white + "80";
  ctx.font = "13px monospace";
  ctx.fillText("Use SETA ESQUERDA / SETA DIREITA para selecionar", CANVAS_WIDTH / 2, 168);

  // Dois cards lado a lado
  const cardW = 380;
  const cardH = 360;
  const gap = 40;
  const totalW = cardW * 2 + gap;
  const startX = CANVAS_WIDTH / 2 - totalW / 2;
  const cardY = 200;

  drawUpgradeCard(
    ctx,
    startX,
    cardY,
    cardW,
    cardH,
    selection === 0,
    "ESPINGARDA",
    COLORS.orange,
    [
      "Dispara 3 projeteis em leque.",
      "",
      "VANTAGENS:",
      "  - Cobertura ampla",
      "  - Forte contra grupos",
      "  - Damage burst alto",
      "",
      "CUSTO: 1 municao por disparo",
      "(rajada economica)",
    ],
    time,
    "shotgun"
  );

  drawUpgradeCard(
    ctx,
    startX + cardW + gap,
    cardY,
    cardW,
    cardH,
    selection === 1,
    "TIRO RAPIDO",
    COLORS.yellow,
    [
      "Cooldown reduzido pela metade.",
      "",
      "VANTAGENS:",
      "  - Ritmo de fogo dobrado",
      "  - Preciso e linear",
      "  - Forte contra alvo unico",
      "",
      "CUSTO: 1 municao por tiro",
      "(consumo mais rapido)",
    ],
    time,
    "rapid"
  );

  // Prompt — botão de confirmar (escolha de upgrade requer Enter)
  drawConfirmButton(ctx, time, confirmAnim);
}

function drawUpgradeCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  selected: boolean,
  title: string,
  color: string,
  description: string[],
  time: number,
  iconType: "shotgun" | "rapid"
) {
  ctx.save();

  // Card
  ctx.fillStyle = selected ? "#161630" : "#0e0e22";
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = selected ? color : color + "40";
  ctx.shadowColor = color;
  ctx.shadowBlur = selected ? 20 + Math.sin(time * 0.1) * 4 : 6;
  ctx.lineWidth = selected ? 3 : 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0;

  // Ícone
  const iconCX = x + w / 2;
  const iconCY = y + 70;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;

  if (iconType === "shotgun") {
    // Três projéteis em leque
    for (let i = -1; i <= 1; i++) {
      const angle = i * 0.25;
      const len = 28;
      const ex = iconCX + Math.cos(angle) * len;
      const ey = iconCY + Math.sin(angle) * len;
      ctx.fillRect(iconCX - 4, iconCY - 2, 8, 4);
      ctx.fillRect(ex - 3, ey - 2, 6, 4);
    }
  } else {
    // Setas duplas indicando velocidade
    for (let i = 0; i < 4; i++) {
      const offsetX = -30 + i * 18;
      ctx.beginPath();
      ctx.moveTo(iconCX + offsetX, iconCY - 8);
      ctx.lineTo(iconCX + offsetX + 10, iconCY);
      ctx.lineTo(iconCX + offsetX, iconCY + 8);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;

  // Título
  ctx.fillStyle = selected ? color : COLORS.white;
  ctx.shadowColor = color;
  ctx.shadowBlur = selected ? 10 : 0;
  ctx.font = "bold 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText(title, x + w / 2, y + 130);
  ctx.shadowBlur = 0;

  // Descrição
  ctx.fillStyle = COLORS.white + "cc";
  ctx.font = "13px monospace";
  ctx.textAlign = "left";
  description.forEach((line, i) => {
    ctx.fillText(line, x + 30, y + 165 + i * 19);
  });

  // Indicador de seleção (triângulo na base)
  if (selected) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    const tx = x + w / 2;
    const ty = y + h - 14;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - 8, ty - 10);
    ctx.lineTo(tx + 8, ty - 10);
    ctx.closePath();
    ctx.fill();
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
function renderPauseOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Título
  ctx.fillStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 24;
  ctx.font = "bold 56px monospace";
  ctx.textAlign = "center";
  ctx.fillText(">>> PAUSADO <<<", CANVAS_WIDTH / 2, 150);
  ctx.shadowBlur = 0;

  // Card de estatísticas
  const cardX = CANVAS_WIDTH / 2 - 280;
  const cardY = 200;
  const cardW = 560;
  const cardH = 320;

  ctx.fillStyle = "#0a0a1c";
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = COLORS.cyan;
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.strokeRect(cardX, cardY, cardW, cardH);
  ctx.shadowBlur = 0;

  // Linha decorativa abaixo do título do card
  const phaseName =
    state.currentPhase === 1 ? "AS RUAS"
    : state.currentPhase === 2 ? "ESTRUTURAS ELEVADAS"
    : "CONFRONTO FINAL";

  ctx.fillStyle = COLORS.magenta;
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 8;
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`FASE ${state.currentPhase} — ${phaseName}`, CANVAS_WIDTH / 2, cardY + 40);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = COLORS.cyan + "30";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardX + 30, cardY + 60);
  ctx.lineTo(cardX + cardW - 30, cardY + 60);
  ctx.stroke();

  // Stats em linhas (label esquerda, valor colorido à direita)
  const totalSeconds = Math.floor(state.time / 60);
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");

  const stats: [string, string, string][] = [
    ["TEMPO DA FASE", `${mm}:${ss}`, COLORS.white],
    ["VIDA", `${state.player.health} / ${state.player.maxHealth}`, COLORS.healthPickup],
    ["MUNICAO", state.player.canShoot ? `${state.player.ammo}` : "BLOQUEADA", COLORS.ammoPickup],
    ["INIMIGOS ABATIDOS", `${state.killCount}`, COLORS.dataChip],
    ["PONTUACAO", `${state.player.score}`, COLORS.hudScore],
  ];

  ctx.font = "bold 16px monospace";
  stats.forEach((row, i) => {
    const y = cardY + 95 + i * 36;
    ctx.fillStyle = COLORS.white + "aa";
    ctx.textAlign = "left";
    ctx.fillText(row[0], cardX + 40, y);
    ctx.fillStyle = row[2];
    ctx.shadowColor = row[2];
    ctx.shadowBlur = 6;
    ctx.textAlign = "right";
    ctx.fillText(row[1], cardX + cardW - 40, y);
    ctx.shadowBlur = 0;
  });

  // Instruções no rodapé
  const btnY = cardY + cardH + 30;
  ctx.fillStyle = COLORS.neonGreen;
  ctx.shadowColor = COLORS.neonGreen;
  ctx.shadowBlur = 8;
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.fillText("[ P ] CONTINUAR", CANVAS_WIDTH / 2 - 130, btnY);
  ctx.fillStyle = COLORS.red;
  ctx.shadowColor = COLORS.red;
  ctx.fillText("[ ESC ] SAIR AO MENU", CANVAS_WIDTH / 2 + 130, btnY);
  ctx.shadowBlur = 0;

  ctx.restore();
}

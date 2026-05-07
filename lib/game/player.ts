// ============================
// Neon Escape - Player Logic
// ============================

import type { Player, GameState, InputState, Projectile } from "./types";
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_ACCEL,
  PLAYER_DECEL,
  PLAYER_JUMP_FORCE,
  PLAYER_MAX_HEALTH,
  PLAYER_START_AMMO,
  PLAYER_SHOOT_COOLDOWN,
  PLAYER_SHOOT_COOLDOWN_RAPID,
  SHOTGUN_PELLETS,
  SHOTGUN_SPREAD,
  PLAYER_INVINCIBLE_TIME,
  PLAYER_COYOTE_TIME,
  PLAYER_JUMP_BUFFER,
  PLAYER_JUMP_CUT_MULT,
  LANDING_FALL_THRESHOLD,
  HIT_STOP_FRAMES_BIG,
  PLAYER_BULLET_SPEED,
  PLAYER_BULLET_DAMAGE,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  GRAVITY,
  MAX_FALL_SPEED,
  VOID_Y,
  GROUND_Y,
  TRAIL_LENGTH,
  COLORS,
} from "./constants";
import { aabb, isLandingOnTop } from "./collisions";
import { getPlayerSpeedMultiplier } from "./settings";
import { playJumpSound, playShootSound, playHitSound } from "./audio";
import {
  createExplosionParticles,
  createLandingDustParticles,
  createJumpDustParticles,
} from "./particles";
import { shakeCamera } from "./camera";

function spawnLandingDust(state: GameState, x: number, y: number, fallSpeed: number) {
  state.particles.push(...createLandingDustParticles(x, y, fallSpeed));
}

export function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    direction: "right",
    health: PLAYER_MAX_HEALTH,
    maxHealth: PLAYER_MAX_HEALTH,
    ammo: PLAYER_START_AMMO,
    score: 0,
    isGrounded: false,
    isJumping: false,
    isShooting: false,
    shootCooldown: 0,
    invincible: false,
    invincibleTimer: 0,
    animFrame: 0,
    animTimer: 0,
    alive: true,
    canShoot: false,
    weaponMode: "none",
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    jumpHeld: false,
    prevVy: 0,
    jumpAnimTimer: 0,
    landAnimTimer: 0,
    muzzleFlashTimer: 0,
    noDamageTimer: 0,
  };
}

export function updatePlayer(
  state: GameState,
  input: InputState
): { newProjectiles: Projectile[] } {
  const player = state.player;
  if (!player.alive) return { newProjectiles: [] };

  // Horizontal movement com aceleração/desaceleração suave
  // Velocidade modulada pelo multiplicador das configurações (50-200%)
  const speedMult = getPlayerSpeedMultiplier();
  const maxSpeed = PLAYER_SPEED * speedMult;
  const accel = PLAYER_ACCEL * speedMult;
  const decel = PLAYER_DECEL * speedMult;
  const targetVx = input.right ? maxSpeed : input.left ? -maxSpeed : 0;

  if (targetVx !== 0) {
    // Acelerando em direção ao alvo
    const diff = targetVx - player.vx;
    player.vx += Math.sign(diff) * Math.min(accel, Math.abs(diff));
    player.direction = targetVx > 0 ? "right" : "left";
  } else {
    // Desacelerando até parar
    if (Math.abs(player.vx) <= decel) {
      player.vx = 0;
    } else {
      player.vx -= Math.sign(player.vx) * decel;
    }
  }

  // Jump buffer: armazena pressão de pulo para usar quando tocar o chão
  if (input.jumpPressed) {
    player.jumpBufferTimer = PLAYER_JUMP_BUFFER;
  } else if (player.jumpBufferTimer > 0) {
    player.jumpBufferTimer--;
  }

  // Coyote time + buffer de pulo: pode pular se estava no chão até PLAYER_COYOTE_TIME frames atrás
  const canJump = player.coyoteTimer > 0 || player.isGrounded;
  if (player.jumpBufferTimer > 0 && canJump) {
    player.vy = PLAYER_JUMP_FORCE;
    player.isGrounded = false;
    player.isJumping = true;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.jumpHeld = true;
    player.jumpAnimTimer = 8; // squash inicial (sprite estica)
    playJumpSound();
    state.particles.push(
      ...createJumpDustParticles(player.x + player.width / 2, player.y + player.height)
    );
  }

  // Decai os timers de animação
  if (player.jumpAnimTimer > 0) player.jumpAnimTimer--;
  if (player.landAnimTimer > 0) player.landAnimTimer--;
  if (player.muzzleFlashTimer > 0) player.muzzleFlashTimer--;

  // Variable jump height: soltar a tecla de pulo cedo encurta o salto
  if (player.jumpHeld && !input.jump && player.vy < 0) {
    player.vy *= PLAYER_JUMP_CUT_MULT;
    player.jumpHeld = false;
  }
  if (player.vy >= 0) player.jumpHeld = false;

  // Salva vy antes da gravidade para detectar pouso forte abaixo
  player.prevVy = player.vy;

  // Gravity
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

  // Apply velocity
  player.x += player.vx;
  player.y += player.vy;

  // Platform collisions
  const wasGrounded = player.isGrounded;
  player.isGrounded = false;
  for (const platform of state.platforms) {
    // Drop-through: S/↓ permite cair por plataformas flutuantes (não-chão)
    const isGroundPlatform = platform.y >= GROUND_Y;
    if (input.down && !isGroundPlatform) continue;

    const playerRect = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height,
    };
    const platRect = {
      x: platform.x,
      y: platform.y,
      width: platform.width,
      height: platform.height,
    };

    if (isLandingOnTop(playerRect, platRect, player.vy)) {
      const fallSpeed = player.prevVy;
      player.y = platform.y - player.height;
      player.vy = 0;
      player.isGrounded = true;
      player.isJumping = false;

      // Dust ao pousar de uma altura considerável + squash anim
      if (!wasGrounded) {
        player.landAnimTimer = 6; // achatar sprite por 6 frames
        if (fallSpeed >= LANDING_FALL_THRESHOLD) {
          spawnLandingDust(state, player.x + player.width / 2, platform.y, fallSpeed);
        }
      }
    }
  }

  // Coyote time: ao sair do chão sem ter pulado, ainda pode pular por alguns frames
  if (wasGrounded && !player.isGrounded && !player.isJumping) {
    player.coyoteTimer = PLAYER_COYOTE_TIME;
  } else if (player.coyoteTimer > 0) {
    player.coyoteTimer--;
  }

  // Void death (cair em buracos entre plataformas)
  if (player.y > VOID_Y) {
    player.health = 0;
    player.alive = false;
    return { newProjectiles: [] };
  }

  // Left boundary
  if (player.x < 0) player.x = 0;
  // Right boundary
  const maxX = state.level.totalWidth - player.width;
  if (player.x > maxX) player.x = maxX;

  // Boss arena lock — uma vez na zona boss com boss vivo, não pode voltar
  const bossSection = state.level.sections.boss;
  const bossAlive = state.enemies.some(e => e.type === "boss" && e.alive);
  if (bossAlive && state.currentZone === "boss" && player.x < bossSection.startX) {
    player.x = bossSection.startX;
  }

  // Invincibility timer
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }

  // Shooting (bloqueado até o jogador desbloquear a arma na fase 2)
  const newProjectiles: Projectile[] = [];
  if (player.shootCooldown > 0) player.shootCooldown--;

  const canFireNow =
    player.canShoot &&
    input.shootPressed &&
    player.shootCooldown <= 0 &&
    player.ammo > 0;

  if (canFireNow) {
    player.ammo--;
    player.shootCooldown =
      player.weaponMode === "rapid"
        ? PLAYER_SHOOT_COOLDOWN_RAPID
        : PLAYER_SHOOT_COOLDOWN;
    player.isShooting = true;
    player.muzzleFlashTimer = 4; // muzzle flash por 4 frames

    // Tiro crítico (1/10): dano dobrado, cor e tamanho diferentes
    const isCrit = Math.random() < 0.1;
    const damage = isCrit ? PLAYER_BULLET_DAMAGE * 2 : PLAYER_BULLET_DAMAGE;
    const bulletColor = isCrit ? COLORS.yellow : COLORS.bulletPlayer;
    const bulletW = isCrit ? BULLET_WIDTH + 4 : BULLET_WIDTH;
    const bulletH = isCrit ? BULLET_HEIGHT + 2 : BULLET_HEIGHT;

    const bulletX =
      player.direction === "right"
        ? player.x + player.width
        : player.x - bulletW;
    const bulletY = player.y + player.height * 0.35;
    const dirSign = player.direction === "right" ? 1 : -1;

    if (player.weaponMode === "shotgun") {
      // Leque de SHOTGUN_PELLETS projéteis
      const half = (SHOTGUN_PELLETS - 1) / 2;
      for (let i = 0; i < SHOTGUN_PELLETS; i++) {
        const angle = (i - half) * SHOTGUN_SPREAD;
        const vx = Math.cos(angle) * PLAYER_BULLET_SPEED * dirSign;
        const vy = Math.sin(angle) * PLAYER_BULLET_SPEED;
        newProjectiles.push({
          x: bulletX,
          y: bulletY,
          width: bulletW,
          height: bulletH,
          vx,
          vy,
          owner: "player",
          damage,
          alive: true,
          trail: [],
          color: bulletColor,
        });
      }
    } else {
      newProjectiles.push({
        x: bulletX,
        y: bulletY,
        width: bulletW,
        height: bulletH,
        vx: PLAYER_BULLET_SPEED * dirSign,
        vy: 0,
        owner: "player",
        damage,
        alive: true,
        trail: [],
        color: bulletColor,
      });
    }

    playShootSound();
  } else {
    player.isShooting = false;
  }

  // Animation timer
  player.animTimer++;
  if (player.animTimer > 8) {
    player.animTimer = 0;
    player.animFrame = (player.animFrame + 1) % 4;
  }

  // Enemy collision (contact damage)
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;
    if (
      aabb(
        { x: player.x, y: player.y, width: player.width, height: player.height },
        { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
      )
    ) {
      // GDD: contato com boss causa 2 HP de dano, demais inimigos 1 HP
      const contactDamage = enemy.type === "boss" ? 2 : 1;
      damagePlayer(player, contactDamage, state);
    }
  }

  // Collectible pickup
  for (const collectible of state.collectibles) {
    if (collectible.collected) continue;
    if (
      aabb(
        { x: player.x, y: player.y, width: player.width, height: player.height },
        {
          x: collectible.x,
          y: collectible.y,
          width: collectible.width,
          height: collectible.height,
        }
      )
    ) {
      collectible.collected = true;
      switch (collectible.type) {
        case "health":
          player.health = Math.min(player.maxHealth, player.health + collectible.value);
          break;
        case "ammo":
          player.ammo += collectible.value;
          break;
        case "data_chip":
          player.score += collectible.value;
          break;
      }
      // Particles are spawned elsewhere
    }
  }

  return { newProjectiles };
}

export function damagePlayer(player: Player, damage: number, state: GameState) {
  if (player.invincible || !player.alive) return;
  // Cheat de desenvolvedor: God Mode bloqueia todo o dano (mantém i-frames visuais)
  if (state.cheatInvincible) {
    player.invincible = true;
    player.invincibleTimer = 30;
    return;
  }

  player.health -= damage;
  player.invincible = true;
  player.invincibleTimer = PLAYER_INVINCIBLE_TIME;
  player.noDamageTimer = 0; // reseta contador de regen

  playHitSound();
  shakeCamera(state.camera, 6, 14);
  state.damageFlashTimer = 15; // GDD: tela pisca vermelho ao receber dano
  state.hitStopTimer = HIT_STOP_FRAMES_BIG; // freeze frame para "peso" no impacto

  // Knockback leve oposto ao centro do player → empurra para longe
  player.vx -= Math.sign(player.vx || 1) * 2;
  if (player.isGrounded) player.vy = -4;

  state.particles.push(
    ...createExplosionParticles(
      player.x + player.width / 2,
      player.y + player.height / 2,
      COLORS.red,
      12
    )
  );

  if (player.health <= 0) {
    player.alive = false;
    player.health = 0;
  }
}

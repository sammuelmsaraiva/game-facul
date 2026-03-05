// ============================
// Chrome Rebel - Player Logic
// ============================

import type { Player, GameState, InputState, Projectile } from "./types";
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SPEED,
  PLAYER_JUMP_FORCE,
  PLAYER_MAX_HEALTH,
  PLAYER_START_AMMO,
  PLAYER_SHOOT_COOLDOWN,
  PLAYER_INVINCIBLE_TIME,
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
import { playJumpSound, playShootSound, playHitSound } from "./audio";
import { createExplosionParticles } from "./particles";
import { shakeCamera } from "./camera";

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
  };
}

export function updatePlayer(
  state: GameState,
  input: InputState
): { newProjectile: Projectile | null } {
  const player = state.player;
  if (!player.alive) return { newProjectile: null };

  // Horizontal movement
  player.vx = 0;
  if (input.left) {
    player.vx = -PLAYER_SPEED;
    player.direction = "left";
  }
  if (input.right) {
    player.vx = PLAYER_SPEED;
    player.direction = "right";
  }

  // Jump
  if (input.jumpPressed && player.isGrounded) {
    player.vy = PLAYER_JUMP_FORCE;
    player.isGrounded = false;
    player.isJumping = true;
    playJumpSound();
  }

  // Gravity
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

  // Apply velocity
  player.x += player.vx;
  player.y += player.vy;

  // Platform collisions
  player.isGrounded = false;
  for (const platform of state.platforms) {
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
      player.y = platform.y - player.height;
      player.vy = 0;
      player.isGrounded = true;
      player.isJumping = false;
    }
  }

  // Ground collision
  if (player.y + player.height >= GROUND_Y) {
    player.y = GROUND_Y - player.height;
    player.vy = 0;
    player.isGrounded = true;
    player.isJumping = false;
  }

  // Void death
  if (player.y > VOID_Y) {
    player.health = 0;
    player.alive = false;
    return { newProjectile: null };
  }

  // Left boundary
  if (player.x < 0) player.x = 0;
  // Right boundary
  const maxX = state.level.totalWidth - player.width;
  if (player.x > maxX) player.x = maxX;

  // Boss arena lock
  const bossSection = state.level.sections.boss;
  if (player.x >= bossSection.startX && player.x < bossSection.startX + 10) {
    // Once entered, can't go back
  }

  // Invincibility timer
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }

  // Shooting
  let newProjectile: Projectile | null = null;
  if (player.shootCooldown > 0) player.shootCooldown--;

  if (input.shootPressed && player.shootCooldown <= 0 && player.ammo > 0) {
    player.ammo--;
    player.shootCooldown = PLAYER_SHOOT_COOLDOWN;
    player.isShooting = true;

    const bulletX =
      player.direction === "right"
        ? player.x + player.width
        : player.x - BULLET_WIDTH;
    const bulletY = player.y + player.height * 0.35;

    newProjectile = {
      x: bulletX,
      y: bulletY,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      vx: player.direction === "right" ? PLAYER_BULLET_SPEED : -PLAYER_BULLET_SPEED,
      vy: 0,
      owner: "player",
      damage: PLAYER_BULLET_DAMAGE,
      alive: true,
      trail: [],
      color: COLORS.bulletPlayer,
    };

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
      damagePlayer(player, 1, state);
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

  return { newProjectile };
}

export function damagePlayer(player: Player, damage: number, state: GameState) {
  if (player.invincible || !player.alive) return;

  player.health -= damage;
  player.invincible = true;
  player.invincibleTimer = PLAYER_INVINCIBLE_TIME;

  playHitSound();
  shakeCamera(state.camera, 4, 10);
  state.particles.push(
    ...createExplosionParticles(
      player.x + player.width / 2,
      player.y + player.height / 2,
      COLORS.red,
      8
    )
  );

  if (player.health <= 0) {
    player.alive = false;
    player.health = 0;
  }
}

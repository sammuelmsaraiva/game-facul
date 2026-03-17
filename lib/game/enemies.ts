// ============================
// Chrome Rebel - Enemy Logic
// ============================

import type { Enemy, Projectile, GameState } from "./types";
import {
  DRONE_WIDTH,
  DRONE_HEIGHT,
  DRONE_SPEED,
  DRONE_HEALTH,
  DRONE_SHOOT_COOLDOWN,
  TRACKER_WIDTH,
  TRACKER_HEIGHT,
  TRACKER_SPEED,
  TRACKER_CHASE_SPEED,
  TRACKER_HEALTH,
  TRACKER_DETECTION_RADIUS,
  TRACKER_LOST_TIME,
  TURRET_WIDTH,
  TURRET_HEIGHT,
  TURRET_HEALTH,
  TURRET_SHOOT_COOLDOWN,
  BOSS_WIDTH,
  BOSS_HEIGHT,
  BOSS_HEALTH,
  BOSS_SHOOT_COOLDOWN_P1,
  BOSS_SHOOT_COOLDOWN_P2,
  BOSS_BULLET_SPREAD,
  ENEMY_BULLET_SPEED,
  ENEMY_BULLET_DAMAGE,
  BULLET_WIDTH,
  BULLET_HEIGHT,
  TRAIL_LENGTH,
  COLORS,
  DRONE_KILL_SCORE,
  TRACKER_KILL_SCORE,
  TURRET_KILL_SCORE,
  BOSS_KILL_SCORE,
  CANVAS_HEIGHT,
} from "./constants";
import { playEnemyShootSound, playEnemyDeathSound, playBossHitSound, playBossPhaseSound } from "./audio";
import { createExplosionParticles } from "./particles";
import { shakeCamera } from "./camera";

export function createDrone(x: number, y: number, patrolMinX: number, patrolMaxX: number): Enemy {
  return {
    x,
    y,
    width: DRONE_WIDTH,
    height: DRONE_HEIGHT,
    vx: DRONE_SPEED,
    vy: 0,
    type: "drone",
    health: DRONE_HEALTH,
    maxHealth: DRONE_HEALTH,
    alive: true,
    direction: "right",
    shootCooldown: DRONE_SHOOT_COOLDOWN,
    shootTimer: Math.random() * DRONE_SHOOT_COOLDOWN,
    patrolMinX,
    patrolMaxX,
    animTimer: 0,
  };
}

export function createTracker(x: number, y: number, patrolMinX: number, patrolMaxX: number): Enemy {
  return {
    x,
    y,
    width: TRACKER_WIDTH,
    height: TRACKER_HEIGHT,
    vx: TRACKER_SPEED,
    vy: 0,
    type: "tracker",
    health: TRACKER_HEALTH,
    maxHealth: TRACKER_HEALTH,
    alive: true,
    direction: "right",
    shootCooldown: 0,
    shootTimer: 0,
    patrolMinX,
    patrolMaxX,
    animTimer: 0,
    trackingPlayer: false,
    lostPlayerTimer: 0,
    homeX: x,
    homeY: y,
  };
}

export function createTurret(x: number, y: number): Enemy {
  return {
    x,
    y,
    width: TURRET_WIDTH,
    height: TURRET_HEIGHT,
    vx: 0,
    vy: 0,
    type: "turret",
    health: TURRET_HEALTH,
    maxHealth: TURRET_HEALTH,
    alive: true,
    direction: "left",
    shootCooldown: TURRET_SHOOT_COOLDOWN,
    shootTimer: Math.random() * TURRET_SHOOT_COOLDOWN,
    patrolMinX: x,
    patrolMaxX: x,
    animTimer: 0,
  };
}

export function createBoss(x: number, y: number): Enemy {
  return {
    x,
    y,
    width: BOSS_WIDTH,
    height: BOSS_HEIGHT,
    vx: 0,
    vy: 0,
    type: "boss",
    health: BOSS_HEALTH,
    maxHealth: BOSS_HEALTH,
    alive: true,
    direction: "left",
    shootCooldown: BOSS_SHOOT_COOLDOWN_P1,
    shootTimer: 0,
    patrolMinX: x - 80,
    patrolMaxX: x + 80,
    animTimer: 0,
    bossPhase: 1,
    bossAttackTimer: 0,
  };
}

export function updateEnemies(state: GameState): Projectile[] {
  const newProjectiles: Projectile[] = [];
  const player = state.player;

  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    enemy.animTimer++;

    // Check if player is near enough to activate
    const distToPlayer = Math.abs(enemy.x - player.x);
    const activationRange = enemy.type === "boss" ? 9999 : enemy.type === "tracker" ? 800 : 600;

    if (distToPlayer > activationRange) continue;

    switch (enemy.type) {
      case "drone":
        updateDrone(enemy, state, newProjectiles);
        break;
      case "tracker":
        updateTracker(enemy, state);
        break;
      case "turret":
        updateTurret(enemy, state, newProjectiles);
        break;
      case "boss":
        updateBoss(enemy, state, newProjectiles);
        break;
    }
  }

  return newProjectiles;
}

function updateDrone(enemy: Enemy, state: GameState, projectiles: Projectile[]) {
  // Patrol movement
  enemy.x += enemy.vx;
  if (enemy.x <= enemy.patrolMinX) {
    enemy.x = enemy.patrolMinX;
    enemy.vx = Math.abs(enemy.vx);
    enemy.direction = "right";
  }
  if (enemy.x >= enemy.patrolMaxX) {
    enemy.x = enemy.patrolMaxX;
    enemy.vx = -Math.abs(enemy.vx);
    enemy.direction = "left";
  }

  // Hover bob
  enemy.y += Math.sin(enemy.animTimer * 0.05) * 0.3;

  // Shoot at player
  enemy.shootTimer++;
  if (enemy.shootTimer >= enemy.shootCooldown) {
    enemy.shootTimer = 0;
    const dirX = state.player.x - enemy.x;
    const dirY = state.player.y - enemy.y;
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len > 0) {
      projectiles.push({
        x: enemy.x + enemy.width / 2,
        y: enemy.y + enemy.height / 2,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        vx: (dirX / len) * ENEMY_BULLET_SPEED,
        vy: (dirY / len) * ENEMY_BULLET_SPEED,
        owner: "enemy",
        damage: ENEMY_BULLET_DAMAGE,
        alive: true,
        trail: [],
        color: COLORS.bulletEnemy,
      });
      playEnemyShootSound();
    }
  }
}

function updateTracker(enemy: Enemy, state: GameState) {
  const player = state.player;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const distToPlayer = Math.sqrt(dx * dx + dy * dy);

  // Detecção: player dentro do raio?
  if (distToPlayer <= TRACKER_DETECTION_RADIUS) {
    enemy.trackingPlayer = true;
    enemy.lostPlayerTimer = 0;
  } else if (enemy.trackingPlayer) {
    // Fora do raio — começa contagem para desistir
    enemy.lostPlayerTimer = (enemy.lostPlayerTimer || 0) + 1;
    if (enemy.lostPlayerTimer! >= TRACKER_LOST_TIME) {
      enemy.trackingPlayer = false;
      enemy.lostPlayerTimer = 0;
    }
  }

  if (enemy.trackingPlayer) {
    // Perseguição: move em direção ao player
    const len = distToPlayer || 1;
    enemy.vx = (dx / len) * TRACKER_CHASE_SPEED;
    enemy.vy = (dy / len) * TRACKER_CHASE_SPEED;
    enemy.direction = dx > 0 ? "right" : "left";
  } else {
    // Patrulha horizontal (sem tiro)
    enemy.vy = 0;
    enemy.vx = enemy.direction === "right" ? TRACKER_SPEED : -TRACKER_SPEED;

    if (enemy.x <= enemy.patrolMinX) {
      enemy.x = enemy.patrolMinX;
      enemy.vx = TRACKER_SPEED;
      enemy.direction = "right";
    }
    if (enemy.x >= enemy.patrolMaxX) {
      enemy.x = enemy.patrolMaxX;
      enemy.vx = -TRACKER_SPEED;
      enemy.direction = "left";
    }

    // Hover bob sutil durante patrulha
    enemy.y += Math.sin(enemy.animTimer * 0.06) * 0.2;
  }

  enemy.x += enemy.vx;
  enemy.y += enemy.vy;
}

function updateTurret(enemy: Enemy, state: GameState, projectiles: Projectile[]) {
  // Face player
  enemy.direction = state.player.x < enemy.x ? "left" : "right";

  // Shoot at player
  enemy.shootTimer++;
  if (enemy.shootTimer >= enemy.shootCooldown) {
    enemy.shootTimer = 0;
    const dirX = state.player.x - enemy.x;
    const dirY = state.player.y - enemy.y;
    const len = Math.sqrt(dirX * dirX + dirY * dirY);
    if (len > 0) {
      projectiles.push({
        x: enemy.direction === "right" ? enemy.x + enemy.width : enemy.x,
        y: enemy.y + enemy.height * 0.3,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT,
        vx: (dirX / len) * ENEMY_BULLET_SPEED,
        vy: (dirY / len) * ENEMY_BULLET_SPEED,
        owner: "enemy",
        damage: ENEMY_BULLET_DAMAGE,
        alive: true,
        trail: [],
        color: COLORS.bulletEnemy,
      });
      playEnemyShootSound();
    }
  }
}

function updateBoss(enemy: Enemy, state: GameState, projectiles: Projectile[]) {
  // Phase check
  const healthPercent = enemy.health / enemy.maxHealth;
  if (healthPercent <= 0.5 && enemy.bossPhase === 1) {
    enemy.bossPhase = 2;
    enemy.shootCooldown = BOSS_SHOOT_COOLDOWN_P2;
    playBossPhaseSound();
    shakeCamera(state.camera, 8, 30);
    state.particles.push(
      ...createExplosionParticles(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        COLORS.magenta,
        25
      )
    );
  }

  // Slow hover movement
  enemy.bossAttackTimer = (enemy.bossAttackTimer || 0) + 1;
  enemy.x += Math.sin(enemy.bossAttackTimer * 0.02) * 1.5;
  enemy.y =
    CANVAS_HEIGHT * 0.25 + Math.sin(enemy.bossAttackTimer * 0.015) * 40;

  // Shoot
  enemy.shootTimer++;
  const cooldown = enemy.bossPhase === 2 ? BOSS_SHOOT_COOLDOWN_P2 : BOSS_SHOOT_COOLDOWN_P1;
  if (enemy.shootTimer >= cooldown) {
    enemy.shootTimer = 0;

    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;
    const dirX = state.player.x + state.player.width / 2 - cx;
    const dirY = state.player.y + state.player.height / 2 - cy;
    const baseAngle = Math.atan2(dirY, dirX);

    // Spread shots
    const shotCount = enemy.bossPhase === 2 ? 5 : 3;
    for (let i = 0; i < shotCount; i++) {
      const offset =
        (i - Math.floor(shotCount / 2)) * BOSS_BULLET_SPREAD;
      const angle = baseAngle + offset;
      projectiles.push({
        x: cx,
        y: cy,
        width: BULLET_WIDTH + 2,
        height: BULLET_HEIGHT + 2,
        vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 1.2,
        vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 1.2,
        owner: "enemy",
        damage: ENEMY_BULLET_DAMAGE,
        alive: true,
        trail: [],
        color: COLORS.magenta,
      });
    }
    playEnemyShootSound();
  }

  // Phase 2: spawn extra drones occasionally
  if (
    enemy.bossPhase === 2 &&
    enemy.bossAttackTimer! % 300 === 0
  ) {
    const droneCount = state.enemies.filter(
      (e) => e.type === "drone" && e.alive
    ).length;
    if (droneCount < 3) {
      const bossX = state.level.sections.boss.startX;
      state.enemies.push(
        createDrone(
          bossX + 100 + Math.random() * 600,
          100 + Math.random() * 100,
          bossX + 50,
          bossX + 850
        )
      );
    }
  }
}

export function damageEnemy(enemy: Enemy, damage: number, state: GameState) {
  enemy.health -= damage;

  if (enemy.type === "boss") {
    playBossHitSound();
    shakeCamera(state.camera, 3, 6);
    state.particles.push(
      ...createExplosionParticles(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        COLORS.magenta,
        6
      )
    );
  }

  if (enemy.health <= 0) {
    enemy.alive = false;
    playEnemyDeathSound();
    shakeCamera(state.camera, enemy.type === "boss" ? 12 : 3, enemy.type === "boss" ? 30 : 8);

    const color =
      enemy.type === "boss"
        ? COLORS.bossGlow
        : enemy.type === "drone"
        ? COLORS.droneGlow
        : enemy.type === "tracker"
        ? COLORS.trackerGlow
        : COLORS.turretGlow;

    state.particles.push(
      ...createExplosionParticles(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        color,
        enemy.type === "boss" ? 40 : 15
      )
    );

    // Score
    switch (enemy.type) {
      case "drone":
        state.player.score += DRONE_KILL_SCORE;
        break;
      case "tracker":
        state.player.score += TRACKER_KILL_SCORE;
        break;
      case "turret":
        state.player.score += TURRET_KILL_SCORE;
        break;
      case "boss":
        state.player.score += BOSS_KILL_SCORE;
        state.bossDefeated = true;
        break;
    }
  }
}

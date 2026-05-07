// ============================
// Neon Escape - Enemy Logic
// ============================

import type { Enemy, Projectile, GameState } from "./types";
import {
  BOSS_ARENA_WIDTH,
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
  TURRET_BULLET_SPEED,
  BOSS_WIDTH,
  BOSS_HEIGHT,
  BOSS_HEALTH,
  BOSS_SHOOT_COOLDOWN_P1,
  BOSS_SHOOT_COOLDOWN_P2,
  BOSS_SHOOT_COOLDOWN_P3,
  BOSS_SPAWN_COOLDOWN_P1,
  BOSS_SPAWN_COOLDOWN_P2,
  BOSS_SPAWN_COOLDOWN_P3,
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
import { createExplosionParticles, createDamageNumber } from "./particles";
import { shakeCamera } from "./camera";

export function createDrone(x: number, y: number, patrolMinX: number, patrolMaxX: number, speed: number = DRONE_SPEED): Enemy {
  return {
    x,
    y,
    width: DRONE_WIDTH,
    height: DRONE_HEIGHT,
    vx: speed,
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
    homeY: y, // posição vertical de referência para o hover
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

export function createTurret(x: number, y: number, direction: "left" | "right" = "left"): Enemy {
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
    direction,
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

    // Ativa inimigos dentro do range visível + margem de segurança
    // Camera mostra até ~832px à frente (CANVAS_WIDTH=1280, CAMERA_OFFSET_X=448px)
    // Usar 1400px garante que todos os inimigos visíveis já estão animando
    const distToPlayer = Math.abs(enemy.x - player.x);
    const activationRange = enemy.type === "boss" ? 9999 : enemy.type === "tracker" ? 1400 : 1400;

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

  // Hover bob — posição absoluta para evitar drift vertical acumulado
  enemy.y = (enemy.homeY ?? enemy.y) + Math.sin(enemy.animTimer * 0.05) * 6;

  // GDD: Zona 1 ("As Ruas") não tem projéteis inimigos
  const inZone1 = enemy.x < state.level.sections.streets.endX;
  if (inZone1) return;

  // Tiro horizontal puro na direção em que o drone está virado (sem mirar no player).
  // O drone só dispara quando está olhando "para a frente" do player —
  // ou seja, quando o player está no mesmo eixo horizontal aproximado (±60px de altura).
  enemy.shootTimer++;
  if (enemy.shootTimer >= enemy.shootCooldown) {
    enemy.shootTimer = 0;
    const dirSign = enemy.direction === "right" ? 1 : -1;
    projectiles.push({
      x: enemy.direction === "right" ? enemy.x + enemy.width : enemy.x,
      y: enemy.y + enemy.height / 2,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      vx: ENEMY_BULLET_SPEED * dirSign,
      vy: 0,
      owner: "enemy",
      damage: ENEMY_BULLET_DAMAGE,
      alive: true,
      trail: [],
      color: COLORS.bulletEnemy,
    });
    playEnemyShootSound();
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

function updateTurret(enemy: Enemy, _state: GameState, projectiles: Projectile[]) {
  // Direção é FIXA no momento do spawn (createTurret) — turret não acompanha o player.
  // Tiro sai sempre em linha reta horizontal pura na altura do canhão.
  enemy.shootTimer++;
  if (enemy.shootTimer >= enemy.shootCooldown) {
    enemy.shootTimer = 0;
    const dirSign = enemy.direction === "right" ? 1 : -1;
    projectiles.push({
      x: enemy.direction === "right" ? enemy.x + enemy.width : enemy.x,
      y: enemy.y + enemy.height * 0.3,
      width: BULLET_WIDTH,
      height: BULLET_HEIGHT,
      vx: TURRET_BULLET_SPEED * dirSign,
      vy: 0,
      owner: "enemy",
      damage: ENEMY_BULLET_DAMAGE,
      alive: true,
      trail: [],
      color: COLORS.bulletEnemy,
    });
    playEnemyShootSound();
  }
}

function updateBoss(enemy: Enemy, state: GameState, projectiles: Projectile[]) {
  // Fase 1: HP 15-11, Fase 2: HP 10-6, Fase 3: HP 5-1 (GDD v2.0)
  const hp = enemy.health;

  // Transição para fase 2
  if (hp <= 10 && enemy.bossPhase === 1) {
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

  // Transição para fase 3
  if (hp <= 5 && enemy.bossPhase === 2) {
    enemy.bossPhase = 3;
    enemy.shootCooldown = BOSS_SHOOT_COOLDOWN_P3;
    playBossPhaseSound();
    shakeCamera(state.camera, 12, 40);
    state.particles.push(
      ...createExplosionParticles(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        COLORS.yellow,
        35
      )
    );
  }

  const phase = enemy.bossPhase!;

  // Movimento em LEMNISCATA (∞ deitado) - Bernoulli's lemniscate
  // x(t) = a·cos(t) / (1 + sin²(t))
  // y(t) = a·sin(t)·cos(t) / (1 + sin²(t))
  // O boss percorre a curva continuamente; velocidade aumenta a cada fase.
  // bossPathT é acumulado por angularSpeed — não reseta entre fases, então o boss
  // continua de onde estava na curva quando a velocidade aumenta.
  enemy.bossAttackTimer = (enemy.bossAttackTimer || 0) + 1;

  const angularSpeed = phase === 3 ? 0.022 : phase === 2 ? 0.018 : 0.014;
  enemy.bossPathT = (enemy.bossPathT || 0) + angularSpeed;
  const t = enemy.bossPathT;

  // Raio da lemniscata (largura ~ 2a, altura ~ a√3/4 ≈ 0.65a)
  const a = 380; // ocupa ~760px na horizontal
  const sinT = Math.sin(t);
  const cosT = Math.cos(t);
  const denom = 1 + sinT * sinT;

  const dx = (a * cosT) / denom;
  const dy = (a * sinT * cosT) / denom;

  // Centro da lemniscata: meio da arena do boss, um pouco acima do centro vertical
  const arenaCenterX = state.level.sections.boss.startX + BOSS_ARENA_WIDTH / 2;
  const arenaCenterY = CANVAS_HEIGHT * 0.40;

  enemy.x = arenaCenterX + dx - enemy.width / 2;
  enemy.y = arenaCenterY + dy - enemy.height / 2;

  // Tiro — padrão diferente por fase
  enemy.shootTimer++;
  const cooldown =
    phase === 3 ? BOSS_SHOOT_COOLDOWN_P3
    : phase === 2 ? BOSS_SHOOT_COOLDOWN_P2
    : BOSS_SHOOT_COOLDOWN_P1;

  if (enemy.shootTimer >= cooldown) {
    enemy.shootTimer = 0;

    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;
    // Boss não mira no player — atira sempre PARA BAIXO com padrões fixos.
    // Como ele se move em lemniscata, a cobertura horizontal vem do movimento.
    const baseAngle = Math.PI / 2; // 90° = direção para baixo

    if (phase === 1) {
      // Fase 1: 1 projétil reto pra baixo
      projectiles.push({
        x: cx, y: cy,
        width: BULLET_WIDTH + 2, height: BULLET_HEIGHT + 2,
        vx: Math.cos(baseAngle) * ENEMY_BULLET_SPEED * 1.2,
        vy: Math.sin(baseAngle) * ENEMY_BULLET_SPEED * 1.2,
        owner: "enemy", damage: ENEMY_BULLET_DAMAGE,
        alive: true, trail: [], color: COLORS.magenta,
      });
    } else if (phase === 2) {
      // Fase 2: 2 projéteis em "V" invertido fixo (~±17° em torno do eixo vertical)
      const offsets = [-0.30, 0.30];
      for (const offset of offsets) {
        const angle = baseAngle + offset;
        projectiles.push({
          x: cx, y: cy,
          width: BULLET_WIDTH + 2, height: BULLET_HEIGHT + 2,
          vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 1.2,
          vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 1.2,
          owner: "enemy", damage: ENEMY_BULLET_DAMAGE,
          alive: true, trail: [], color: COLORS.magenta,
        });
      }
    } else {
      // Fase 3: leque fixo de 4 projéteis cobrindo ~70° abaixo do boss
      const offsets = [-0.6, -0.2, 0.2, 0.6];
      for (const offset of offsets) {
        const angle = baseAngle + offset;
        projectiles.push({
          x: cx, y: cy,
          width: BULLET_WIDTH + 3, height: BULLET_HEIGHT + 3,
          vx: Math.cos(angle) * ENEMY_BULLET_SPEED * 1.4,
          vy: Math.sin(angle) * ENEMY_BULLET_SPEED * 1.4,
          owner: "enemy", damage: ENEMY_BULLET_DAMAGE,
          alive: true, trail: [], color: COLORS.yellow,
        });
      }
    }
    playEnemyShootSound();
  }

  // Spawn de minions por fase
  const spawnCooldown =
    phase === 3 ? BOSS_SPAWN_COOLDOWN_P3
    : phase === 2 ? BOSS_SPAWN_COOLDOWN_P2
    : BOSS_SPAWN_COOLDOWN_P1;

  if (enemy.bossAttackTimer! > 0 && enemy.bossAttackTimer! % spawnCooldown === 0) {
    const bossX = state.level.sections.boss.startX;
    const aliveMinions = state.enemies.filter(
      (e) => (e.type === "drone" || e.type === "tracker") && e.alive
    ).length;

    if (phase === 1 && aliveMinions < 3) {
      // Fase 1: 2 drones patrulheiros
      for (let i = 0; i < 2; i++) {
        state.enemies.push(
          createDrone(
            bossX + 100 + Math.random() * 600,
            80 + Math.random() * 100,
            bossX + 50, bossX + 850
          )
        );
      }
    } else if (phase === 2 && aliveMinions < 4) {
      // Fase 2: 3 rastreadores
      for (let i = 0; i < 3; i++) {
        state.enemies.push(
          createTracker(
            bossX + 80 + Math.random() * 650,
            80 + Math.random() * 100,
            bossX + 50, bossX + 850
          )
        );
      }
    } else if (phase === 3 && aliveMinions < 4) {
      // Fase 3: apenas rastreadores (3 unidades)
      for (let i = 0; i < 3; i++) {
        state.enemies.push(
          createTracker(
            bossX + 80 + Math.random() * 650,
            100 + Math.random() * 100,
            bossX + 50, bossX + 850
          )
        );
      }
    }
  }
}

export function damageEnemy(enemy: Enemy, damage: number, state: GameState) {
  enemy.health -= damage;
  enemy.hitFlashTimer = 5; // 5 frames de flash branco no inimigo

  // Damage number flutuante (Risk of Rain 2 / Dead Cells style)
  state.damageNumbers.push(
    createDamageNumber(
      enemy.x + enemy.width / 2,
      enemy.y - 4,
      damage,
      enemy.type === "boss"
    )
  );

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
    state.killCount++;
    playEnemyDeathSound();
    shakeCamera(state.camera, enemy.type === "boss" ? 14 : 4, enemy.type === "boss" ? 30 : 10);
    // Hit-stop: freeze frame curto ao matar inimigos para dar peso ao impacto
    state.hitStopTimer = Math.max(state.hitStopTimer, enemy.type === "boss" ? 12 : 3);

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
        state.player.ammo += 5; // GDD: drone atirador dropa +5 munições
        break;
      case "boss":
        state.player.score += BOSS_KILL_SCORE;
        state.bossDefeated = true;
        break;
    }
  }
}

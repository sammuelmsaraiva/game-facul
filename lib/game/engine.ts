// ============================
// Neon Escape - Game Engine
// ============================

import type { GameState, InputState, GameScreen, PhaseId } from "./types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import { createPlayer, updatePlayer } from "./player";
import { updateEnemies } from "./enemies";
import { updateProjectiles } from "./projectiles";
import { generateLevel, generateBackgroundBuildings, updateMovingPlatforms } from "./levels";
import { createCamera, updateCamera } from "./camera";
import { updateParticles, updateDamageNumbers } from "./particles";
import { consumePressed } from "./input";
import {
  hasSeenEnemyIntro,
  markEnemyIntroSeen,
  hasSeenCollectibleIntro,
  markCollectibleIntroSeen,
} from "./tutorial";
import { submitScore } from "./highscores";
import { render } from "./renderer";
import { playCollectSound, playVictorySound, playGameOverSound, startMusic, stopMusic } from "./audio";
import { createCollectParticles } from "./particles";
import { COLORS } from "./constants";

// Helper: zona dominante por fase (usada para HUD e detecção de inimigos próximos)
function zoneOfPhase(phase: PhaseId): "streets" | "ducts" | "boss" {
  return phase === 1 ? "streets" : phase === 2 ? "ducts" : "boss";
}

// Gera um ID único para identificar uma run (usado pelo high-score para deduplicar)
function newRunId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Submete o score atual para o high-scores e armazena o rank em state.lastRank.
// O runId garante que múltiplas chamadas na MESMA run sobrescrevam a entrada
// (em vez de duplicar). Apenas a fase mais avançada conta por run.
function recordScore(state: GameState, victory: boolean) {
  if (state.lastRank !== null) return; // já registrou
  const phaseReached = victory ? 4 : state.currentPhase;
  state.lastRank = submitScore({
    score: state.player.score,
    phaseReached,
    timeSeconds: Math.floor(state.runTime / 60),
    date: new Date().toISOString(),
    runId: state.runId,
  });
}

export function createGameState(): GameState {
  const level = generateLevel(1);
  const backgroundBuildings = generateBackgroundBuildings(level.totalWidth);

  return {
    screen: "menu",
    player: createPlayer(100, 400),
    enemies: [...level.enemies],
    platforms: [...level.platforms],
    projectiles: [],
    collectibles: [...level.collectibles],
    particles: [],
    damageNumbers: [],
    camera: createCamera(),
    level,
    backgroundBuildings,
    time: 0,
    deltaTime: 1,
    bossDefeated: false,
    screenShake: 0,
    currentZone: "streets",
    zoneTransitionTimer: 0,
    zoneTransitionName: "",
    damageFlashTimer: 0,
    pendingUpgrade: null,
    upgradeSelection: 0,
    zonesUnlocked: { ducts: false, boss: false },
    hitStopTimer: 0,
    currentPhase: 1,
    phaseTransitionTimer: 0,
    phaseScore: 0,
    upgradeConfirmAnim: 0,
    killCount: 0,
    idleTimer: 0,
    scorePulseTimer: 0,
    deathSequenceTimer: 0,
    cheatInvincible: false,
    lastRank: null,
    runTime: 0,
    runId: newRunId(),
  };
}

// Reseta o jogo INTEIRO — começa da fase 1, score zerado.
export function resetGame(state: GameState): GameState {
  const level = generateLevel(1);
  const backgroundBuildings = generateBackgroundBuildings(level.totalWidth);
  return {
    ...state,
    screen: "ready",
    player: createPlayer(100, 400),
    enemies: [...level.enemies],
    platforms: [...level.platforms],
    projectiles: [],
    collectibles: [...level.collectibles],
    particles: [],
    damageNumbers: [],
    camera: createCamera(),
    level,
    backgroundBuildings,
    time: 0,
    deltaTime: 1,
    bossDefeated: false,
    screenShake: 0,
    currentZone: "streets",
    zoneTransitionTimer: 0,
    zoneTransitionName: "",
    damageFlashTimer: 0,
    pendingUpgrade: null,
    upgradeSelection: 0,
    zonesUnlocked: { ducts: false, boss: false },
    hitStopTimer: 0,
    currentPhase: 1,
    phaseTransitionTimer: 0,
    phaseScore: 0,
    upgradeConfirmAnim: 0,
    killCount: 0,
    idleTimer: 0,
    scorePulseTimer: 0,
    deathSequenceTimer: 0,
    cheatInvincible: false,
    lastRank: null,
    runTime: 0,
    runId: newRunId(),
  };
}

// Avança para a próxima fase MANTENDO score, vida (capped) e munição estocada.
// Reseta plataformas/inimigos/coletáveis. Player volta para (100, 400).
export function advanceToPhase(state: GameState, phase: PhaseId): GameState {
  const level = generateLevel(phase);
  const backgroundBuildings = generateBackgroundBuildings(level.totalWidth);
  const oldPlayer = state.player;
  const newPlayer = createPlayer(100, 400);

  // Preserva atributos persistentes do jogador entre fases
  newPlayer.score = oldPlayer.score;
  newPlayer.health = Math.max(1, oldPlayer.health); // não morre no avanço
  newPlayer.ammo = oldPlayer.ammo;
  newPlayer.canShoot = oldPlayer.canShoot;
  newPlayer.weaponMode = oldPlayer.weaponMode;

  return {
    ...state,
    screen: "playing",
    player: newPlayer,
    enemies: [...level.enemies],
    platforms: [...level.platforms],
    projectiles: [],
    collectibles: [...level.collectibles],
    particles: [],
    damageNumbers: [],
    camera: createCamera(),
    level,
    backgroundBuildings,
    time: 0,
    bossDefeated: false,
    currentZone: zoneOfPhase(phase),
    zoneTransitionTimer: 0,
    zoneTransitionName: "",
    damageFlashTimer: 0,
    hitStopTimer: 0,
    currentPhase: phase,
    phaseTransitionTimer: 0,
    phaseScore: oldPlayer.score, // baseline para mostrar diff no resumo
    // pendingUpgrade / zonesUnlocked: o trigger de upgrade da arma é aplicado abaixo
    pendingUpgrade: null,
    upgradeSelection: 0,
    upgradeConfirmAnim: 0,
    // killCount e runTime acumulam entre fases
    killCount: state.killCount,
    idleTimer: 0,
    scorePulseTimer: 0,
    deathSequenceTimer: 0,
    // Cheat persiste entre fases (uma vez ligado, fica ligado até desligar)
    cheatInvincible: state.cheatInvincible,
    lastRank: null,
    runTime: state.runTime,
    runId: state.runId, // mantém o mesmo runId entre fases
  };
}

export function gameUpdate(state: GameState, input: InputState): GameState {
  // Tela "ready": qualquer tecla ou clique inicia o jogo
  if (state.screen === "ready") {
    const anyKey = input.left || input.right || input.jump || input.down
      || input.shoot || input.jumpPressed || input.shootPressed
      || input.confirmPressed || input.clickPressed;
    if (anyKey) {
      state.screen = "playing";
      startMusic();
      consumePressed(input);
    }
    return state;
  }

  // Tela de "fase completa" — espera Enter ou clique para iniciar a transição
  if (state.screen === "phase_complete") {
    if (input.confirmPressed || input.clickPressed) {
      state.screen = "phase_loading";
      state.phaseTransitionTimer = 90; // ~1.5s a 60fps
    }
    consumePressed(input);
    return state;
  }

  // Tela de "carregando próxima fase" — fade out + delay + advance
  if (state.screen === "phase_loading") {
    state.phaseTransitionTimer--;
    if (state.phaseTransitionTimer <= 0) {
      const nextPhase = (state.currentPhase + 1) as PhaseId;
      const advanced = advanceToPhase(state, nextPhase);
      Object.assign(state, advanced);
      // Dispara automaticamente o upgrade correto da nova fase
      if (nextPhase === 2 && !state.zonesUnlocked.ducts) {
        state.zonesUnlocked.ducts = true;
        state.pendingUpgrade = "weapon_unlock";
        state.upgradeSelection = 0;
        state.screen = "upgrade";
      } else if (nextPhase === 3 && !state.zonesUnlocked.boss) {
        state.zonesUnlocked.boss = true;
        state.pendingUpgrade = "weapon_choice";
        state.upgradeSelection = 0;
        state.screen = "upgrade";
      }
    }
    consumePressed(input);
    return state;
  }

  if (state.screen !== "playing" && state.screen !== "paused" && state.screen !== "upgrade") {
    return state;
  }

  // Pause / Unpause / Exit
  if (state.screen === "paused") {
    if (input.pausePressed) {
      // ESC enquanto pausado = voltar ao menu (desistir da partida)
      state.screen = "menu";
      stopMusic();
      consumePressed(input);
      return state;
    }
    if (input.unpausePressed) {
      // P enquanto pausado = continuar jogando
      state.screen = "playing";
      consumePressed(input);
      return state;
    }
    consumePressed(input);
    return state;
  }

  // Tela de upgrade entre fases
  if (state.screen === "upgrade") {
    if (state.pendingUpgrade === "weapon_choice") {
      if (input.leftPressed) state.upgradeSelection = 0;
      if (input.rightPressed) state.upgradeSelection = 1;
    }
    // Animação de confirmação: Enter ou clique do mouse iniciam o delay visual
    if ((input.confirmPressed || input.clickPressed) && state.upgradeConfirmAnim === 0) {
      state.upgradeConfirmAnim = 18; // ~0.3s a 60fps
    }
    if (state.upgradeConfirmAnim > 0) {
      state.upgradeConfirmAnim--;
      if (state.upgradeConfirmAnim === 0) {
        applyPendingUpgrade(state);
        state.pendingUpgrade = null;
        state.upgradeSelection = 0;
        state.screen = "playing";
      }
    }
    consumePressed(input);
    return state;
  }

  if (input.pausePressed) {
    // ESC durante gameplay = pausar
    state.screen = "paused";
    consumePressed(input);
    return state;
  }

  // === Cheats de desenvolvedor (apenas durante gameplay normal) ===
  if (input.cheatTogglePressed) {
    state.cheatInvincible = !state.cheatInvincible;
  }
  if (input.cheatHealPressed) {
    state.player.health = state.player.maxHealth;
  }
  if (input.cheatAmmoPressed) {
    state.player.ammo += 50;
    if (!state.player.canShoot) {
      // Desbloqueia arma também (útil pra testar fase 2/3 começando da fase 1)
      state.player.canShoot = true;
      state.player.weaponMode = "single";
    }
  }
  if (input.cheatSkipPressed) {
    // Pula para o fim da fase atual (gatilha phase_complete)
    if (state.level.phaseEndX > 0) {
      state.player.x = state.level.phaseEndX + 10;
    } else if (state.currentPhase === 3) {
      // Na fase do boss: mata o boss instantaneamente
      const boss = state.enemies.find((e) => e.type === "boss" && e.alive);
      if (boss) boss.health = 0;
    }
  }

  // Sequência cinematográfica de morte (hit-stop pesado → fade vermelho → preto)
  // Roda enquanto deathSequenceTimer > 0; ao chegar em 0, transiciona para gameover
  if (state.deathSequenceTimer > 0) {
    state.deathSequenceTimer--;
    // Particles ainda animam, mas em "slow-mo" (atualiza só metade dos frames)
    if (state.deathSequenceTimer % 2 === 0) {
      state.particles = updateParticles(state.particles);
    }
    if (state.deathSequenceTimer === 0) {
      recordScore(state, false);
      state.screen = "gameover";
      stopMusic();
      playGameOverSound();
    }
    consumePressed(input);
    return state;
  }

  // Hit-stop: congela simulação por alguns frames para dar peso ao impacto
  // (mantém particles e camera shake animando para feedback visual)
  if (state.hitStopTimer > 0) {
    state.hitStopTimer--;
    state.particles = updateParticles(state.particles);
    state.damageNumbers = updateDamageNumbers(state.damageNumbers);
    if (state.damageFlashTimer > 0) state.damageFlashTimer--;
    consumePressed(input);

    // Quando hit-stop termina E o player morreu: inicia sequência cinematográfica
    // (em vez de pular direto para gameover)
    if (state.hitStopTimer === 0 && !state.player.alive) {
      state.deathSequenceTimer = 75; // ~1.25s a 60fps
    }
    return state;
  }

  state.time++;
  state.runTime++;

  // Score pulse: detecta aumento de score e dispara animação visual no HUD
  const scoreBefore = state.player.score;

  // Decay do score pulse timer
  if (state.scorePulseTimer > 0) state.scorePulseTimer--;

  // Idle timer: incrementa quando player não está se movendo horizontalmente.
  // Usado pelo indicador "→" que aparece na borda direita após 3s parado.
  if (Math.abs(state.player.vx) < 0.1) {
    state.idleTimer++;
  } else {
    state.idleTimer = 0;
  }

  // Update moving platforms
  updateMovingPlatforms(state.platforms);

  // Update player
  const { newProjectiles } = updatePlayer(state, input);
  if (newProjectiles.length > 0) {
    state.projectiles.push(...newProjectiles);
  }

  // Track collectibles before update for sound effects
  const prevCollected = state.collectibles.filter((c) => c.collected).length;

  // Update enemies
  const enemyProjectiles = updateEnemies(state);
  state.projectiles.push(...enemyProjectiles);

  // Update projectiles
  updateProjectiles(state);

  // Check new collectibles
  const newCollected = state.collectibles.filter((c) => c.collected).length;
  if (newCollected > prevCollected) {
    playCollectSound();
    // Find newly collected items for particles
    for (const col of state.collectibles) {
      if (col.collected && col.animTimer !== -1) {
        const color =
          col.type === "health"
            ? COLORS.healthPickup
            : col.type === "ammo"
            ? COLORS.ammoPickup
            : COLORS.dataChip;
        state.particles.push(
          ...createCollectParticles(
            col.x + col.width / 2,
            col.y + col.height / 2,
            color
          )
        );
        col.animTimer = -1; // Mark as already spawned particles
      }
    }
  }

  // Update camera
  updateCamera(state.camera, state.player, state);

  // Update particles com limite máximo para manter performance
  state.particles = updateParticles(state.particles);
  const MAX_PARTICLES = 300;
  if (state.particles.length > MAX_PARTICLES) {
    state.particles = state.particles.slice(-MAX_PARTICLES);
  }

  // Damage numbers — sobem e somem
  state.damageNumbers = updateDamageNumbers(state.damageNumbers);

  // Se score mudou neste frame, disparar pulse visual
  if (state.player.score > scoreBefore) {
    state.scorePulseTimer = 22;
  }

  // Decay do hit-flash dos inimigos
  for (const enemy of state.enemies) {
    if (enemy.hitFlashTimer && enemy.hitFlashTimer > 0) enemy.hitFlashTimer--;
  }

  // Health regen lento: 1 HP a cada ~30s sem tomar dano
  state.player.noDamageTimer++;
  if (
    state.player.alive &&
    state.player.health < state.player.maxHealth &&
    state.player.noDamageTimer >= 1800
  ) {
    state.player.health++;
    state.player.noDamageTimer = 0;
  }

  // Detecção de primeiras aparições (tutorial pop-up)
  // Usa localStorage para persistir entre retries e sessões — não reaparecem ao morrer
  const VIEW_AHEAD = 700;
  const playerX = state.player.x;
  const currentZone = state.currentZone;

  if (!hasSeenEnemyIntro(currentZone)) {
    const nearEnemy = state.enemies.some(
      (e) => e.alive && e.x > playerX && e.x - playerX < VIEW_AHEAD
    );
    if (nearEnemy) {
      markEnemyIntroSeen(currentZone);
      state.pendingUpgrade = "intro_enemies";
      state.upgradeSelection = 0;
      state.screen = "upgrade";
      state.zoneTransitionTimer = 0;
    }
  }

  if (!hasSeenCollectibleIntro() && state.screen !== "upgrade") {
    const nearCollectible = state.collectibles.some(
      (c) => !c.collected && c.x > playerX && c.x - playerX < VIEW_AHEAD
    );
    if (nearCollectible) {
      markCollectibleIntroSeen();
      state.pendingUpgrade = "intro_collectibles";
      state.upgradeSelection = 0;
      state.screen = "upgrade";
      state.zoneTransitionTimer = 0;
    }
  }

  // Detecção de fim de fase: player atravessou phaseEndX (apenas fases 1 e 2)
  if (state.level.phaseEndX > 0 && state.player.x >= state.level.phaseEndX && state.screen === "playing") {
    state.screen = "phase_complete";
    state.phaseTransitionTimer = 0;
    stopMusic();
  }

  if (state.zoneTransitionTimer > 0) {
    state.zoneTransitionTimer--;
  }

  // Damage flash timer
  if (state.damageFlashTimer > 0) {
    state.damageFlashTimer--;
  }

  // Check game over — inicia sequência cinematográfica em vez de transição direta
  // (a tela só vira "gameover" quando deathSequenceTimer chega a 0)
  if (!state.player.alive && state.screen === "playing" && state.deathSequenceTimer === 0) {
    state.deathSequenceTimer = 75;
  }

  // Check victory
  if (state.bossDefeated && state.screen === "playing") {
    state.hitStopTimer = 0;
    recordScore(state, true);
    state.screen = "victory";
    stopMusic();
    playVictorySound();
  }

  consumePressed(input);

  return state;
}

export function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  if (
    state.screen === "playing" ||
    state.screen === "paused" ||
    state.screen === "ready" ||
    state.screen === "upgrade" ||
    state.screen === "phase_complete" ||
    state.screen === "phase_loading"
  ) {
    render(ctx, state);
  }
}

function applyPendingUpgrade(state: GameState) {
  const upgrade = state.pendingUpgrade;
  if (upgrade === "weapon_unlock") {
    state.player.canShoot = true;
    state.player.weaponMode = "single";
    // Garantir munição inicial ao desbloquear
    if (state.player.ammo < 10) state.player.ammo = 20;
  } else if (upgrade === "weapon_choice") {
    state.player.weaponMode = state.upgradeSelection === 0 ? "shotgun" : "rapid";
  }
}

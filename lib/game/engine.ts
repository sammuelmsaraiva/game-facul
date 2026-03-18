// ============================
// Neon Escape - Game Engine
// ============================

import type { GameState, InputState, GameScreen } from "./types";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./constants";
import { createPlayer, updatePlayer } from "./player";
import { updateEnemies } from "./enemies";
import { updateProjectiles } from "./projectiles";
import { generateLevel, generateBackgroundBuildings, updateMovingPlatforms } from "./levels";
import { createCamera, updateCamera } from "./camera";
import { updateParticles } from "./particles";
import { consumePressed } from "./input";
import { render } from "./renderer";
import { playCollectSound, playVictorySound, playGameOverSound, startMusic, stopMusic } from "./audio";
import { createCollectParticles } from "./particles";
import { COLORS } from "./constants";

export function createGameState(): GameState {
  const level = generateLevel();
  const backgroundBuildings = generateBackgroundBuildings();

  return {
    screen: "menu",
    player: createPlayer(100, 400),
    enemies: [...level.enemies],
    platforms: [...level.platforms],
    projectiles: [],
    collectibles: [...level.collectibles],
    particles: [],
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
  };
}

export function resetGame(state: GameState): GameState {
  const level = generateLevel();
  return {
    ...state,
    screen: "ready",
    player: createPlayer(100, 400),
    enemies: [...level.enemies],
    platforms: [...level.platforms],
    projectiles: [],
    collectibles: [...level.collectibles],
    particles: [],
    camera: createCamera(),
    level,
    time: 0,
    deltaTime: 1,
    bossDefeated: false,
    screenShake: 0,
    currentZone: "streets",
    zoneTransitionTimer: 0,
    zoneTransitionName: "",
    damageFlashTimer: 0,
  };
}

export function gameUpdate(state: GameState, input: InputState): GameState {
  // Tela "ready": qualquer tecla inicia o jogo
  if (state.screen === "ready") {
    const anyKey = input.left || input.right || input.jump || input.down
      || input.shoot || input.jumpPressed || input.shootPressed;
    if (anyKey) {
      state.screen = "playing";
      startMusic();
      consumePressed(input);
    }
    return state;
  }

  if (state.screen !== "playing" && state.screen !== "paused") {
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

  if (input.pausePressed) {
    // ESC durante gameplay = pausar
    state.screen = "paused";
    consumePressed(input);
    return state;
  }

  state.time++;

  // Update moving platforms
  updateMovingPlatforms(state.platforms);

  // Update player
  const { newProjectile } = updatePlayer(state, input);
  if (newProjectile) {
    state.projectiles.push(newProjectile);
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

  // Detecção de mudança de zona
  const px = state.player.x;
  let newZone: typeof state.currentZone = "streets";
  if (px >= state.level.sections.boss.startX) newZone = "boss";
  else if (px >= state.level.sections.ducts.startX) newZone = "ducts";

  if (newZone !== state.currentZone) {
    state.currentZone = newZone;
    state.zoneTransitionTimer = 120; // 2 segundos a 60fps
    const zoneNames = {
      streets: "AS RUAS",
      ducts: "ESTRUTURAS ELEVADAS",
      boss: "CONFRONTO FINAL",
    };
    state.zoneTransitionName = zoneNames[newZone];
  }

  if (state.zoneTransitionTimer > 0) {
    state.zoneTransitionTimer--;
  }

  // Damage flash timer
  if (state.damageFlashTimer > 0) {
    state.damageFlashTimer--;
  }

  // Check game over
  if (!state.player.alive) {
    state.screen = "gameover";
    stopMusic();
    playGameOverSound();
  }

  // Check victory
  if (state.bossDefeated) {
    state.screen = "victory";
    stopMusic();
    playVictorySound();
  }

  consumePressed(input);

  return state;
}

export function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.screen === "playing" || state.screen === "paused" || state.screen === "ready") {
    render(ctx, state);
  }
}

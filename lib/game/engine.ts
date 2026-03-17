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
import { playCollectSound, playVictorySound, playGameOverSound } from "./audio";
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
  };
}

export function resetGame(state: GameState): GameState {
  const level = generateLevel();
  return {
    ...state,
    screen: "playing",
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
  };
}

export function gameUpdate(state: GameState, input: InputState): GameState {
  if (state.screen !== "playing" && state.screen !== "paused") {
    return state;
  }

  // Pause toggle
  if (input.pausePressed) {
    state.screen = state.screen === "paused" ? "playing" : "paused";
    consumePressed(input);
    return state;
  }

  if (state.screen === "paused") {
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

  // Update particles
  state.particles = updateParticles(state.particles);

  // Check game over
  if (!state.player.alive) {
    state.screen = "gameover";
    playGameOverSound();
  }

  // Check victory
  if (state.bossDefeated) {
    state.screen = "victory";
    playVictorySound();
  }

  consumePressed(input);

  return state;
}

export function gameRender(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.screen === "playing" || state.screen === "paused") {
    render(ctx, state);
  }
}

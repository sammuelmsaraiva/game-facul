// ============================
// Neon Escape - Projectile System
// ============================

import type { Projectile, GameState } from "./types";
import { CANVAS_WIDTH, CANVAS_HEIGHT, TRAIL_LENGTH } from "./constants";
import { aabb } from "./collisions";
import { damageEnemy } from "./enemies";
import { damagePlayer } from "./player";
import { createExplosionParticles } from "./particles";

export function updateProjectiles(state: GameState) {
  for (const proj of state.projectiles) {
    if (!proj.alive) continue;

    // Store trail position
    proj.trail.push({ x: proj.x, y: proj.y });
    if (proj.trail.length > TRAIL_LENGTH) {
      proj.trail.shift();
    }

    // Move
    proj.x += proj.vx;
    proj.y += proj.vy;

    // Off screen check (with generous bounds)
    const camX = state.camera.x;
    if (
      proj.x < camX - 200 ||
      proj.x > camX + CANVAS_WIDTH + 200 ||
      proj.y < -200 ||
      proj.y > CANVAS_HEIGHT + 200
    ) {
      proj.alive = false;
      continue;
    }

    const projRect = {
      x: proj.x,
      y: proj.y,
      width: proj.width,
      height: proj.height,
    };

    if (proj.owner === "player") {
      // Check enemy hits
      for (const enemy of state.enemies) {
        if (!enemy.alive) continue;
        const enemyRect = {
          x: enemy.x,
          y: enemy.y,
          width: enemy.width,
          height: enemy.height,
        };
        if (aabb(projRect, enemyRect)) {
          proj.alive = false;
          damageEnemy(enemy, proj.damage, state);
          state.particles.push(
            ...createExplosionParticles(proj.x, proj.y, proj.color, 5)
          );
          break;
        }
      }
    } else {
      // Enemy bullet hitting player
      if (state.player.alive) {
        const playerRect = {
          x: state.player.x,
          y: state.player.y,
          width: state.player.width,
          height: state.player.height,
        };
        if (aabb(projRect, playerRect)) {
          proj.alive = false;
          damagePlayer(state.player, proj.damage, state);
          state.particles.push(
            ...createExplosionParticles(proj.x, proj.y, proj.color, 5)
          );
        }
      }
    }

    // Platform collision for projectiles
    for (const platform of state.platforms) {
      const platRect = {
        x: platform.x,
        y: platform.y,
        width: platform.width,
        height: platform.height,
      };
      if (aabb(projRect, platRect)) {
        proj.alive = false;
        state.particles.push(
          ...createExplosionParticles(proj.x, proj.y, proj.color, 3)
        );
        break;
      }
    }
  }

  // Remove dead projectiles
  state.projectiles = state.projectiles.filter((p) => p.alive);
}

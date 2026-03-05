// ============================
// Chrome Rebel - Particle System
// ============================

import type { Particle } from "./types";
import { PARTICLE_COUNT_EXPLOSION, PARTICLE_COUNT_COLLECT, PARTICLE_LIFE } from "./constants";

export function createExplosionParticles(
  x: number,
  y: number,
  color: string,
  count: number = PARTICLE_COUNT_EXPLOSION
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      color,
      life: PARTICLE_LIFE + Math.random() * 20,
      maxLife: PARTICLE_LIFE + 20,
      alpha: 1,
    });
  }
  return particles;
}

export function createCollectParticles(
  x: number,
  y: number,
  color: string
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT_COLLECT; i++) {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT_COLLECT;
    const speed = 1 + Math.random() * 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 2 + Math.random() * 3,
      color,
      life: 25 + Math.random() * 15,
      maxLife: 40,
      alpha: 1,
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[]): Particle[] {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // slight gravity on particles
    p.life--;
    p.alpha = Math.max(0, p.life / p.maxLife);
    p.size *= 0.98;
  }
  return particles.filter((p) => p.life > 0);
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  camX: number,
  camY: number
) {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(p.x - camX - p.size / 2, p.y - camY - p.size / 2, p.size, p.size);
    ctx.restore();
  }
}

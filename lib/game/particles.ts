// ============================
// Neon Escape - Particle System
// ============================

import type { Particle, DamageNumber } from "./types";
import { COLORS } from "./constants";
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

export function createLandingDustParticles(
  x: number,
  y: number,
  fallSpeed: number
): Particle[] {
  const particles: Particle[] = [];
  // Mais partículas em quedas maiores (até 12)
  const count = Math.min(12, 4 + Math.floor(fallSpeed / 2));
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const horizSpeed = (1 + Math.random() * 2) * side;
    particles.push({
      x: x + (Math.random() - 0.5) * 12,
      y,
      vx: horizSpeed,
      vy: -Math.random() * 1.2,
      size: 2 + Math.random() * 2,
      color: "#7a7a8a",
      life: 18 + Math.random() * 10,
      maxLife: 28,
      alpha: 0.7,
    });
  }
  return particles;
}

export function createJumpDustParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 5; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y,
      vx: (0.5 + Math.random() * 1.2) * side,
      vy: -Math.random() * 0.8,
      size: 2 + Math.random() * 1.5,
      color: "#7a7a8a",
      life: 12 + Math.random() * 6,
      maxLife: 18,
      alpha: 0.6,
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

// ---------- Damage Numbers ----------

export function createDamageNumber(
  x: number,
  y: number,
  damage: number,
  isBoss: boolean = false
): DamageNumber {
  const text = `-${damage}`;
  const color = isBoss ? COLORS.magenta : COLORS.white;
  return {
    x: x + (Math.random() - 0.5) * 20, // dispersão horizontal pra evitar sobreposição
    y,
    vy: -2.2, // sobe rapidamente
    text,
    color,
    life: 40,
    maxLife: 40,
    size: isBoss ? 22 : 16,
    big: isBoss,
  };
}

export function updateDamageNumbers(numbers: DamageNumber[]): DamageNumber[] {
  for (const n of numbers) {
    n.y += n.vy;
    n.vy += 0.08; // gravidade leve — desacelera a subida
    n.life--;
  }
  return numbers.filter((n) => n.life > 0);
}

export function renderDamageNumbers(
  ctx: CanvasRenderingContext2D,
  numbers: DamageNumber[],
  camX: number,
  camY: number
) {
  for (const n of numbers) {
    const t = n.life / n.maxLife;
    // Fade out na segunda metade da vida
    const alpha = t > 0.5 ? 1 : t * 2;
    // Pop inicial: começa um pouco maior, encolhe nos primeiros 6 frames
    const popScale = n.life > n.maxLife - 6 ? 1.3 : 1.0;
    const fontSize = n.size * popScale;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 4;
    // borda escura para legibilidade
    ctx.fillStyle = "#000";
    for (const dx of [-1, 1]) {
      for (const dy of [-1, 1]) {
        ctx.fillText(n.text, n.x - camX + dx, n.y - camY + dy);
      }
    }
    // texto colorido
    ctx.fillStyle = n.color;
    ctx.shadowColor = n.color;
    ctx.shadowBlur = 8;
    ctx.fillText(n.text, n.x - camX, n.y - camY);
    ctx.restore();
  }
}

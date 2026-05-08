// ============================
// Neon Escape - Level Design (3 fases independentes)
// ============================
// Cada fase é um nível auto-contido — começa em x=0 e termina em phaseEndX.
// O player é resetado para (100, 400) no início de cada fase.
// Fase 3 (boss arena) termina ao matar o boss; phaseEndX = -1 (não usado).

import type { LevelData, Platform, Collectible, BackgroundBuilding, PhaseId } from "./types";
import {
  STREETS_WIDTH,
  STREETS_DANGER_X,
  STREETS_PICKUP_X,
  DUCTS_WIDTH,
  BOSS_ARENA_WIDTH,
  GROUND_Y,
  PLATFORM_HEIGHT,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLLECTIBLE_SIZE,
  HEALTH_RESTORE,
  AMMO_RESTORE,
  DATA_CHIP_SCORE,
  DRONE_SPEED_Z2,
  COLORS,
} from "./constants";
import { createDrone, createTurret, createBoss } from "./enemies";

const _unused1 = STREETS_DANGER_X; // mantido para compatibilidade futura
const _unused2 = CANVAS_WIDTH;
void _unused1; void _unused2;

// =====================================================
// Fase 1 — As Ruas (Streets)
//   1.1 (0 → STREETS_DANGER_X / 1500): só plataformas
//   1.1b (1500 → 3000): drones aparecem
//   1.2 (3000 → STREETS_WIDTH / 6000): coletáveis + mais drones
// =====================================================
function buildPhase1(): LevelData {
  const platforms: Platform[] = [];
  const collectibles: Collectible[] = [];
  const enemies = [];

  const streetGrounds: [number, number][] = [
    [0, 400],
    [480, 700],
    [1230, 600],
    [1900, 500],
    [2500, 500],
    [3100, 400],
    [3600, 500],
    [4200, 500],
    [4800, 400],
    [5300, 700],
  ];
  for (const [x, w] of streetGrounds) {
    platforms.push({ x, y: GROUND_Y, width: w, height: PLATFORM_HEIGHT + 20, type: "static", glowColor: COLORS.cyan });
  }

  const streetPlatforms: [number, number, number][] = [
    [200, GROUND_Y - 80, 120],
    [420, GROUND_Y - 140, 100],
    [600, GROUND_Y - 90, 130],
    [820, GROUND_Y - 150, 100],
    [1000, GROUND_Y - 100, 120],
    [1200, GROUND_Y - 170, 110],
    [1400, GROUND_Y - 100, 130],
    [1600, GROUND_Y - 130, 110],
    [1800, GROUND_Y - 90, 120],
    [2050, GROUND_Y - 150, 100],
    [2250, GROUND_Y - 100, 130],
    [2500, GROUND_Y - 160, 100],
    [2700, GROUND_Y - 110, 120],
    [2900, GROUND_Y - 150, 100],
    [3200, GROUND_Y - 100, 130],
    [3450, GROUND_Y - 160, 100],
    [3700, GROUND_Y - 110, 120],
    [3950, GROUND_Y - 150, 100],
    [4200, GROUND_Y - 90, 130],
    [4450, GROUND_Y - 160, 100],
    [4700, GROUND_Y - 110, 120],
    [4950, GROUND_Y - 150, 100],
    [5200, GROUND_Y - 90, 130],
    [5500, GROUND_Y - 160, 100],
    [5750, GROUND_Y - 110, 120],
  ];
  for (const [x, y, w] of streetPlatforms) {
    platforms.push({ x, y, width: w, height: PLATFORM_HEIGHT, type: "static", glowColor: COLORS.cyan });
  }

  enemies.push(createDrone(1700, GROUND_Y - 180, 1600, 1900));
  enemies.push(createDrone(2200, GROUND_Y - 160, 2100, 2400));
  enemies.push(createDrone(2700, GROUND_Y - 170, 2600, 2900));
  enemies.push(createDrone(3500, GROUND_Y - 180, 3300, 3700));
  enemies.push(createDrone(4100, GROUND_Y - 170, 3950, 4300));
  enemies.push(createDrone(4700, GROUND_Y - 160, 4550, 4900));
  enemies.push(createDrone(5400, GROUND_Y - 180, 5250, 5600));

  // Fase 1: apenas VIDA e CHIP DE DADOS misturados (munição só aparece na Fase 2)
  const streetCollectibles: [number, number, "health" | "ammo" | "data_chip"][] = [
    [3250, GROUND_Y - 130, "data_chip"],
    [3500, GROUND_Y - 190, "health"],
    [3750, GROUND_Y - 140, "data_chip"],
    [4000, GROUND_Y - 180, "health"],
    [4250, GROUND_Y - 120, "data_chip"],
    [4500, GROUND_Y - 190, "data_chip"],
    [4750, GROUND_Y - 140, "health"],
    [5000, GROUND_Y - 180, "data_chip"],
    [5250, GROUND_Y - 120, "health"],
    [5550, GROUND_Y - 190, "data_chip"],
    [5800, GROUND_Y - 140, "data_chip"],
  ];
  for (const [x, y, type] of streetCollectibles) {
    collectibles.push({
      x, y, width: COLLECTIBLE_SIZE, height: COLLECTIBLE_SIZE, type,
      collected: false, animTimer: Math.random() * 100,
      value: type === "health" ? HEALTH_RESTORE : type === "ammo" ? AMMO_RESTORE : DATA_CHIP_SCORE,
    });
  }

  // Plataforma final com pilar visual indicando "fim da fase"
  platforms.push({
    x: STREETS_PICKUP_X * 2 + 0, y: GROUND_Y, width: 0, height: 0,
    type: "static", glowColor: COLORS.cyan,
  });

  return {
    platforms, enemies, collectibles,
    totalWidth: STREETS_WIDTH,
    bossArenaX: STREETS_WIDTH, // n/a
    sections: {
      streets: { startX: 0, endX: STREETS_WIDTH },
      ducts: { startX: STREETS_WIDTH, endX: STREETS_WIDTH },
      boss: { startX: STREETS_WIDTH, endX: STREETS_WIDTH },
    },
    phaseEndX: STREETS_WIDTH - 200, // gatilho ~200px antes da borda
  };
}

// =====================================================
// Fase 2 — Estruturas Elevadas (Ducts)
// =====================================================
function buildPhase2(): LevelData {
  const platforms: Platform[] = [];
  const collectibles: Collectible[] = [];
  const enemies = [];

  const ductsGrounds: [number, number][] = [
    [0, 300],
    [450, 200],
    [800, 250],
    [1200, 200],
    [1600, 250],
    [2100, 200],
    [2500, 250],
    [2900, 300],
    [3300, 200],
  ];
  for (const [x, w] of ductsGrounds) {
    platforms.push({ x, y: GROUND_Y, width: w, height: PLATFORM_HEIGHT + 20, type: "static", glowColor: COLORS.magenta });
  }

  const ductsPlatforms: [number, number, number, boolean][] = [
    [100, GROUND_Y - 100, 90, false],
    [320, GROUND_Y - 170, 80, true],
    [500, GROUND_Y - 120, 100, false],
    [700, GROUND_Y - 180, 80, true],
    [900, GROUND_Y - 100, 90, false],
    [1050, GROUND_Y - 160, 80, false],
    [1250, GROUND_Y - 120, 90, true],
    [1450, GROUND_Y - 180, 80, false],
    [1650, GROUND_Y - 100, 100, false],
    [1850, GROUND_Y - 160, 80, true],
    [2050, GROUND_Y - 130, 90, false],
    [2250, GROUND_Y - 170, 80, false],
    [2400, GROUND_Y - 110, 100, true],
    [2600, GROUND_Y - 160, 80, false],
    [2800, GROUND_Y - 120, 90, false],
    [3000, GROUND_Y - 170, 80, true],
    [3150, GROUND_Y - 100, 100, false],
  ];
  for (const [x, y, w, moving] of ductsPlatforms) {
    if (moving) {
      platforms.push({
        x, y, width: w, height: PLATFORM_HEIGHT, type: "moving",
        moveMinY: y - 40, moveMaxY: y + 40, moveSpeed: 1, moveAxis: "y", moveDirection: 1,
        glowColor: COLORS.magenta,
      });
    } else {
      platforms.push({ x, y, width: w, height: PLATFORM_HEIGHT, type: "static", glowColor: COLORS.magenta });
    }
  }

  enemies.push(createDrone(300, GROUND_Y - 220, 200, 500, DRONE_SPEED_Z2));
  enemies.push(createDrone(800, GROUND_Y - 200, 600, 1000, DRONE_SPEED_Z2));
  enemies.push(createTurret(600, GROUND_Y - PLATFORM_HEIGHT - 32));
  enemies.push(createTurret(1100, GROUND_Y - 192));
  enemies.push(createDrone(1400, GROUND_Y - 200, 1300, 1600, DRONE_SPEED_Z2));
  enemies.push(createTurret(1700, GROUND_Y - PLATFORM_HEIGHT - 32));
  enemies.push(createDrone(2000, GROUND_Y - 210, 1900, 2200, DRONE_SPEED_Z2));
  enemies.push(createTurret(2350, GROUND_Y - 142));
  enemies.push(createDrone(2700, GROUND_Y - 200, 2500, 2900, DRONE_SPEED_Z2));
  enemies.push(createTurret(3100, GROUND_Y - PLATFORM_HEIGHT - 32));

  const ductsCollectibles: [number, number, "health" | "ammo" | "data_chip"][] = [
    [350, GROUND_Y - 200, "ammo"],
    [750, GROUND_Y - 210, "data_chip"],
    [1100, GROUND_Y - 140, "health"],
    [1500, GROUND_Y - 210, "data_chip"],
    [2100, GROUND_Y - 160, "ammo"],
    [2600, GROUND_Y - 190, "data_chip"],
    [3050, GROUND_Y - 200, "health"],
  ];
  for (const [x, y, type] of ductsCollectibles) {
    collectibles.push({
      x, y, width: COLLECTIBLE_SIZE, height: COLLECTIBLE_SIZE, type,
      collected: false, animTimer: Math.random() * 100,
      value: type === "health" ? HEALTH_RESTORE : type === "ammo" ? AMMO_RESTORE : DATA_CHIP_SCORE,
    });
  }

  return {
    platforms, enemies, collectibles,
    totalWidth: DUCTS_WIDTH,
    bossArenaX: DUCTS_WIDTH,
    sections: {
      streets: { startX: 0, endX: 0 },
      ducts: { startX: 0, endX: DUCTS_WIDTH },
      boss: { startX: DUCTS_WIDTH, endX: DUCTS_WIDTH },
    },
    phaseEndX: DUCTS_WIDTH - 200,
  };
}

// =====================================================
// Fase 3 — Confronto Final (Boss Arena)
// =====================================================
function buildPhase3(): LevelData {
  const platforms: Platform[] = [];
  const collectibles: Collectible[] = [];
  const enemies = [];

  // Chão da arena
  platforms.push({ x: 0, y: GROUND_Y, width: BOSS_ARENA_WIDTH, height: PLATFORM_HEIGHT + 20, type: "static", glowColor: COLORS.magenta });

  // === Plataformas elevadas — agora 5, formando escada de ambos os lados ===
  // Altura máxima de pulo do player ≈ 120px, então as plataformas baixas ficam
  // a 90px (margem confortável) e as médias a 165px (alcançáveis pulando das baixas)

  // Lateral esquerda baixa (pousagem fácil do chão)
  platforms.push({
    x: 80, y: GROUND_Y - 90, width: 140, height: PLATFORM_HEIGHT,
    type: "static", glowColor: COLORS.magenta,
  });
  // Lateral esquerda média (alcançável pulando da lateral baixa)
  platforms.push({
    x: 270, y: GROUND_Y - 165, width: 120, height: PLATFORM_HEIGHT,
    type: "static", glowColor: COLORS.magenta,
  });
  // Lateral direita baixa
  platforms.push({
    x: BOSS_ARENA_WIDTH - 220, y: GROUND_Y - 90, width: 140, height: PLATFORM_HEIGHT,
    type: "static", glowColor: COLORS.magenta,
  });
  // Lateral direita média
  platforms.push({
    x: BOSS_ARENA_WIDTH - 390, y: GROUND_Y - 165, width: 120, height: PLATFORM_HEIGHT,
    type: "static", glowColor: COLORS.magenta,
  });
  // Plataforma central elevada — maior e levemente mais baixa para facilitar pousagem
  // Largura ampliada de 140 → 240 (+100px) | Y reduzido em 1px (-220 → -219)
  platforms.push({
    x: BOSS_ARENA_WIDTH / 2 - 120, y: GROUND_Y - 219, width: 240, height: PLATFORM_HEIGHT,
    type: "static", glowColor: COLORS.magenta,
  });

  // Munição na arena
  collectibles.push({
    x: 150, y: GROUND_Y - 150, width: COLLECTIBLE_SIZE, height: COLLECTIBLE_SIZE,
    type: "ammo", collected: false, animTimer: 0, value: AMMO_RESTORE,
  });
  collectibles.push({
    x: BOSS_ARENA_WIDTH - 170, y: GROUND_Y - 150, width: COLLECTIBLE_SIZE, height: COLLECTIBLE_SIZE,
    type: "ammo", collected: false, animTimer: 0, value: AMMO_RESTORE,
  });

  // Boss
  enemies.push(createBoss(BOSS_ARENA_WIDTH / 2 - 60, CANVAS_HEIGHT * 0.2));

  return {
    platforms, enemies, collectibles,
    totalWidth: BOSS_ARENA_WIDTH,
    bossArenaX: 0,
    sections: {
      streets: { startX: 0, endX: 0 },
      ducts: { startX: 0, endX: 0 },
      boss: { startX: 0, endX: BOSS_ARENA_WIDTH },
    },
    phaseEndX: -1, // só termina ao matar o boss
  };
}

export function generateLevel(phase: PhaseId = 1): LevelData {
  if (phase === 1) return buildPhase1();
  if (phase === 2) return buildPhase2();
  return buildPhase3();
}

export function generateBackgroundBuildings(totalWidth: number = STREETS_WIDTH): BackgroundBuilding[] {
  const buildings: BackgroundBuilding[] = [];
  const buildingColors = ["#0d0d1a", "#111122", "#0a0a18", "#12122a", "#0e0e20"];

  let x = -100;
  while (x < totalWidth + 200) {
    const width = 40 + Math.random() * 80;
    const height = 80 + Math.random() * 250;
    const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

    const windows: { x: number; y: number; lit: boolean }[] = [];
    const cols = Math.floor(width / 16);
    const rows = Math.floor(height / 20);
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        windows.push({ x: 6 + col * 16, y: 8 + row * 20, lit: Math.random() > 0.5 });
      }
    }
    buildings.push({ x, width, height, color, windows });
    x += width + 5 + Math.random() * 30;
  }
  return buildings;
}

export function updateMovingPlatforms(platforms: Platform[]) {
  for (const p of platforms) {
    if (p.type !== "moving") continue;
    if (p.moveAxis === "y") {
      p.y += (p.moveSpeed || 1) * (p.moveDirection || 1);
      if (p.moveMinY !== undefined && p.y <= p.moveMinY) { p.y = p.moveMinY; p.moveDirection = 1; }
      if (p.moveMaxY !== undefined && p.y >= p.moveMaxY) { p.y = p.moveMaxY; p.moveDirection = -1; }
    } else {
      p.x += (p.moveSpeed || 1) * (p.moveDirection || 1);
      if (p.moveMinX !== undefined && p.x <= p.moveMinX) { p.x = p.moveMinX; p.moveDirection = 1; }
      if (p.moveMaxX !== undefined && p.x >= p.moveMaxX) { p.x = p.moveMaxX; p.moveDirection = -1; }
    }
  }
}

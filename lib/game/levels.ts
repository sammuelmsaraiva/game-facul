// ============================
// Neon Escape - Level Design
// ============================

import type { LevelData, Platform, Collectible, BackgroundBuilding } from "./types";
import {
  STREETS_WIDTH,
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
  COLORS,
} from "./constants";
import { createDrone, createTracker, createTurret, createBoss } from "./enemies";

export function generateLevel(): LevelData {
  const totalWidth = STREETS_WIDTH + DUCTS_WIDTH + BOSS_ARENA_WIDTH;
  const ductsStart = STREETS_WIDTH;
  const bossStart = STREETS_WIDTH + DUCTS_WIDTH;

  const platforms: Platform[] = [];
  const collectibles: Collectible[] = [];
  const enemies = [];

  // ========================
  // SECTION 1 - THE STREETS (Presentation)
  // ========================

  // Ground segments (with gaps for platforming)
  const streetGrounds: [number, number][] = [
    [0, 400],
    [480, 700],
    [800, 500],
    [1400, 400],
    [1900, 500],
    [2500, 500],
  ];

  for (const [x, w] of streetGrounds) {
    platforms.push({
      x,
      y: GROUND_Y,
      width: w,
      height: PLATFORM_HEIGHT + 20,
      type: "static",
      glowColor: COLORS.cyan,
    });
  }

  // Floating platforms in the streets
  const streetPlatforms: [number, number, number][] = [
    [200, GROUND_Y - 80, 120],
    [420, GROUND_Y - 140, 100],
    [600, GROUND_Y - 90, 130],
    [900, GROUND_Y - 130, 100],
    [1100, GROUND_Y - 80, 150],
    [1300, GROUND_Y - 160, 100],
    [1550, GROUND_Y - 100, 120],
    [1750, GROUND_Y - 150, 100],
    [2000, GROUND_Y - 80, 140],
    [2200, GROUND_Y - 130, 100],
    [2450, GROUND_Y - 100, 120],
    [2700, GROUND_Y - 150, 100],
  ];

  for (const [x, y, w] of streetPlatforms) {
    platforms.push({
      x,
      y,
      width: w,
      height: PLATFORM_HEIGHT,
      type: "static",
      glowColor: COLORS.cyan,
    });
  }

  // Street enemies (slow drones)
  enemies.push(createDrone(500, GROUND_Y - 180, 400, 700));
  enemies.push(createDrone(1200, GROUND_Y - 160, 1100, 1400));
  enemies.push(createDrone(2100, GROUND_Y - 200, 1900, 2300));
  enemies.push(createDrone(2600, GROUND_Y - 170, 2500, 2800));

  // Street collectibles (generous)
  const streetCollectibles: [number, number, "health" | "ammo" | "data_chip"][] = [
    [300, GROUND_Y - 110, "data_chip"],
    [650, GROUND_Y - 120, "ammo"],
    [950, GROUND_Y - 160, "data_chip"],
    [1150, GROUND_Y - 110, "health"],
    [1600, GROUND_Y - 130, "ammo"],
    [1800, GROUND_Y - 180, "data_chip"],
    [2050, GROUND_Y - 110, "ammo"],
    [2300, GROUND_Y - 160, "data_chip"],
    [2750, GROUND_Y - 180, "health"],
  ];

  for (const [x, y, type] of streetCollectibles) {
    collectibles.push({
      x,
      y,
      width: COLLECTIBLE_SIZE,
      height: COLLECTIBLE_SIZE,
      type,
      collected: false,
      animTimer: Math.random() * 100,
      value: type === "health" ? HEALTH_RESTORE : type === "ammo" ? AMMO_RESTORE : DATA_CHIP_SCORE,
    });
  }

  // ========================
  // SECTION 2 - THE DUCTS (Challenge)
  // ========================

  // Fewer ground segments, more gaps
  const ductsGrounds: [number, number][] = [
    [ductsStart, 300],
    [ductsStart + 450, 200],
    [ductsStart + 800, 250],
    [ductsStart + 1200, 200],
    [ductsStart + 1600, 250],
    [ductsStart + 2100, 200],
    [ductsStart + 2500, 250],
    [ductsStart + 2900, 300],
    [ductsStart + 3300, 200],
  ];

  for (const [x, w] of ductsGrounds) {
    platforms.push({
      x,
      y: GROUND_Y,
      width: w,
      height: PLATFORM_HEIGHT + 20,
      type: "static",
      glowColor: COLORS.magenta,
    });
  }

  // Floating platforms (some moving)
  const ductsPlatforms: [number, number, number, boolean][] = [
    [ductsStart + 100, GROUND_Y - 100, 90, false],
    [ductsStart + 320, GROUND_Y - 170, 80, true],
    [ductsStart + 500, GROUND_Y - 120, 100, false],
    [ductsStart + 700, GROUND_Y - 180, 80, true],
    [ductsStart + 900, GROUND_Y - 100, 90, false],
    [ductsStart + 1050, GROUND_Y - 160, 80, false],
    [ductsStart + 1250, GROUND_Y - 120, 90, true],
    [ductsStart + 1450, GROUND_Y - 180, 80, false],
    [ductsStart + 1650, GROUND_Y - 100, 100, false],
    [ductsStart + 1850, GROUND_Y - 160, 80, true],
    [ductsStart + 2050, GROUND_Y - 130, 90, false],
    [ductsStart + 2250, GROUND_Y - 170, 80, false],
    [ductsStart + 2400, GROUND_Y - 110, 100, true],
    [ductsStart + 2600, GROUND_Y - 160, 80, false],
    [ductsStart + 2800, GROUND_Y - 120, 90, false],
    [ductsStart + 3000, GROUND_Y - 170, 80, true],
    [ductsStart + 3150, GROUND_Y - 100, 100, false],
  ];

  for (const [x, y, w, moving] of ductsPlatforms) {
    if (moving) {
      platforms.push({
        x,
        y,
        width: w,
        height: PLATFORM_HEIGHT,
        type: "moving",
        moveMinY: y - 40,
        moveMaxY: y + 40,
        moveSpeed: 1,
        moveAxis: "y",
        moveDirection: 1,
        glowColor: COLORS.magenta,
      });
    } else {
      platforms.push({
        x,
        y,
        width: w,
        height: PLATFORM_HEIGHT,
        type: "static",
        glowColor: COLORS.magenta,
      });
    }
  }

  // Duct enemies (drones + trackers + turrets)
  enemies.push(createDrone(ductsStart + 300, GROUND_Y - 220, ductsStart + 200, ductsStart + 500));
  enemies.push(createTracker(ductsStart + 550, GROUND_Y - 160, ductsStart + 400, ductsStart + 700));
  enemies.push(createDrone(ductsStart + 800, GROUND_Y - 200, ductsStart + 600, ductsStart + 1000));
  enemies.push(createTurret(ductsStart + 600, GROUND_Y - PLATFORM_HEIGHT - 32));
  enemies.push(createTurret(ductsStart + 1100, GROUND_Y - 192));
  enemies.push(createTracker(ductsStart + 1200, GROUND_Y - 180, ductsStart + 1050, ductsStart + 1400));
  enemies.push(createDrone(ductsStart + 1400, GROUND_Y - 200, ductsStart + 1300, ductsStart + 1600));
  enemies.push(createTurret(ductsStart + 1700, GROUND_Y - PLATFORM_HEIGHT - 32));
  enemies.push(createTracker(ductsStart + 1900, GROUND_Y - 170, ductsStart + 1750, ductsStart + 2100));
  enemies.push(createDrone(ductsStart + 2000, GROUND_Y - 210, ductsStart + 1900, ductsStart + 2200));
  enemies.push(createTurret(ductsStart + 2350, GROUND_Y - 142));
  enemies.push(createTracker(ductsStart + 2550, GROUND_Y - 190, ductsStart + 2400, ductsStart + 2750));
  enemies.push(createDrone(ductsStart + 2700, GROUND_Y - 200, ductsStart + 2500, ductsStart + 2900));
  enemies.push(createTurret(ductsStart + 3100, GROUND_Y - PLATFORM_HEIGHT - 32));

  // Duct collectibles (fewer)
  const ductsCollectibles: [number, number, "health" | "ammo" | "data_chip"][] = [
    [ductsStart + 350, GROUND_Y - 200, "ammo"],
    [ductsStart + 750, GROUND_Y - 210, "data_chip"],
    [ductsStart + 1100, GROUND_Y - 140, "health"],
    [ductsStart + 1500, GROUND_Y - 210, "data_chip"],
    [ductsStart + 2100, GROUND_Y - 160, "ammo"],
    [ductsStart + 2600, GROUND_Y - 190, "data_chip"],
    [ductsStart + 3050, GROUND_Y - 200, "health"],
  ];

  for (const [x, y, type] of ductsCollectibles) {
    collectibles.push({
      x,
      y,
      width: COLLECTIBLE_SIZE,
      height: COLLECTIBLE_SIZE,
      type,
      collected: false,
      animTimer: Math.random() * 100,
      value: type === "health" ? HEALTH_RESTORE : type === "ammo" ? AMMO_RESTORE : DATA_CHIP_SCORE,
    });
  }

  // ========================
  // SECTION 3 - BOSS ARENA
  // ========================

  // Full ground
  platforms.push({
    x: bossStart,
    y: GROUND_Y,
    width: BOSS_ARENA_WIDTH,
    height: PLATFORM_HEIGHT + 20,
    type: "static",
    glowColor: COLORS.magenta,
  });

  // Elevated platforms in boss arena
  platforms.push({
    x: bossStart + 100,
    y: GROUND_Y - 120,
    width: 120,
    height: PLATFORM_HEIGHT,
    type: "static",
    glowColor: COLORS.magenta,
  });
  platforms.push({
    x: bossStart + BOSS_ARENA_WIDTH - 220,
    y: GROUND_Y - 120,
    width: 120,
    height: PLATFORM_HEIGHT,
    type: "static",
    glowColor: COLORS.magenta,
  });
  platforms.push({
    x: bossStart + BOSS_ARENA_WIDTH / 2 - 60,
    y: GROUND_Y - 200,
    width: 120,
    height: PLATFORM_HEIGHT,
    type: "static",
    glowColor: COLORS.magenta,
  });

  // Ammo pickups in boss arena
  collectibles.push({
    x: bossStart + 150,
    y: GROUND_Y - 150,
    width: COLLECTIBLE_SIZE,
    height: COLLECTIBLE_SIZE,
    type: "ammo",
    collected: false,
    animTimer: 0,
    value: AMMO_RESTORE,
  });
  collectibles.push({
    x: bossStart + BOSS_ARENA_WIDTH - 170,
    y: GROUND_Y - 150,
    width: COLLECTIBLE_SIZE,
    height: COLLECTIBLE_SIZE,
    type: "ammo",
    collected: false,
    animTimer: 0,
    value: AMMO_RESTORE,
  });

  // Boss
  enemies.push(
    createBoss(bossStart + BOSS_ARENA_WIDTH / 2 - 60, CANVAS_HEIGHT * 0.2)
  );

  return {
    platforms,
    enemies,
    collectibles,
    totalWidth,
    bossArenaX: bossStart,
    sections: {
      streets: { startX: 0, endX: STREETS_WIDTH },
      ducts: { startX: ductsStart, endX: ductsStart + DUCTS_WIDTH },
      boss: { startX: bossStart, endX: totalWidth },
    },
  };
}

export function generateBackgroundBuildings(): BackgroundBuilding[] {
  const buildings: BackgroundBuilding[] = [];
  const totalW = STREETS_WIDTH + DUCTS_WIDTH + BOSS_ARENA_WIDTH;
  const buildingColors = ["#0d0d1a", "#111122", "#0a0a18", "#12122a", "#0e0e20"];

  let x = -100;
  while (x < totalW + 200) {
    const width = 40 + Math.random() * 80;
    const height = 80 + Math.random() * 250;
    const color = buildingColors[Math.floor(Math.random() * buildingColors.length)];

    const windows: { x: number; y: number; lit: boolean }[] = [];
    const cols = Math.floor(width / 16);
    const rows = Math.floor(height / 20);
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        windows.push({
          x: 6 + col * 16,
          y: 8 + row * 20,
          lit: Math.random() > 0.5,
        });
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
      if (p.moveMinY !== undefined && p.y <= p.moveMinY) {
        p.y = p.moveMinY;
        p.moveDirection = 1;
      }
      if (p.moveMaxY !== undefined && p.y >= p.moveMaxY) {
        p.y = p.moveMaxY;
        p.moveDirection = -1;
      }
    } else {
      p.x += (p.moveSpeed || 1) * (p.moveDirection || 1);
      if (p.moveMinX !== undefined && p.x <= p.moveMinX) {
        p.x = p.moveMinX;
        p.moveDirection = 1;
      }
      if (p.moveMaxX !== undefined && p.x >= p.moveMaxX) {
        p.x = p.moveMaxX;
        p.moveDirection = -1;
      }
    }
  }
}

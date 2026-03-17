// ============================
// Chrome Rebel - Game Constants
// ============================

// Canvas
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

// Physics
export const GRAVITY = 0.6;
export const MAX_FALL_SPEED = 12;

// Player
export const PLAYER_WIDTH = 32;
export const PLAYER_HEIGHT = 48;
export const PLAYER_SPEED = 4.5;
export const PLAYER_JUMP_FORCE = -12;
export const PLAYER_MAX_HEALTH = 5;
export const PLAYER_START_AMMO = 20;
export const PLAYER_SHOOT_COOLDOWN = 12; // frames
export const PLAYER_INVINCIBLE_TIME = 90; // frames (1.5s at 60fps)

// Projectiles
export const PLAYER_BULLET_SPEED = 10;
export const PLAYER_BULLET_DAMAGE = 1;
export const ENEMY_BULLET_SPEED = 5;
export const ENEMY_BULLET_DAMAGE = 1;
export const BULLET_WIDTH = 12;
export const BULLET_HEIGHT = 4;
export const TRAIL_LENGTH = 5;

// Enemies
export const DRONE_WIDTH = 36;
export const DRONE_HEIGHT = 28;
export const DRONE_SPEED = 1.5;
export const DRONE_HEALTH = 2;
export const DRONE_SHOOT_COOLDOWN = 120; // frames

export const TRACKER_WIDTH = 32;
export const TRACKER_HEIGHT = 30;
export const TRACKER_SPEED = 1.2; // patrol speed
export const TRACKER_CHASE_SPEED = 4.0; // chase speed (GDD: 4.0 u/s)
export const TRACKER_HEALTH = 2;
export const TRACKER_DETECTION_RADIUS = 360; // ~6 unidades (GDD: raio 6)
export const TRACKER_LOST_TIME = 180; // 3s at 60fps — tempo para desistir da perseguição

export const TURRET_WIDTH = 32;
export const TURRET_HEIGHT = 32;
export const TURRET_HEALTH = 3;
export const TURRET_SHOOT_COOLDOWN = 90;

// Boss (GDD: 15 HP, 3 fases)
export const BOSS_WIDTH = 120;
export const BOSS_HEIGHT = 100;
export const BOSS_HEALTH = 15;
export const BOSS_SHOOT_COOLDOWN_P1 = 60; // Fase 1: tiro único a cada 1s
export const BOSS_SHOOT_COOLDOWN_P2 = 45; // Fase 2: 2 tiros a cada 0.75s
export const BOSS_SHOOT_COOLDOWN_P3 = 30; // Fase 3: rajada a cada 0.5s
export const BOSS_SPAWN_COOLDOWN_P1 = 600; // Fase 1: drones a cada 10s
export const BOSS_SPAWN_COOLDOWN_P2 = 480; // Fase 2: trackers a cada 8s
export const BOSS_SPAWN_COOLDOWN_P3 = 300; // Fase 3: ondas mistas a cada 5s
export const BOSS_BULLET_SPREAD = 0.3; // radians

// Collectibles
export const COLLECTIBLE_SIZE = 20;
export const HEALTH_RESTORE = 1;
export const AMMO_RESTORE = 10;
export const DATA_CHIP_SCORE = 100;

// Score (GDD v2.0: drone=10, rastreador=25, atirador=40)
export const DRONE_KILL_SCORE = 10;
export const TRACKER_KILL_SCORE = 25;
export const TURRET_KILL_SCORE = 40;
export const BOSS_KILL_SCORE = 500;

// Camera
export const CAMERA_LERP = 0.08;
export const CAMERA_OFFSET_X = CANVAS_WIDTH * 0.35;
export const CAMERA_OFFSET_Y = CANVAS_HEIGHT * 0.5;

// Level
export const GROUND_Y = CANVAS_HEIGHT - 40;
export const PLATFORM_HEIGHT = 16;
export const VOID_Y = CANVAS_HEIGHT + 200; // fall below this = death

// Section widths
export const STREETS_WIDTH = 3000;
export const DUCTS_WIDTH = 3500;
export const BOSS_ARENA_WIDTH = CANVAS_WIDTH;

// Colors (Cyberpunk Palette)
export const COLORS = {
  background: "#0a0a12",
  backgroundGradientTop: "#0a0a12",
  backgroundGradientBottom: "#1a0033",
  cyan: "#00FFFF",
  magenta: "#FF00FF",
  neonGreen: "#00FF41",
  red: "#FF0040",
  orange: "#FF6B00",
  yellow: "#FFE400",
  purple: "#8B00FF",
  darkPurple: "#1a0033",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#333344",
  darkGray: "#1a1a2e",
  playerBody: "#00FF41",
  playerGlow: "#00FF41",
  droneBody: "#FF6B00",
  droneGlow: "#FF4500",
  trackerBody: "#FF00CC",
  trackerGlow: "#CC00FF",
  turretBody: "#FF0040",
  turretGlow: "#FF0040",
  bossBody: "#FF00FF",
  bossGlow: "#8B00FF",
  platformGlow: "#00FFFF",
  bulletPlayer: "#00FFFF",
  bulletEnemy: "#FF0040",
  healthPickup: "#00FF41",
  ammoPickup: "#00FFFF",
  dataChip: "#FFE400",
  hud: "#00FFFF",
  hudHealth: "#00FF41",
  hudAmmo: "#00FFFF",
  hudScore: "#FFE400",
} as const;

// Particles
export const PARTICLE_COUNT_EXPLOSION = 15;
export const PARTICLE_COUNT_COLLECT = 8;
export const PARTICLE_LIFE = 40; // frames

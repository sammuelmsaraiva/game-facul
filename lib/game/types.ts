// ============================
// Neon Escape - Game Types
// ============================

export type GameScreen =
  | "menu"
  | "playing"
  | "paused"
  | "gameover"
  | "victory"
  | "credits"
  | "controls";

export type Direction = "left" | "right";

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------- Player ----------
export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  direction: Direction;
  health: number;
  maxHealth: number;
  ammo: number;
  score: number;
  isGrounded: boolean;
  isJumping: boolean;
  isShooting: boolean;
  shootCooldown: number;
  invincible: boolean;
  invincibleTimer: number;
  animFrame: number;
  animTimer: number;
  alive: boolean;
}

// ---------- Enemies ----------
export type EnemyType = "drone" | "tracker" | "turret" | "boss";

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  type: EnemyType;
  health: number;
  maxHealth: number;
  alive: boolean;
  direction: Direction;
  shootCooldown: number;
  shootTimer: number;
  patrolMinX: number;
  patrolMaxX: number;
  animTimer: number;
  // Boss-specific
  bossPhase?: number;
  bossAttackTimer?: number;
  // Tracker-specific
  trackingPlayer?: boolean;
  lostPlayerTimer?: number;
  homeX?: number;
  homeY?: number;
}

// ---------- Platforms ----------
export type PlatformType = "static" | "moving";

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  // Moving platform
  moveMinX?: number;
  moveMaxX?: number;
  moveMinY?: number;
  moveMaxY?: number;
  moveSpeed?: number;
  moveAxis?: "x" | "y";
  moveDirection?: number;
  glowColor: string;
}

// ---------- Projectiles ----------
export type ProjectileOwner = "player" | "enemy";

export interface Projectile {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  owner: ProjectileOwner;
  damage: number;
  alive: boolean;
  trail: Vector2[];
  color: string;
}

// ---------- Collectibles ----------
export type CollectibleType = "health" | "ammo" | "data_chip";

export interface Collectible {
  x: number;
  y: number;
  width: number;
  height: number;
  type: CollectibleType;
  collected: boolean;
  animTimer: number;
  value: number;
}

// ---------- Particles ----------
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
}

// ---------- Camera ----------
export interface Camera {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  shakeIntensity: number;
  shakeTimer: number;
}

// ---------- Level ----------
export type LevelSection = "streets" | "ducts" | "boss";

export interface LevelData {
  platforms: Platform[];
  enemies: Enemy[];
  collectibles: Collectible[];
  totalWidth: number;
  bossArenaX: number;
  sections: {
    streets: { startX: number; endX: number };
    ducts: { startX: number; endX: number };
    boss: { startX: number; endX: number };
  };
}

// ---------- Background ----------
export interface BackgroundBuilding {
  x: number;
  width: number;
  height: number;
  color: string;
  windows: { x: number; y: number; lit: boolean }[];
}

// ---------- Game State ----------
export interface GameState {
  screen: GameScreen;
  player: Player;
  enemies: Enemy[];
  platforms: Platform[];
  projectiles: Projectile[];
  collectibles: Collectible[];
  particles: Particle[];
  camera: Camera;
  level: LevelData;
  backgroundBuildings: BackgroundBuilding[];
  time: number;
  deltaTime: number;
  bossDefeated: boolean;
  screenShake: number;
  currentZone: LevelSection;
  zoneTransitionTimer: number;
  zoneTransitionName: string;
  damageFlashTimer: number;
}

// ---------- Input ----------
export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  down: boolean;
  shoot: boolean;
  pause: boolean;
  jumpPressed: boolean;
  shootPressed: boolean;
  pausePressed: boolean;
}

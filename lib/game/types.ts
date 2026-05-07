// ============================
// Neon Escape - Game Types
// ============================

export type GameScreen =
  | "menu"
  | "ready"
  | "playing"
  | "paused"
  | "upgrade"
  | "phase_complete"
  | "phase_loading"
  | "gameover"
  | "victory"
  | "credits"
  | "controls"
  | "settings";

export type PhaseId = 1 | 2 | 3;

export type WeaponMode = "none" | "single" | "shotgun" | "rapid";

export type PendingUpgrade =
  | "weapon_unlock"
  | "weapon_choice"
  | "intro_enemies"
  | "intro_collectibles"
  | null;

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
  canShoot: boolean;
  weaponMode: WeaponMode;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpHeld: boolean;
  prevVy: number;
  // Anim timers para squash & stretch e muzzle flash
  jumpAnimTimer: number;   // frames desde último pulo (para esticar sprite)
  landAnimTimer: number;   // frames desde último pouso (para achatar sprite)
  muzzleFlashTimer: number; // frames de muzzle flash ativo
  // Crítico (1/10): última bala foi crítica?
  noDamageTimer: number; // frames sem tomar dano (regen)
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
  hitFlashTimer?: number; // frames de flash branco/vermelho ao tomar dano
  direction: Direction;
  shootCooldown: number;
  shootTimer: number;
  patrolMinX: number;
  patrolMaxX: number;
  animTimer: number;
  // Boss-specific
  bossPhase?: number;
  bossAttackTimer?: number;
  bossPathT?: number; // parâmetro acumulado da lemniscata (não reseta entre fases)
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

// ---------- Damage Numbers ----------
// Números flutuantes ("-1", "-2", "CRIT") que aparecem ao acertar inimigos.
// Espelham o feedback de Risk of Rain 2 / Dead Cells.
export interface DamageNumber {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  big: boolean; // true quando é dano em boss (texto maior)
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
  // Linha de chegada (X) — quando o player passa daqui, fase está completa.
  // Para fase 3 (boss), termina ao matar o boss; phaseEndX = -1
  phaseEndX: number;
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
  damageNumbers: DamageNumber[];
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
  pendingUpgrade: PendingUpgrade;
  upgradeSelection: number;
  zonesUnlocked: { ducts: boolean; boss: boolean };
  hitStopTimer: number;
  // Fase atual (1 | 2 | 3) e timer de transição entre fases
  currentPhase: PhaseId;
  phaseTransitionTimer: number; // contador da animação fade in/out
  phaseScore: number; // pontuação ao iniciar a fase (para diff no resumo)
  // Animação visual de confirmação em telas de upgrade (frames > 0 → desenha highlight)
  upgradeConfirmAnim: number;
  killCount: number; // total de inimigos abatidos (mostrado no pause)
  idleTimer: number; // frames sem se mover — ativa indicador de objetivo
  scorePulseTimer: number; // frames de animação de score recém ganho
  // Sequência cinematográfica de morte: hit-stop pesado → slow-mo → fade vermelho → gameover
  deathSequenceTimer: number;
  // === Cheats de desenvolvedor (apenas para testes) ===
  cheatInvincible: boolean;
  // Rank no high-score após victory/gameover (null se não entrou no top 5)
  lastRank: number | null;
  // Tempo total da run (cumulativo entre fases) — em frames
  runTime: number;
  // ID único da run — usado para deduplicar entradas no high-score
  runId: string;
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
  unpausePressed: boolean;
  confirmPressed: boolean;
  leftPressed: boolean;
  rightPressed: boolean;
  clickPressed: boolean; // clique do mouse (single fire) — confirma telas de upgrade/menu
  // === Cheats de desenvolvedor — todos frame-único ===
  cheatTogglePressed: boolean; // Insert — liga/desliga God Mode
  cheatHealPressed: boolean;   // PageUp — vida cheia
  cheatSkipPressed: boolean;   // PageDown — pula para fim da fase
  cheatAmmoPressed: boolean;   // Home — +50 munição
}

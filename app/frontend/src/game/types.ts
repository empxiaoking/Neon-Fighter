import type { SkillId, SkillRanks } from './skills';

export type Vec2 = { x: number; y: number };

export type Entity = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  alive: boolean;
};

export type Player = Entity & {
  lives: number;
  invincibleUntil: number;
  shootCooldown: number;
  // Timed buff powerups (rapid/shield/speed/nocd) -> absolute game time at which they expire.
  powerups: Partial<Record<PowerupType, number>>;
  // Rapid-fire stack count: each additional pickup while rapid is already
  // active grants +30% firing rate on top of the previous stack.
  rapidStacks: number;
  // Remaining shield block charges. Each hit consumes one charge; the shield
  // buff only ends when either the timer expires OR charges reach 0. Picking
  // up another shield powerup resets charges back to the max.
  shieldCharges: number;
  // Per-active-skill cooldown ready-at time (absolute game time).
  skillReadyAt: Partial<Record<SkillId, number>>;
};

// Raiden-inspired roster:
//  - square / triangle / diamond: legacy swarm variants (kept for compatibility).
//  - fighter : light zig-zag interceptor, dives from the top.
//  - gunship : heavier frigate, stops partway and fires a 3-shot aimed burst.
//  - bomber  : slow mid-altitude bomber, releases a fan of slow shells.
//  - turret  : fixed gun emplacement at the top edge, fires a ring/spread.
//  - midBoss : large warship, sweeps across and fires bullet rings.
export type EnemyKind =
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'fighter'
  | 'gunship'
  | 'bomber'
  | 'turret'
  | 'midBoss';

export type Enemy = Entity & {
  kind: EnemyKind;
  score: number;
  hp: number;
  maxHp: number;
  color: string;
  spawnTime: number;
  fireCooldown: number;
  burstCount: number;
  phaseTime: number;
  baseX: number;
  amplitude: number;
  frequency: number;
  haltY?: number;
  angle: number;
};

export type BulletKind = 'bullet' | 'missile' | 'enemy' | 'enemyAimed' | 'enemyShell';

export type Bullet = Entity & {
  fromPlayer: boolean;
  damage: number;
  kind?: BulletKind;
  color?: string;
};

// Powerup types — `spread` (T = three-way scatter) removed along with the
// spread school. `nocd` resets/freezes all skill cooldowns for its duration.
export type PowerupType = 'rapid' | 'shield' | 'heal' | 'speed' | 'nocd';

export type Powerup = Entity & {
  kind: PowerupType;
  spawnTime: number;
};

export type Particle = {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

export type Drone = Entity & {
  angle: number;
  expireAt: number;
  shootCooldown: number;
};

export type LaserBeamState = {
  active: boolean;
  endAt: number;
  tickCooldown: number;
};

export type Progression = {
  level: number;
  xp: number;
  xpToNext: number;
  skillPoints: number;
  paragonPoints: number;
  ranks: SkillRanks;
  /** Paragon level reached (0 = not yet at LEVEL_MAX). */
  paragonLevel: number;
  /** True once both LEVEL_MAX and PARAGON_MAX are hit. */
  endless: boolean;
};

export type GameState = 'start' | 'playing' | 'gameover' | 'paused';
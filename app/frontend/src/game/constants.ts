export const CANVAS_W = 800;
export const CANVAS_H = 600;

export const COLORS = {
  bg: '#000000',
  player: '#00FFFF',
  // Legacy swarm enemies
  enemySquare: '#FF00FF',
  enemyTriangle: '#FF0066',
  enemyDiamond: '#9D4EDD',
  // Raiden-inspired roster
  enemyFighter: '#FF4444',
  enemyGunship: '#FFB300',
  enemyBomber: '#55AA66',
  enemyTurret: '#AA77FF',
  enemyMidBoss: '#FF3300',
  // Projectiles
  bullet: '#FFFF00',
  enemyBullet: '#FF5577',
  enemyAimedBullet: '#FFAA33',
  enemyShell: '#66FF99',
  powerupRapid: '#FFAA00',
  powerupShield: '#00AAFF',
  powerupHeal: '#00FF88',
  powerupSpeed: '#00FFAA',
  powerupNoCd: '#FFD700',
};

// No-CD powerup: while active, all active skills ignore cooldown.
// Stacks additively up to NO_CD_MAX_DURATION seconds.
export const NO_CD_DURATION = 5;
export const NO_CD_MAX_DURATION = 5;

export const PLAYER_SPEED = 320;
export const BULLET_SPEED = 600;
export const ENEMY_BASE_SPEED = 80;
export const SHOOT_COOLDOWN = 0.22;
export const RAPID_COOLDOWN = 0.08;
export const POWERUP_DURATION = 8;
export const POWERUP_EXTEND_RATIO = 0.4;
export const POWERUP_MAX_DURATION = 16;
export const INVINCIBLE_DURATION = 1.5;
export const MAX_LIVES = 5;
export const STARTING_LIVES = 5;

export const BASE_BULLET_DAMAGE = 1;
export const MISSILE_DAMAGE = 2;

// Rapid fire stacking: each additional pickup while rapid is active grants
// +30% firing rate (shorter cooldown) on top of the previous stack.
export const RAPID_STACK_SPEED_BONUS = 0.3; // +30% per stack
export const RAPID_MAX_STACKS = 6; // safety cap
// Speed powerup multiplier (player base move speed x this value).
export const SPEED_POWERUP_MULT = 2.0; // +100% move speed
// Shield charges: number of hits the shield powerup can absorb per pickup.
export const SHIELD_MAX_CHARGES = 2;

// Max HP per enemy kind. Raiden-style heavier units take many hits.
export const ENEMY_HP = {
  square: 1,
  triangle: 1,
  diamond: 2,
  fighter: 1,
  gunship: 5,
  bomber: 7,
  turret: 4,
  midBoss: 45,
} as const;

// Enemy bullet speeds.
export const ENEMY_BULLET_SPEED = 200;
export const ENEMY_AIMED_SPEED = 260;
export const ENEMY_SHELL_SPEED = 150;
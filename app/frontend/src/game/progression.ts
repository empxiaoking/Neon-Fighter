/**
 * Leveling / XP curve.
 *
 * Caps come from `skills.ts`:
 *   - `LEVEL_MAX`   = 80 (total level cap including Paragon levels).
 *   - `PARAGON_MAX` = sum of every PARAGON_DEFS[id].maxRank.
 *   - `PARAGON_UNLOCK_LEVEL` = 66.
 *
 * Skill point rules:
 *   - Lv 1 → 66: each level-up grants exactly 1 skill point. No bonus milestones.
 *   - At level 66, the Paragon system unlocks. XP beyond level 66 feeds Paragon
 *     levels, each granting 1 Paragon point. Regular levels cap at 66.
 *   - When Paragon reaches PARAGON_MAX the player enters Endless mode — XP stops
 *     accumulating, no more levels / points are awarded.
 */

import {
  LEVEL_MAX,
  PARAGON_MAX,
  PARAGON_UNLOCK_LEVEL,
} from './skills';

export { LEVEL_MAX, PARAGON_MAX, PARAGON_UNLOCK_LEVEL };

/** Backwards-compat alias used by older modules. */
export const MAX_LEVEL = LEVEL_MAX;

export const xpToNext = (level: number): number => {
  if (level >= LEVEL_MAX + PARAGON_MAX) return Infinity;
  return Math.round(80 + (level - 1) * 30 + Math.pow(level - 1, 1.4) * 4);
};

export const isParagonLevel = (level: number): boolean => level >= PARAGON_UNLOCK_LEVEL;

/**
 * Skill points granted when reaching `level` (called once per level-up).
 * Level 1 = starting level, gives 0. Levels 2..PARAGON_UNLOCK_LEVEL give
 * exactly 1 each. Beyond PARAGON_UNLOCK_LEVEL regular skill points stop —
 * XP feeds Paragon points instead.
 */
export const skillPointsOnLevelUp = (level: number): number => {
  if (level <= 1 || level > PARAGON_UNLOCK_LEVEL) return 0;
  return 1;
};

export const enemyXp = (
  kind:
    | 'square'
    | 'triangle'
    | 'diamond'
    | 'fighter'
    | 'gunship'
    | 'bomber'
    | 'turret'
    | 'midBoss',
): number => {
  switch (kind) {
    case 'fighter':
      return 55;
    case 'square':
      return 70;
    case 'triangle':
      return 85;
    case 'diamond':
      return 130;
    case 'turret':
      return 160;
    case 'gunship':
      return 190;
    case 'bomber':
      return 250;
    case 'midBoss':
      return 1600;
  }
};
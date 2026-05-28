/**
 * Skill tree definition — pruned to 3 schools (Missile / Laser / Drone).
 *
 * Structure (Diablo 4 inspired):
 *   - 3 schools × 4 layers (T0 basic / T1 core / T2 advanced / T3 key passive)
 *   - Each school's T0 is the main active skill
 *   - T1 core nodes modify stats (up to 5 ranks each)
 *   - T2 advanced nodes add new behaviours (up to 3 ranks each)
 *   - T3 key passive: 1 rank; **only 1 key passive can be active at a time**
 *   - Paragon board: shared points unlocked at level 66
 *
 * Total nodes per school = T0(1) + T1(3×5=15) + T2(2×3=6) + T3(1) = 23
 * Total tree nodes = 23 × 3 = 69
 *
 * SKILL POINT BUDGET (see progression.ts → skillPointsOnLevelUp):
 *   - Levels 1 → 66 grant exactly 1 skill point per level-up. No bonus milestones.
 *   - Reaching level 66 unlocks the Paragon system for further progression.
 *
 * Removed in this revision: `spread` school (s_*), `emp` school (e_*) and the
 * standalone `timeWarp` utility skill. The 4th hotbar slot is now empty.
 */

// ----------------------------------------------------------------------------
// IDs
// ----------------------------------------------------------------------------

// Active skill ids — slot 4 (timeWarp) removed.
export type SkillId =
  | 'basic'
  | 'missileBarrage'
  | 'laserBeam'
  | 'droneSwarm';

export const SKILL_IDS: SkillId[] = [
  'basic',
  'missileBarrage',
  'laserBeam',
  'droneSwarm',
];

// Schools in the skill tree (pruned).
export type SchoolId = 'missile' | 'laser' | 'drone';

// Tree node ids — 3 schools.
export type TreeNodeId =
  // Missile school
  | 'missileBarrage' // T0 basic
  | 'm_saturation' // T1 core: +missile count
  | 'm_precision' // T1 core: +damage
  | 'm_ammo' // T1 core: -cooldown
  | 'm_heatseek' // T2 advanced: tracking
  | 'm_mirv' // T2 advanced: split warhead
  | 'm_key_saturation' // T3 key passive

  // Laser school
  | 'laserBeam'
  | 'l_highenergy'
  | 'l_amplifier'
  | 'l_recharge'
  | 'l_prism'
  | 'l_searing'
  | 'l_key_annihilation'

  // Drone school
  | 'droneSwarm'
  | 'd_swarmsize'
  | 'd_arms'
  | 'd_extended'
  | 'd_division'
  | 'd_reactor'
  | 'd_key_eternal';

export type NodeLayer = 'T0' | 'T1' | 'T2' | 'T3';
export type NodeKind = 'basic' | 'core' | 'advanced' | 'key';

// ----------------------------------------------------------------------------
// Active skill definitions
// ----------------------------------------------------------------------------

export type SkillDef = {
  id: SkillId;
  slot: number;
  name: string;
  description: string;
  color: string;
  maxRank: number;
  unlockLevel: number;
  cooldown: number;
  keyLabel: string;
};

export const SKILL_DEFS: Record<SkillId, SkillDef> = {
  basic: {
    id: 'basic',
    slot: 0,
    name: '等离子主炮',
    description:
      '默认普攻（空格）。随等级自动强化：\nLv5 +30% 伤害 · Lv10 双发 · Lv20 三发 · Lv30 穿透 · Lv45 灼烧。',
    color: '#00FFFF',
    maxRank: 5,
    unlockLevel: 1,
    cooldown: 0,
    keyLabel: 'Space',
  },
  missileBarrage: {
    id: 'missileBarrage',
    slot: 1,
    name: '导弹齐射',
    description: '扇形导弹齐射，高伤害穿透。',
    color: '#FF6600',
    maxRank: 1,
    unlockLevel: 3,
    cooldown: 8,
    keyLabel: '1',
  },
  laserBeam: {
    id: 'laserBeam',
    slot: 2,
    name: '持续激光',
    description: '头顶发射持续光束，消弹、穿透。',
    color: '#FFFF00',
    maxRank: 1,
    unlockLevel: 6,
    cooldown: 10,
    keyLabel: '2',
  },
  droneSwarm: {
    id: 'droneSwarm',
    slot: 3,
    name: '无人机集群',
    description: '召唤环绕无人机持续输出。',
    color: '#FF66CC',
    maxRank: 1,
    unlockLevel: 15,
    cooldown: 15,
    keyLabel: '3',
  },
};

// ----------------------------------------------------------------------------
// Tree node definitions
// ----------------------------------------------------------------------------

export type TreeNodeDef = {
  id: TreeNodeId;
  school: SchoolId;
  layer: NodeLayer;
  kind: NodeKind;
  name: string;
  short: string;
  maxRank: number;
  unlockLevel: number;
  requires?: { ids: TreeNodeId[]; total: number };
  schoolPointsRequired?: number;
};

export const SCHOOL_COLORS: Record<SchoolId, string> = {
  missile: '#FF6600',
  laser: '#FFFF00',
  drone: '#FF33AA',
};

export const SCHOOL_NAMES: Record<SchoolId, string> = {
  missile: '追踪导弹',
  laser: '激光',
  drone: '无人机',
};

const mk = (d: TreeNodeDef): TreeNodeDef => d;

export const TREE_NODES: Record<TreeNodeId, TreeNodeDef> = {
  // --------------- MISSILE ---------------
  missileBarrage: mk({
    id: 'missileBarrage',
    school: 'missile',
    layer: 'T0',
    kind: 'basic',
    name: '导弹发射器',
    short: '解锁主动：导弹齐射（按 1）',
    maxRank: 1,
    unlockLevel: 3,
  }),
  m_saturation: mk({
    id: 'm_saturation',
    school: 'missile',
    layer: 'T1',
    kind: 'core',
    name: '饱和弹幕',
    short: '每级 +1 枚导弹',
    maxRank: 5,
    unlockLevel: 4,
    requires: { ids: ['missileBarrage'], total: 1 },
  }),
  m_precision: mk({
    id: 'm_precision',
    school: 'missile',
    layer: 'T1',
    kind: 'core',
    name: '精准制导',
    short: '每级 +12% 导弹伤害',
    maxRank: 5,
    unlockLevel: 4,
    requires: { ids: ['missileBarrage'], total: 1 },
  }),
  m_ammo: mk({
    id: 'm_ammo',
    school: 'missile',
    layer: 'T1',
    kind: 'core',
    name: '弹药充沛',
    short: '每级 -8% 冷却',
    maxRank: 5,
    unlockLevel: 4,
    requires: { ids: ['missileBarrage'], total: 1 },
  }),
  m_heatseek: mk({
    id: 'm_heatseek',
    school: 'missile',
    layer: 'T2',
    kind: 'advanced',
    name: '热寻追踪',
    short: '导弹获得追踪能力（33%/66%/100%）',
    maxRank: 3,
    unlockLevel: 10,
    requires: { ids: ['m_saturation', 'm_precision'], total: 3 },
  }),
  m_mirv: mk({
    id: 'm_mirv',
    school: 'missile',
    layer: 'T2',
    kind: 'advanced',
    name: '分裂弹头',
    short: '导弹命中后分裂 2/3/4 枚微弹',
    maxRank: 3,
    unlockLevel: 12,
    requires: { ids: ['m_precision', 'm_ammo'], total: 3 },
  }),
  m_key_saturation: mk({
    id: 'm_key_saturation',
    school: 'missile',
    layer: 'T3',
    kind: 'key',
    name: '🔑 饱和覆盖',
    short: '击杀叠层，下次齐射 +6 导弹（5s）',
    maxRank: 1,
    unlockLevel: 25,
    schoolPointsRequired: 8,
  }),

  // --------------- LASER ---------------
  laserBeam: mk({
    id: 'laserBeam',
    school: 'laser',
    layer: 'T0',
    kind: 'basic',
    name: '粒子光束',
    short: '解锁主动：持续激光（按 2）',
    maxRank: 1,
    unlockLevel: 6,
  }),
  l_highenergy: mk({
    id: 'l_highenergy',
    school: 'laser',
    layer: 'T1',
    kind: 'core',
    name: '高能输出',
    short: '每级 +15% 激光 DPS',
    maxRank: 5,
    unlockLevel: 7,
    requires: { ids: ['laserBeam'], total: 1 },
  }),
  l_amplifier: mk({
    id: 'l_amplifier',
    school: 'laser',
    layer: 'T1',
    kind: 'core',
    name: '光束强化',
    short: '每级 +4px 激光宽度',
    maxRank: 5,
    unlockLevel: 7,
    requires: { ids: ['laserBeam'], total: 1 },
  }),
  l_recharge: mk({
    id: 'l_recharge',
    school: 'laser',
    layer: 'T1',
    kind: 'core',
    name: '蓄能恢复',
    short: '每级 -10% 冷却',
    maxRank: 5,
    unlockLevel: 7,
    requires: { ids: ['laserBeam'], total: 1 },
  }),
  l_prism: mk({
    id: 'l_prism',
    school: 'laser',
    layer: 'T2',
    kind: 'advanced',
    name: '分光棱镜',
    short: '每级 +1 道斜向激光（15°/30°/45°）',
    maxRank: 3,
    unlockLevel: 14,
    requires: { ids: ['l_highenergy', 'l_amplifier'], total: 3 },
  }),
  l_searing: mk({
    id: 'l_searing',
    school: 'laser',
    layer: 'T2',
    kind: 'advanced',
    name: '灼烧穿透',
    short: '激光附加 DoT，每级 +10 DPS',
    maxRank: 3,
    unlockLevel: 16,
    requires: { ids: ['l_highenergy'], total: 3 },
  }),
  l_key_annihilation: mk({
    id: 'l_key_annihilation',
    school: 'laser',
    layer: 'T3',
    kind: 'key',
    name: '🔑 湮灭激光',
    short: '持续命中同一敌人，每 0.5s +25% 伤害（叠 8 层）',
    maxRank: 1,
    unlockLevel: 25,
    schoolPointsRequired: 8,
  }),

  // --------------- DRONE ---------------
  droneSwarm: mk({
    id: 'droneSwarm',
    school: 'drone',
    layer: 'T0',
    kind: 'basic',
    name: '无人机控制舱',
    short: '解锁主动：无人机集群（按 3）',
    maxRank: 1,
    unlockLevel: 15,
  }),
  d_swarmsize: mk({
    id: 'd_swarmsize',
    school: 'drone',
    layer: 'T1',
    kind: 'core',
    name: '集群规模',
    short: '每级 +1 架无人机',
    maxRank: 5,
    unlockLevel: 16,
    requires: { ids: ['droneSwarm'], total: 1 },
  }),
  d_arms: mk({
    id: 'd_arms',
    school: 'drone',
    layer: 'T1',
    kind: 'core',
    name: '军工级武装',
    short: '每级 +15% 无人机伤害',
    maxRank: 5,
    unlockLevel: 16,
    requires: { ids: ['droneSwarm'], total: 1 },
  }),
  d_extended: mk({
    id: 'd_extended',
    school: 'drone',
    layer: 'T1',
    kind: 'core',
    name: '延长部署',
    short: '每级 +2s 持续时间',
    maxRank: 5,
    unlockLevel: 16,
    requires: { ids: ['droneSwarm'], total: 1 },
  }),
  d_division: mk({
    id: 'd_division',
    school: 'drone',
    layer: 'T2',
    kind: 'advanced',
    name: '分工协作',
    short: '无人机获得 +1 发射频率（每级）',
    maxRank: 3,
    unlockLevel: 22,
    requires: { ids: ['d_swarmsize', 'd_extended'], total: 3 },
  }),
  d_reactor: mk({
    id: 'd_reactor',
    school: 'drone',
    layer: 'T2',
    kind: 'advanced',
    name: '能源反应堆',
    short: '无人机击杀敌人 33/66/100% 概率掉落道具',
    maxRank: 3,
    unlockLevel: 24,
    requires: { ids: ['d_arms'], total: 3 },
  }),
  d_key_eternal: mk({
    id: 'd_key_eternal',
    school: 'drone',
    layer: 'T3',
    kind: 'key',
    name: '🔑 永恒机群',
    short: '无人机持续时间 → 永久（但数量锁定 2 架）',
    maxRank: 1,
    unlockLevel: 30,
    schoolPointsRequired: 8,
  }),
};

export const TREE_NODE_IDS: TreeNodeId[] = Object.keys(TREE_NODES) as TreeNodeId[];

// ----------------------------------------------------------------------------
// Key passive list
// ----------------------------------------------------------------------------

export const KEY_PASSIVE_IDS: TreeNodeId[] = [
  'm_key_saturation',
  'l_key_annihilation',
  'd_key_eternal',
];

// ----------------------------------------------------------------------------
// Paragon board
// ----------------------------------------------------------------------------

export type ParagonId =
  | 'pa_velocity'
  | 'pa_crit'
  | 'pa_pierce'
  | 'pa_chainboom'
  | 'pd_shield'
  | 'pd_engine'
  | 'pd_repair'
  | 'pd_lucky'
  | 'pe_researcher'
  | 'pe_scavenger'
  | 'pe_rescue'
  | 'ps_relay'
  | 'ps_recovery';

export type ParagonDef = {
  id: ParagonId;
  panel: 'attack' | 'defense' | 'economy' | 'synergy';
  name: string;
  short: string;
  maxRank: number;
};

export const PARAGON_DEFS: Record<ParagonId, ParagonDef> = {
  pa_velocity: { id: 'pa_velocity', panel: 'attack', name: '高速弹药', short: '子弹速度 +10/20/30%', maxRank: 3 },
  pa_crit: { id: 'pa_crit', panel: 'attack', name: '暴击强化', short: '10/15/20% 暴击率 × 1.5 伤害', maxRank: 3 },
  pa_pierce: { id: 'pa_pierce', panel: 'attack', name: '穿透本能', short: '普攻 +1 穿透', maxRank: 1 },
  pa_chainboom: { id: 'pa_chainboom', panel: 'attack', name: '连锁爆破', short: '击杀 15/30/45% 小爆炸', maxRank: 3 },
  pd_shield: { id: 'pd_shield', panel: 'defense', name: '能量护盾', short: '每 10s +1 护盾（上限 3）', maxRank: 1 },
  pd_engine: { id: 'pd_engine', panel: 'defense', name: '机动引擎', short: '移速 +10/15/20%', maxRank: 3 },
  pd_repair: { id: 'pd_repair', panel: 'defense', name: '紧急修复', short: '<25% HP 时减伤 30/45/60%', maxRank: 3 },
  pd_lucky: { id: 'pd_lucky', panel: 'defense', name: '幸运币', short: '致命伤害 10/20/30% 不死', maxRank: 3 },
  pe_researcher: { id: 'pe_researcher', panel: 'economy', name: '研究员', short: '技能 CD -5/10/15%', maxRank: 3 },
  pe_scavenger: { id: 'pe_scavenger', panel: 'economy', name: '拾荒者', short: '道具掉落 +20/40/60%', maxRank: 3 },
  pe_rescue: { id: 'pe_rescue', panel: 'economy', name: '战地救援', short: '道具 10/20/30% 变复活币', maxRank: 3 },
  ps_relay: { id: 'ps_relay', panel: 'synergy', name: '弹幕接力', short: '导弹击杀 2s 内激光 CD -50%', maxRank: 1 },
  ps_recovery: { id: 'ps_recovery', panel: 'synergy', name: '弹药回收', short: '激光击杀 20% 刷新导弹 CD 10%', maxRank: 1 },
};

export const PARAGON_IDS: ParagonId[] = Object.keys(PARAGON_DEFS) as ParagonId[];
export type ParagonRanks = Record<ParagonId, number>;
export const createEmptyParagon = (): ParagonRanks => {
  const out = {} as ParagonRanks;
  for (const id of PARAGON_IDS) out[id] = 0;
  return out;
};

// ----------------------------------------------------------------------------
// Progression caps
// ----------------------------------------------------------------------------
//
// `TREE_POINT_DEMAND` = sum of every TREE_NODES[id].maxRank — the exact number
// of skill points needed to fully max the tree.
//
// `LEVEL_MAX` = 80. Regular character levels cap at `PARAGON_UNLOCK_LEVEL` (66).
// Beyond that, XP feeds Paragon levels. The total level display is
// LEVEL_MAX + PARAGON_MAX.
//
// `PARAGON_MAX` = sum of every PARAGON_DEFS[id].maxRank. After hitting
// `PARAGON_UNLOCK_LEVEL` (66), XP feeds Paragon levels instead. Once Paragon
// reaches PARAGON_MAX the player enters Endless mode (no more points / levels).

export const TREE_POINT_DEMAND: number = (Object.values(TREE_NODES) as TreeNodeDef[])
  .reduce((sum, def) => sum + def.maxRank, 0);

export const LEVEL_MAX: number = 80;

export const PARAGON_MAX: number = (Object.values(PARAGON_DEFS) as ParagonDef[])
  .reduce((sum, def) => sum + def.maxRank, 0);

// Paragon unlocks at level 66. Level > PARAGON_UNLOCK_LEVEL routes XP
// into Paragon levels instead of regular levels.
export const PARAGON_UNLOCK_LEVEL: number = 66;

// ----------------------------------------------------------------------------
// Tree ranks
// ----------------------------------------------------------------------------

export type TreeRanks = Record<TreeNodeId, number>;
export type SkillRanks = Record<SkillId, number>;

export const createEmptyRanks = (): SkillRanks => ({
  basic: 0,
  missileBarrage: 0,
  laserBeam: 0,
  droneSwarm: 0,
});

export const createEmptyTreeRanks = (): TreeRanks => {
  const out = {} as TreeRanks;
  for (const id of TREE_NODE_IDS) out[id] = 0;
  return out;
};

export const deriveSkillRanks = (tree: TreeRanks, playerLevel: number): SkillRanks => ({
  basic:
    playerLevel >= 45 ? 5 : playerLevel >= 30 ? 4 : playerLevel >= 20 ? 3 : playerLevel >= 10 ? 2 : playerLevel >= 5 ? 1 : 0,
  missileBarrage: tree.missileBarrage > 0 ? 1 : 0,
  laserBeam: tree.laserBeam > 0 ? 1 : 0,
  droneSwarm: tree.droneSwarm > 0 ? 1 : 0,
});

// ----------------------------------------------------------------------------
// Effect computations
// ----------------------------------------------------------------------------

export type BasicAttackForm = 'single' | 'double' | 'spread';

/**
 * Passive cannon form derived purely from player level (no spread school).
 */
export const getBasicAttackForm = (
  playerLevel: number,
  _tree: TreeRanks,
): BasicAttackForm => {
  if (playerLevel >= 20) return 'spread';
  if (playerLevel >= 10) return 'double';
  return 'single';
};

export const getBasicDamageMultiplier = (
  playerLevel: number,
  _tree: TreeRanks,
  paragon: ParagonRanks,
): number => {
  let m = 1;
  if (playerLevel >= 5) m *= 1.3;
  // Paragon crit rough avg.
  m *= 1 + paragon.pa_crit * 0.075;
  return m;
};

export const getBasicSpreadAngle = (_tree: TreeRanks): number => {
  return (60 * Math.PI) / 180;
};

export const getBasicPierceCount = (
  playerLevel: number,
  paragon: ParagonRanks,
): number => {
  let p = 0;
  if (playerLevel >= 30) p += 1;
  p += paragon.pa_pierce;
  return p;
};

export const getMissileCount = (tree: TreeRanks): number => {
  if (tree.missileBarrage <= 0) return 0;
  return 3 + tree.m_saturation;
};

export const getMissileDamageMult = (tree: TreeRanks): number =>
  1 + 0.12 * tree.m_precision;

export const getMissileCooldown = (tree: TreeRanks, paragon: ParagonRanks): number => {
  let cd = SKILL_DEFS.missileBarrage.cooldown;
  cd *= 1 - 0.08 * tree.m_ammo;
  cd *= 1 - 0.05 * paragon.pe_researcher;
  return Math.max(2, cd);
};

export const getMissileHomingStrength = (tree: TreeRanks): number => {
  return tree.m_heatseek / 3;
};

export const getMissileSplitCount = (tree: TreeRanks): number => {
  if (tree.m_mirv <= 0) return 0;
  return 1 + tree.m_mirv;
};

export const getLaserDuration = (tree: TreeRanks): number => {
  if (tree.laserBeam <= 0) return 0;
  return 3;
};

export const getLaserDamagePerSec = (tree: TreeRanks, paragon: ParagonRanks): number => {
  if (tree.laserBeam <= 0) return 0;
  let dps = 30;
  dps *= 1 + 0.15 * tree.l_highenergy;
  dps *= 1 + paragon.pa_crit * 0.075;
  return dps;
};

export const getLaserWidth = (tree: TreeRanks): number => {
  return 14 + 4 * tree.l_amplifier;
};

export const getLaserCooldown = (tree: TreeRanks, paragon: ParagonRanks): number => {
  let cd = SKILL_DEFS.laserBeam.cooldown;
  cd *= 1 - 0.1 * tree.l_recharge;
  cd *= 1 - 0.05 * paragon.pe_researcher;
  return Math.max(3, cd);
};

export const getLaserPrismCount = (tree: TreeRanks): number => tree.l_prism;

export const getLaserSearingDps = (tree: TreeRanks): number => 10 * tree.l_searing;

export const getDroneCount = (tree: TreeRanks): number => {
  if (tree.droneSwarm <= 0) return 0;
  if (tree.d_key_eternal > 0) return 2;
  return 2 + tree.d_swarmsize;
};

export const getDroneDuration = (tree: TreeRanks): number => {
  if (tree.droneSwarm <= 0) return 0;
  if (tree.d_key_eternal > 0) return Infinity;
  return 10 + 2 * tree.d_extended;
};

export const getDroneDamageMult = (tree: TreeRanks): number =>
  1 + 0.15 * tree.d_arms;

export const getDroneFireRate = (tree: TreeRanks): number => {
  return 2 * (1 + 0.33 * tree.d_division);
};

export const getDroneCooldown = (tree: TreeRanks, paragon: ParagonRanks): number => {
  let cd = SKILL_DEFS.droneSwarm.cooldown;
  cd *= 1 - 0.05 * paragon.pe_researcher;
  return cd;
};

export const getMoveSpeedMult = (paragon: ParagonRanks): number =>
  1 + 0.05 * paragon.pd_engine + (paragon.pd_engine >= 1 ? 0.05 : 0);

export const getPowerupDropMult = (paragon: ParagonRanks): number =>
  1 + 0.2 * paragon.pe_scavenger;

// ----------------------------------------------------------------------------
// Helpers used by UI
// ----------------------------------------------------------------------------

export const getSchoolPoints = (tree: TreeRanks, school: SchoolId): number => {
  let sum = 0;
  for (const id of TREE_NODE_IDS) {
    if (TREE_NODES[id].school === school) sum += tree[id];
  }
  return sum;
};

export const getActiveKeyPassive = (tree: TreeRanks): TreeNodeId | null => {
  for (const id of KEY_PASSIVE_IDS) if (tree[id] > 0) return id;
  return null;
};
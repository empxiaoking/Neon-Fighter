import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CANVAS_W,
  CANVAS_H,
  COLORS,
  PLAYER_SPEED,
  BULLET_SPEED,
  ENEMY_BASE_SPEED,
  SHOOT_COOLDOWN,
  RAPID_COOLDOWN,
  POWERUP_DURATION,
  POWERUP_EXTEND_RATIO,
  POWERUP_MAX_DURATION,
  INVINCIBLE_DURATION,
  MAX_LIVES,
  STARTING_LIVES,
  BASE_BULLET_DAMAGE,
  MISSILE_DAMAGE,
  ENEMY_HP,
  ENEMY_BULLET_SPEED,
  ENEMY_AIMED_SPEED,
  ENEMY_SHELL_SPEED,
  RAPID_STACK_SPEED_BONUS,
  RAPID_MAX_STACKS,
  SPEED_POWERUP_MULT,
  SHIELD_MAX_CHARGES,
  NO_CD_DURATION,
  NO_CD_MAX_DURATION,
} from './constants';
import type {
  Player,
  Enemy,
  Bullet,
  Powerup,
  PowerupType,
  Particle,
  GameState,
  Drone,
  LaserBeamState,
  Progression,
} from './types';
import {
  SKILL_DEFS,
  createEmptyRanks,
  getBasicAttackForm,
  getBasicDamageMultiplier,
  getBasicSpreadAngle,
  getDroneCount,
  getDroneDuration,
  getDroneDamageMult,
  getDroneFireRate,
  getDroneCooldown,
  getLaserDamagePerSec,
  getLaserDuration,
  getLaserWidth,
  getLaserCooldown,
  getLaserPrismCount,
  getLaserSearingDps,
  getMissileCooldown,
  getMissileCount,
  getMissileDamageMult,
  getMissileHomingStrength,
  getMissileSplitCount,
  getMoveSpeedMult,
  getPowerupDropMult,
  type SkillId,
  type SkillRanks,
  type TreeRanks,
  type ParagonRanks,
} from './skills';
import { LEVEL_MAX, PARAGON_MAX, PARAGON_UNLOCK_LEVEL, enemyXp, xpToNext, skillPointsOnLevelUp } from './progression';

type PowerupRemainingMap = Partial<Record<PowerupType, number>>;
type CooldownMap = Partial<Record<SkillId, number>>;

type Props = {
  state: GameState;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onPowerupChange: (remainingByKind: PowerupRemainingMap) => void;
  onProgressionChange: (p: Progression) => void;
  onCooldownsChange: (cd: CooldownMap, base: CooldownMap) => void;
  onGameOver: (finalScore: number) => void;
  onToggleTree: () => void;
  ranks: SkillRanks;
  treeRanks: TreeRanks;
  paragon: ParagonRanks;
  level: number;
  fullResetCounter: number;
  reviveCounter: number;
  initialXp: number;
  initialSkillPoints: number;
  initialParagonPoints: number;
};

let idCounter = 1;
const nextId = () => idCounter++;

type SlowMap = Map<number, number>;

export default function GameCanvas({
  state,
  onScoreChange,
  onLivesChange,
  onPowerupChange,
  onProgressionChange,
  onCooldownsChange,
  onGameOver,
  onToggleTree,
  ranks,
  treeRanks,
  paragon,
  level,
  fullResetCounter,
  reviveCounter,
  initialXp,
  initialSkillPoints,
  initialParagonPoints,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const shakeRef = useRef<number>(0);

  const playerRef = useRef<Player | null>(null);
  const enemiesRef = useRef<Enemy[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const powerupsRef = useRef<Powerup[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const dronesRef = useRef<Drone[]>([]);
  const laserRef = useRef<LaserBeamState>({ active: false, endAt: 0, tickCooldown: 0 });
  const slowMapRef = useRef<SlowMap>(new Map());
  const laserStackRef = useRef<Map<number, { stacks: number; lastTick: number }>>(new Map());
  const saturationStackRef = useRef<{ count: number; expireAt: number }>({
    count: 0,
    expireAt: 0,
  });

  const scoreRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const difficultyRef = useRef<number>(1);
  const totalTimeRef = useRef<number>(0);
  const stateRef = useRef<GameState>(state);
  const midBossNextAtRef = useRef<number>(45);

  const levelRef = useRef<number>(level);
  const paragonLevelRef = useRef<number>(0);
  const endlessRef = useRef<boolean>(false);
  const xpRef = useRef<number>(0);
  const skillPointsRef = useRef<number>(0);
  const paragonPointsRef = useRef<number>(0);
  const ranksRef = useRef<SkillRanks>(ranks);
  const treeRef = useRef<TreeRanks>(treeRanks);
  const paragonRef = useRef<ParagonRanks>(paragon);

  const [, setFrame] = useState(0);

  const onScoreChangeRef = useRef(onScoreChange);
  const onLivesChangeRef = useRef(onLivesChange);
  const onPowerupChangeRef = useRef(onPowerupChange);
  const onProgressionChangeRef = useRef(onProgressionChange);
  const onCooldownsChangeRef = useRef(onCooldownsChange);
  const onGameOverRef = useRef(onGameOver);
  const onToggleTreeRef = useRef(onToggleTree);
  useEffect(() => {
    onScoreChangeRef.current = onScoreChange;
    onLivesChangeRef.current = onLivesChange;
    onPowerupChangeRef.current = onPowerupChange;
    onProgressionChangeRef.current = onProgressionChange;
    onCooldownsChangeRef.current = onCooldownsChange;
    onGameOverRef.current = onGameOver;
    onToggleTreeRef.current = onToggleTree;
  }, [
    onScoreChange,
    onLivesChange,
    onPowerupChange,
    onProgressionChange,
    onCooldownsChange,
    onGameOver,
    onToggleTree,
  ]);

  useEffect(() => {
    ranksRef.current = ranks;
  }, [ranks]);
  useEffect(() => {
    treeRef.current = treeRanks;
  }, [treeRanks]);
  useEffect(() => {
    paragonRef.current = paragon;
  }, [paragon]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const emitProgression = useCallback(() => {
    const lvl = levelRef.current;
    const prog: Progression = {
      level: lvl,
      xp: xpRef.current,
      xpToNext: xpToNext(lvl),
      skillPoints: skillPointsRef.current,
      paragonPoints: paragonPointsRef.current,
      ranks: ranksRef.current,
      paragonLevel: paragonLevelRef.current,
      endless: endlessRef.current,
    };
    onProgressionChangeRef.current(prog);
  }, []);

  const getBaseCooldownFor = (id: SkillId): number => {
    switch (id) {
      case 'missileBarrage':
        return getMissileCooldown(treeRef.current, paragonRef.current);
      case 'laserBeam':
        return getLaserCooldown(treeRef.current, paragonRef.current);
      case 'droneSwarm':
        return getDroneCooldown(treeRef.current, paragonRef.current);
      default:
        return SKILL_DEFS[id].cooldown;
    }
  };

  const emitCooldowns = useCallback(() => {
    const player = playerRef.current;
    const now = totalTimeRef.current;
    const remaining: CooldownMap = {};
    const base: CooldownMap = {};
    for (const id of Object.keys(SKILL_DEFS) as SkillId[]) {
      const readyAt = player?.skillReadyAt[id] ?? 0;
      remaining[id] = readyAt > now ? readyAt - now : 0;
      base[id] = getBaseCooldownFor(id);
    }
    onCooldownsChangeRef.current(remaining, base);
  }, []);

  const emitPowerupSnapshot = useCallback(() => {
    const player = playerRef.current;
    const now = totalTimeRef.current;
    const snapshot: PowerupRemainingMap = {};
    if (player) {
      for (const [k, until] of Object.entries(player.powerups) as Array<[
        PowerupType,
        number | undefined,
      ]>) {
        if (until !== undefined && until > now) {
          snapshot[k] = until - now;
        }
      }
    }
    onPowerupChangeRef.current(snapshot);
  }, []);

  const resetBattlefield = useCallback((keepScore: boolean) => {
    playerRef.current = {
      id: nextId(),
      pos: { x: CANVAS_W / 2, y: CANVAS_H - 80 },
      vel: { x: 0, y: 0 },
      radius: 12,
      alive: true,
      lives: STARTING_LIVES,
      invincibleUntil: 2.0,
      shootCooldown: 0,
      powerups: {},
      rapidStacks: 0,
      shieldCharges: 0,
      skillReadyAt: {},
    };
    enemiesRef.current = [];
    bulletsRef.current = [];
    powerupsRef.current = [];
    particlesRef.current = [];
    dronesRef.current = [];
    laserRef.current = { active: false, endAt: 0, tickCooldown: 0 };
    slowMapRef.current.clear();
    laserStackRef.current.clear();
    saturationStackRef.current = { count: 0, expireAt: 0 };
    spawnTimerRef.current = 0;
    shakeRef.current = 0;
    if (!keepScore) {
      scoreRef.current = 0;
      difficultyRef.current = 1;
      totalTimeRef.current = 0;
      onScoreChangeRef.current(0);
    }
    onLivesChangeRef.current(STARTING_LIVES);
    onPowerupChangeRef.current({});
    emitCooldowns();
  }, [emitCooldowns]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (fullResetCounter === 0) return;
    xpRef.current = initialXp;
    skillPointsRef.current = initialSkillPoints;
    paragonPointsRef.current = initialParagonPoints;
    paragonLevelRef.current = 0;
    endlessRef.current = false;
    resetBattlefield(false);
    emitProgression();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullResetCounter]);

  useEffect(() => {
    if (reviveCounter === 0) return;
    xpRef.current = initialXp;
    skillPointsRef.current = initialSkillPoints;
    paragonPointsRef.current = initialParagonPoints;
    resetBattlefield(true);
    emitProgression();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviveCounter]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysRef.current[k] = true;
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
      }
      if (k === 'c') {
        onToggleTreeRef.current();
      }
      if (k === 'escape' && stateRef.current === 'paused') {
        onToggleTreeRef.current();
      }
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // --- helpers -------------------------------------------------------------

  const spawnExplosion = (x: number, y: number, color: string, count = 24) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      particlesRef.current.push({
        pos: { x, y },
        vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  };

  const makeEnemy = (
    kind: Enemy['kind'],
    x: number,
    y: number,
    opts: Partial<Enemy> = {},
  ): Enemy => {
    const defaults: Record<
      Enemy['kind'],
      { r: number; score: number; color: string; speed: number }
    > = {
      square: { r: 16, score: 100, color: COLORS.enemySquare, speed: ENEMY_BASE_SPEED },
      triangle: { r: 14, score: 150, color: COLORS.enemyTriangle, speed: ENEMY_BASE_SPEED * 1.2 },
      diamond: { r: 18, score: 300, color: COLORS.enemyDiamond, speed: ENEMY_BASE_SPEED * 0.9 },
      fighter: { r: 14, score: 120, color: COLORS.enemyFighter, speed: ENEMY_BASE_SPEED * 1.3 },
      gunship: { r: 22, score: 450, color: COLORS.enemyGunship, speed: ENEMY_BASE_SPEED * 0.7 },
      bomber: { r: 26, score: 600, color: COLORS.enemyBomber, speed: ENEMY_BASE_SPEED * 0.55 },
      turret: { r: 20, score: 350, color: COLORS.enemyTurret, speed: 0 },
      midBoss: { r: 48, score: 2500, color: COLORS.enemyMidBoss, speed: ENEMY_BASE_SPEED * 0.5 },
    };
    const d = defaults[kind];
    const hp = ENEMY_HP[kind];
    return {
      id: nextId(),
      pos: { x, y },
      vel: { x: 0, y: d.speed * (0.9 + Math.random() * 0.3) * difficultyRef.current },
      radius: d.r,
      alive: true,
      kind,
      hp,
      maxHp: hp,
      score: d.score,
      color: d.color,
      spawnTime: totalTimeRef.current,
      fireCooldown: 0,
      burstCount: 0,
      phaseTime: 0,
      baseX: x,
      amplitude: 0,
      frequency: 0,
      angle: 0,
      ...opts,
    };
  };

  const spawnEnemy = () => {
    const diff = difficultyRef.current;
    type Entry = { kind: Enemy['kind']; weight: number };
    const roster: Entry[] = [
      { kind: 'fighter', weight: 0.34 },
      { kind: 'square', weight: 0.2 },
      { kind: 'triangle', weight: 0.16 },
      { kind: 'diamond', weight: Math.min(0.16, 0.06 + diff * 0.02) },
      { kind: 'gunship', weight: Math.min(0.18, Math.max(0, (diff - 1.2) * 0.08)) },
      { kind: 'bomber', weight: Math.min(0.12, Math.max(0, (diff - 1.8) * 0.06)) },
      { kind: 'turret', weight: Math.min(0.1, Math.max(0, (diff - 1.5) * 0.05)) },
    ];
    const total = roster.reduce((a, b) => a + b.weight, 0);
    const r = Math.random() * total;
    let acc = 0;
    let chosen: Enemy['kind'] = 'fighter';
    for (const e of roster) {
      acc += e.weight;
      if (r < acc) {
        chosen = e.kind;
        break;
      }
    }

    if (chosen === 'fighter') {
      const count = 3 + Math.floor(Math.random() * 3);
      const spacing = 44;
      const baseX = 60 + Math.random() * (CANVAS_W - 120 - (count - 1) * spacing);
      const freq = 1.2 + Math.random() * 0.8;
      const amp = 40 + Math.random() * 40;
      for (let i = 0; i < count; i++) {
        const x = baseX + i * spacing;
        enemiesRef.current.push(
          makeEnemy('fighter', x, -20 - i * 30, {
            baseX: x,
            amplitude: amp,
            frequency: freq,
            spawnTime: totalTimeRef.current + i * 0.12,
          }),
        );
      }
      return;
    }

    if (chosen === 'turret') {
      const x = 80 + Math.random() * (CANVAS_W - 160);
      enemiesRef.current.push(makeEnemy('turret', x, -20, { haltY: 80 + Math.random() * 60 }));
      return;
    }

    if (chosen === 'gunship') {
      const x = 80 + Math.random() * (CANVAS_W - 160);
      enemiesRef.current.push(
        makeEnemy('gunship', x, -30, { haltY: 140 + Math.random() * 80 }),
      );
      return;
    }

    if (chosen === 'bomber') {
      const x = 80 + Math.random() * (CANVAS_W - 160);
      enemiesRef.current.push(makeEnemy('bomber', x, -40));
      return;
    }

    const x = 40 + Math.random() * (CANVAS_W - 80);
    enemiesRef.current.push(makeEnemy(chosen, x, -20));
  };

  const trySpawnMidBoss = () => {
    if (difficultyRef.current < 2.5) return;
    if (enemiesRef.current.some((e) => e.kind === 'midBoss')) return;
    if (totalTimeRef.current < (midBossNextAtRef.current ?? 45)) return;
    const x = CANVAS_W / 2;
    enemiesRef.current.push(
      makeEnemy('midBoss', x, -80, {
        baseX: x,
        amplitude: CANVAS_W * 0.35,
        frequency: 0.35,
        haltY: 110,
      }),
    );
    midBossNextAtRef.current = totalTimeRef.current + 75;
  };

  const spawnEnemyBullet = (
    x: number,
    y: number,
    vx: number,
    vy: number,
    kind: 'enemy' | 'enemyAimed' | 'enemyShell',
  ) => {
    const color =
      kind === 'enemyAimed'
        ? COLORS.enemyAimedBullet
        : kind === 'enemyShell'
          ? COLORS.enemyShell
          : COLORS.enemyBullet;
    bulletsRef.current.push({
      id: nextId(),
      pos: { x, y },
      vel: { x: vx, y: vy },
      radius: kind === 'enemyShell' ? 6 : 5,
      alive: true,
      fromPlayer: false,
      damage: 1,
      kind,
      color,
    });
  };

  const spawnPowerup = (x: number, y: number) => {
    type Entry = { kind: PowerupType; weight: number };
    const table: Entry[] = [
      { kind: 'rapid', weight: 0.28 },
      { kind: 'shield', weight: 0.26 },
      { kind: 'heal', weight: 0.13 },
      { kind: 'speed', weight: 0.17 },
      { kind: 'nocd', weight: 0.16 },
    ];
    const total = table.reduce((a, b) => a + b.weight, 0);
    const r = Math.random() * total;
    let acc = 0;
    let kind: PowerupType = 'rapid';
    for (const e of table) {
      acc += e.weight;
      if (r < acc) {
        kind = e.kind;
        break;
      }
    }
    powerupsRef.current.push({
      id: nextId(),
      pos: { x, y },
      vel: { x: 0, y: 80 },
      radius: 12,
      alive: true,
      kind,
      spawnTime: totalTimeRef.current,
    });
  };

  const hasBuff = (player: Player, kind: PowerupType): boolean => {
    const until = player.powerups[kind];
    return until !== undefined && until > totalTimeRef.current;
  };

  const applyPowerupToPlayer = (player: Player, kind: PowerupType) => {
    const now = totalTimeRef.current;
    if (kind === 'heal') {
      player.lives = Math.min(MAX_LIVES, player.lives + 1);
      onLivesChangeRef.current(player.lives);
      return;
    }
    if (kind === 'nocd') {
      const existing = player.powerups.nocd;
      const rem = existing !== undefined && existing > now ? existing - now : 0;
      const next = Math.min(NO_CD_MAX_DURATION, rem + NO_CD_DURATION);
      player.powerups.nocd = now + next;
      player.skillReadyAt = {};
      emitPowerupSnapshot();
      emitCooldowns();
      return;
    }
    const existingUntil = player.powerups[kind];
    const rem = existingUntil !== undefined && existingUntil > now ? existingUntil - now : 0;
    const added = rem === 0 ? POWERUP_DURATION : POWERUP_DURATION * POWERUP_EXTEND_RATIO;
    player.powerups[kind] = now + Math.min(POWERUP_MAX_DURATION, rem + added);
    if (kind === 'rapid') {
      player.rapidStacks = rem === 0 ? 1 : Math.min(RAPID_MAX_STACKS, player.rapidStacks + 1);
    } else if (kind === 'shield') {
      player.shieldCharges = SHIELD_MAX_CHARGES;
    }
    emitPowerupSnapshot();
  };

  const nearestEnemy = (x: number, y: number): Enemy | null => {
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of enemiesRef.current) {
      if (!e.alive) continue;
      const dx = e.pos.x - x;
      const dy = e.pos.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  };

  const fireBasic = (player: Player) => {
    if (player.shootCooldown > 0) return;
    const rapid = hasBuff(player, 'rapid');
    const tree = treeRef.current;
    const par = paragonRef.current;
    const lvl = levelRef.current;
    const form = getBasicAttackForm(lvl, tree);
    const dmg = BASE_BULLET_DAMAGE * getBasicDamageMultiplier(lvl, tree, par);

    let cooldown = rapid ? RAPID_COOLDOWN : SHOOT_COOLDOWN;
    if (rapid && player.rapidStacks > 1) {
      const extraStacks = Math.min(RAPID_MAX_STACKS, player.rapidStacks) - 1;
      cooldown = cooldown / Math.pow(1 + RAPID_STACK_SPEED_BONUS, extraStacks);
    }
    player.shootCooldown = Math.max(0.02, cooldown);
    const makeBullet = (vx: number, vy: number) => {
      bulletsRef.current.push({
        id: nextId(),
        pos: { x: player.pos.x, y: player.pos.y - 16 },
        vel: { x: vx, y: vy },
        radius: 4,
        alive: true,
        fromPlayer: true,
        damage: dmg,
        kind: 'bullet',
        color: COLORS.bullet,
      });
    };

    const speedMult = 1 + par.pa_velocity * 0.1;
    const base = BULLET_SPEED * speedMult;

    const count = form === 'spread' ? 3 : form === 'double' ? 2 : 1;

    if (count === 1) {
      makeBullet(0, -base);
    } else if (count === 2) {
      makeBullet(-90, -base);
      makeBullet(90, -base);
    } else {
      const spreadAng = getBasicSpreadAngle(tree);
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const ang = -Math.PI / 2 + (t - 0.5) * spreadAng;
        makeBullet(Math.cos(ang) * base, Math.sin(ang) * base);
      }
    }
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        pos: { x: player.pos.x, y: player.pos.y - 16 },
        vel: { x: (Math.random() - 0.5) * 60, y: -Math.random() * 120 },
        life: 0.2,
        maxLife: 0.2,
        color: COLORS.bullet,
        size: 2,
      });
    }
  };

  const activateSkill = (player: Player, id: SkillId) => {
    const tree = treeRef.current;
    const now = totalTimeRef.current;

    const t0Map: Record<SkillId, keyof TreeRanks | null> = {
      basic: null,
      missileBarrage: 'missileBarrage',
      laserBeam: 'laserBeam',
      droneSwarm: 'droneSwarm',
    };
    const t0 = t0Map[id];
    if (t0 && tree[t0] <= 0) return;

    const readyAt = player.skillReadyAt[id] ?? 0;
    const noCdActive = hasBuff(player, 'nocd');
    if (!noCdActive && readyAt > now) return;

    switch (id) {
      case 'missileBarrage': {
        let count = getMissileCount(tree);
        if (tree.m_key_saturation > 0 && saturationStackRef.current.expireAt > now) {
          count += saturationStackRef.current.count;
          saturationStackRef.current = { count: 0, expireAt: 0 };
        }
        const color = SKILL_DEFS.missileBarrage.color;
        const spreadAngle = Math.PI / 3;
        const dmg = MISSILE_DAMAGE * getMissileDamageMult(tree);
        const homing = getMissileHomingStrength(tree);
        for (let i = 0; i < count; i++) {
          const t = count === 1 ? 0.5 : i / (count - 1);
          const ang = -Math.PI / 2 + (t - 0.5) * spreadAngle;
          const speed = BULLET_SPEED * 0.8;
          const b: Bullet = {
            id: nextId(),
            pos: { x: player.pos.x, y: player.pos.y - 16 },
            vel: { x: Math.cos(ang) * speed, y: Math.sin(ang) * speed },
            radius: 5,
            alive: true,
            fromPlayer: true,
            damage: dmg,
            kind: 'missile',
            color,
          };
          (b as Bullet & { __h?: number; __split?: number }).__h = homing;
          (b as Bullet & { __h?: number; __split?: number }).__split = getMissileSplitCount(tree);
          bulletsRef.current.push(b);
        }
        spawnExplosion(player.pos.x, player.pos.y - 14, color, 10);
        break;
      }
      case 'laserBeam': {
        const dur = getLaserDuration(tree);
        laserRef.current.active = true;
        laserRef.current.endAt = now + dur;
        laserRef.current.tickCooldown = 0;
        laserStackRef.current.clear();
        break;
      }
      case 'droneSwarm': {
        const count = getDroneCount(tree);
        const dur = getDroneDuration(tree);
        const expireAt = dur === Infinity ? Infinity : now + dur;
        dronesRef.current = [];
        for (let i = 0; i < count; i++) {
          dronesRef.current.push({
            id: nextId(),
            pos: { x: player.pos.x, y: player.pos.y },
            vel: { x: 0, y: 0 },
            radius: 6,
            alive: true,
            angle: (i / count) * Math.PI * 2,
            expireAt,
            shootCooldown: 0,
          });
        }
        break;
      }
      default:
        break;
    }
    if (!noCdActive) {
      player.skillReadyAt[id] = now + getBaseCooldownFor(id);
    }
    emitCooldowns();
  };

  const updateEnemy = (
    e: Enemy,
    dt: number,
    timeScale: number,
    now: number,
    player: Player | null,
  ) => {
    const slowUntil = slowMapRef.current.get(e.id);
    let slowMult = 1;
    if (slowUntil !== undefined) {
      if (slowUntil > now) {
        slowMult = 0.5;
      } else {
        slowMapRef.current.delete(e.id);
      }
    }
    const scale = timeScale * slowMult;
    e.phaseTime += dt * scale;
    e.fireCooldown -= dt * scale;

    const aimAt = (targetX: number, targetY: number, speed: number) => {
      const dx = targetX - e.pos.x;
      const dy = targetY - e.pos.y;
      const len = Math.hypot(dx, dy) || 1;
      return { vx: (dx / len) * speed, vy: (dy / len) * speed };
    };

    switch (e.kind) {
      case 'fighter': {
        const t = now - e.spawnTime;
        e.pos.x = e.baseX + Math.sin(t * e.frequency * Math.PI) * e.amplitude;
        e.pos.y += e.vel.y * dt * scale;
        if (e.pos.y > 40 && e.fireCooldown <= 0 && Math.random() < 0.25) {
          spawnEnemyBullet(e.pos.x, e.pos.y + 10, 0, ENEMY_BULLET_SPEED, 'enemy');
          e.fireCooldown = 2.2 + Math.random() * 1.5;
        }
        break;
      }
      case 'gunship': {
        const halt = e.haltY ?? 140;
        if (e.pos.y < halt && e.burstCount < 2) {
          e.pos.y += e.vel.y * dt * scale;
          e.pos.x += Math.sin(e.phaseTime * 1.2) * 18 * dt * scale;
        } else if (e.burstCount < 2) {
          if (e.fireCooldown <= 0 && player) {
            const { vx, vy } = aimAt(player.pos.x, player.pos.y, ENEMY_AIMED_SPEED);
            const angle = Math.atan2(vy, vx);
            for (const off of [-0.12, 0, 0.12]) {
              const a = angle + off;
              spawnEnemyBullet(
                e.pos.x,
                e.pos.y + 12,
                Math.cos(a) * ENEMY_AIMED_SPEED,
                Math.sin(a) * ENEMY_AIMED_SPEED,
                'enemyAimed',
              );
            }
            e.burstCount += 1;
            e.fireCooldown = 0.9;
          }
        } else {
          e.pos.y += e.vel.y * 1.4 * dt * scale;
        }
        break;
      }
      case 'bomber': {
        const halt = 180;
        if (e.pos.y < halt) {
          e.pos.y += e.vel.y * dt * scale;
        } else {
          e.pos.x += Math.sin(e.phaseTime * 0.8) * 30 * dt * scale;
          e.pos.y += 10 * dt * scale;
        }
        if (e.pos.y > 60 && e.fireCooldown <= 0) {
          const spread = Math.PI / 3;
          const count = 5;
          for (let i = 0; i < count; i++) {
            const t = i / (count - 1);
            const a = Math.PI / 2 + (t - 0.5) * spread;
            spawnEnemyBullet(
              e.pos.x,
              e.pos.y + 14,
              Math.cos(a) * ENEMY_SHELL_SPEED,
              Math.sin(a) * ENEMY_SHELL_SPEED,
              'enemyShell',
            );
          }
          e.fireCooldown = 2.4;
        }
        break;
      }
      case 'turret': {
        const halt = e.haltY ?? 90;
        if (e.pos.y < halt) {
          e.pos.y += ENEMY_BASE_SPEED * 0.8 * dt * scale;
        } else {
          e.angle += dt * scale * 1.2;
          if (e.fireCooldown <= 0) {
            const count = 8;
            const base = e.angle;
            for (let i = 0; i < count; i++) {
              const a = base + (i / count) * Math.PI * 2;
              spawnEnemyBullet(
                e.pos.x,
                e.pos.y,
                Math.cos(a) * ENEMY_BULLET_SPEED,
                Math.sin(a) * ENEMY_BULLET_SPEED,
                'enemy',
              );
            }
            e.fireCooldown = 2.0;
          }
        }
        break;
      }
      case 'midBoss': {
        const halt = e.haltY ?? 110;
        if (e.pos.y < halt) {
          e.pos.y += ENEMY_BASE_SPEED * 0.6 * dt * scale;
        } else {
          e.pos.x = e.baseX + Math.sin(e.phaseTime * e.frequency) * e.amplitude;
          e.pos.x = Math.max(70, Math.min(CANVAS_W - 70, e.pos.x));
          e.angle += dt * scale * 0.8;
          if (e.fireCooldown <= 0) {
            if (e.burstCount % 2 === 0) {
              const count = 14;
              for (let i = 0; i < count; i++) {
                const a = e.angle + (i / count) * Math.PI * 2;
                spawnEnemyBullet(
                  e.pos.x,
                  e.pos.y,
                  Math.cos(a) * ENEMY_BULLET_SPEED * 0.9,
                  Math.sin(a) * ENEMY_BULLET_SPEED * 0.9,
                  'enemy',
                );
              }
            } else if (player) {
              const { vx, vy } = aimAt(player.pos.x, player.pos.y, ENEMY_AIMED_SPEED);
              const baseAng = Math.atan2(vy, vx);
              for (const off of [-0.3, -0.15, 0, 0.15, 0.3]) {
                const a = baseAng + off;
                spawnEnemyBullet(
                  e.pos.x,
                  e.pos.y + 20,
                  Math.cos(a) * ENEMY_AIMED_SPEED,
                  Math.sin(a) * ENEMY_AIMED_SPEED,
                  'enemyAimed',
                );
              }
            }
            e.burstCount += 1;
            e.fireCooldown = 1.3;
          }
        }
        break;
      }
      case 'square':
      case 'triangle':
      case 'diamond':
      default: {
        e.pos.x += e.vel.x * dt * scale;
        e.pos.y += e.vel.y * dt * scale;
        if (e.pos.x < 20 || e.pos.x > CANVAS_W - 20) e.vel.x *= -1;
        break;
      }
    }
  };

  const awardXp = (amount: number) => {
    // Endless mode: no more progression.
    if (endlessRef.current) {
      xpRef.current = 0;
      emitProgression();
      return;
    }

    xpRef.current += amount;

    // Phase 1: regular character levels (1 → PARAGON_UNLOCK_LEVEL). Each level-up
    // grants exactly 1 skill point. Beyond PARAGON_UNLOCK_LEVEL, regular levels stop.
    while (
      levelRef.current < PARAGON_UNLOCK_LEVEL &&
      xpRef.current >= xpToNext(levelRef.current)
    ) {
      xpRef.current -= xpToNext(levelRef.current);
      levelRef.current += 1;
      skillPointsRef.current += skillPointsOnLevelUp(levelRef.current);
      const p = playerRef.current;
      if (p) spawnExplosion(p.pos.x, p.pos.y, '#FFD700', 40);
    }

    // Phase 2: Paragon levels (after PARAGON_UNLOCK_LEVEL), 1 paragon point each, capped at PARAGON_MAX.
    if (levelRef.current >= PARAGON_UNLOCK_LEVEL && paragonLevelRef.current < PARAGON_MAX) {
      while (
        paragonLevelRef.current < PARAGON_MAX &&
        xpRef.current >= xpToNext(PARAGON_UNLOCK_LEVEL + paragonLevelRef.current)
      ) {
        xpRef.current -= xpToNext(PARAGON_UNLOCK_LEVEL + paragonLevelRef.current);
        paragonLevelRef.current += 1;
        paragonPointsRef.current += 1;
        const p = playerRef.current;
        if (p) spawnExplosion(p.pos.x, p.pos.y, '#B266FF', 50);
      }
    }

    // Phase 3: both caps reached → enter endless mode.
    if (levelRef.current >= PARAGON_UNLOCK_LEVEL && paragonLevelRef.current >= PARAGON_MAX) {
      endlessRef.current = true;
      xpRef.current = 0;
    }

    emitProgression();
  };

  const spawnMissileSplit = (b: Bullet, splitCount: number) => {
    if (splitCount <= 0) return;
    const color = b.color ?? SKILL_DEFS.missileBarrage.color;
    for (let i = 0; i < splitCount; i++) {
      const a = (i / splitCount) * Math.PI * 2;
      bulletsRef.current.push({
        id: nextId(),
        pos: { x: b.pos.x, y: b.pos.y },
        vel: { x: Math.cos(a) * BULLET_SPEED * 0.6, y: Math.sin(a) * BULLET_SPEED * 0.6 },
        radius: 3,
        alive: true,
        fromPlayer: true,
        damage: b.damage * 0.4,
        kind: 'bullet',
        color,
      });
    }
  };

  // --- main game loop ------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (t: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = t;
      const dt = Math.min(0.05, (t - lastTimeRef.current) / 1000);
      lastTimeRef.current = t;

      if (stateRef.current === 'playing') {
        update(dt);
      }
      draw(ctx);
      setFrame((f) => (f + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };

    const update = (dt: number) => {
      totalTimeRef.current += dt;
      const player = playerRef.current;
      if (!player) return;

      const now = totalTimeRef.current;
      const tree = treeRef.current;
      const par = paragonRef.current;

      difficultyRef.current = 1 + totalTimeRef.current / 30;

      const keys = keysRef.current;
      let vx = 0;
      let vy = 0;
      if (keys['arrowleft']) vx -= 1;
      if (keys['arrowright']) vx += 1;
      if (keys['arrowup']) vy -= 1;
      if (keys['arrowdown']) vy += 1;
      const mag = Math.hypot(vx, vy) || 1;
      const speedMult = (hasBuff(player, 'speed') ? SPEED_POWERUP_MULT : 1) * getMoveSpeedMult(par);
      player.pos.x += (vx / mag) * PLAYER_SPEED * speedMult * dt;
      player.pos.y += (vy / mag) * PLAYER_SPEED * speedMult * dt;
      player.pos.x = Math.max(16, Math.min(CANVAS_W - 16, player.pos.x));
      player.pos.y = Math.max(16, Math.min(CANVAS_H - 16, player.pos.y));

      player.shootCooldown -= dt;
      if (keys[' '] || keys['z'] || keys['j']) {
        fireBasic(player);
      }

      const slotKeys: Record<string, SkillId> = {
        '1': 'missileBarrage',
        '2': 'laserBeam',
        '3': 'droneSwarm',
      };
      for (const [k, id] of Object.entries(slotKeys)) {
        if (keys[k]) activateSkill(player, id);
      }

      const enemyTimeScale = 1;

      for (const [k, until] of Object.entries(player.powerups) as Array<[
        PowerupType,
        number | undefined,
      ]>) {
        if (until === undefined || until <= now) {
          delete player.powerups[k];
          if (k === 'rapid') player.rapidStacks = 0;
          if (k === 'shield') player.shieldCharges = 0;
        }
      }
      emitPowerupSnapshot();

      spawnTimerRef.current -= dt;
      if (spawnTimerRef.current <= 0) {
        spawnEnemy();
        spawnTimerRef.current = Math.max(0.25, 1.2 / difficultyRef.current);
      }

      for (const b of bulletsRef.current) {
        const bh = (b as Bullet & { __h?: number }).__h;
        if (bh && bh > 0 && b.kind === 'missile') {
          const target = nearestEnemy(b.pos.x, b.pos.y);
          if (target) {
            const dx = target.pos.x - b.pos.x;
            const dy = target.pos.y - b.pos.y;
            const tAng = Math.atan2(dy, dx);
            const curAng = Math.atan2(b.vel.y, b.vel.x);
            const sp = Math.hypot(b.vel.x, b.vel.y);
            const blend = 4 * bh * dt;
            let diff = tAng - curAng;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const newAng = curAng + diff * Math.min(1, blend);
            b.vel.x = Math.cos(newAng) * sp;
            b.vel.y = Math.sin(newAng) * sp;
          }
        }
        b.pos.x += b.vel.x * dt;
        b.pos.y += b.vel.y * dt;
        if (
          b.pos.y < -20 ||
          b.pos.y > CANVAS_H + 20 ||
          b.pos.x < -20 ||
          b.pos.x > CANVAS_W + 20
        ) {
          b.alive = false;
        }
      }

      for (const e of enemiesRef.current) {
        updateEnemy(e, dt, enemyTimeScale, now, player);
        if (e.pos.y > CANVAS_H + 60) e.alive = false;
      }

      trySpawnMidBoss();

      for (const p of powerupsRef.current) {
        p.pos.y += p.vel.y * dt;
        if (p.pos.y > CANVAS_H + 20) p.alive = false;
      }

      const droneFireRate = getDroneFireRate(tree);
      const droneDmgMult = getDroneDamageMult(tree);
      for (const d of dronesRef.current) {
        d.angle += dt * 2.5;
        d.pos.x = player.pos.x + Math.cos(d.angle) * 42;
        d.pos.y = player.pos.y + Math.sin(d.angle) * 42;
        d.shootCooldown -= dt;
        if (d.shootCooldown <= 0) {
          d.shootCooldown = 1 / droneFireRate;
          bulletsRef.current.push({
            id: nextId(),
            pos: { x: d.pos.x, y: d.pos.y - 6 },
            vel: { x: 0, y: -BULLET_SPEED * 0.9 },
            radius: 3,
            alive: true,
            fromPlayer: true,
            damage: BASE_BULLET_DAMAGE * droneDmgMult,
            kind: 'bullet',
            color: SKILL_DEFS.droneSwarm.color,
          });
        }
        if (d.expireAt !== Infinity && d.expireAt <= now) d.alive = false;
      }

      for (const p of particlesRef.current) {
        p.pos.x += p.vel.x * dt;
        p.pos.y += p.vel.y * dt;
        p.vel.x *= 0.96;
        p.vel.y *= 0.96;
        p.life -= dt;
      }

      if (laserRef.current.active) {
        if (now >= laserRef.current.endAt) {
          laserRef.current.active = false;
          laserStackRef.current.clear();
        } else {
          const beamX = player.pos.x;
          const beamHalfWidth = getLaserWidth(tree) / 2;
          for (const b of bulletsRef.current) {
            if (!b.alive || b.fromPlayer) continue;
            if (b.pos.y > player.pos.y) continue;
            if (Math.abs(b.pos.x - beamX) < b.radius + beamHalfWidth) {
              b.alive = false;
              spawnExplosion(b.pos.x, b.pos.y, b.color ?? COLORS.enemyBullet, 4);
            }
          }
          laserRef.current.tickCooldown -= dt;
          if (laserRef.current.tickCooldown <= 0) {
            laserRef.current.tickCooldown = 0.1;
            const basedps = getLaserDamagePerSec(tree, par);
            const searingDps = getLaserSearingDps(tree);
            const prismCount = getLaserPrismCount(tree);
            const prismAngles = Array.from({ length: prismCount }, (_, i) => ((i + 1) * 15 * Math.PI) / 180);

            const hitEnemy = (e: Enemy, dmg: number) => {
              e.hp -= dmg;
              if (e.hp <= 0) {
                e.alive = false;
                scoreRef.current += e.score;
                awardXp(enemyXp(e.kind));
                spawnExplosion(e.pos.x, e.pos.y, e.color, 22);
                laserStackRef.current.delete(e.id);
              }
            };

            for (const e of enemiesRef.current) {
              if (!e.alive) continue;
              if (e.pos.y > player.pos.y) continue;
              const vertical = Math.abs(e.pos.x - beamX) < e.radius + beamHalfWidth;
              let stackMult = 1;
              if (tree.l_key_annihilation > 0 && vertical) {
                const entry = laserStackRef.current.get(e.id) ?? { stacks: 0, lastTick: now };
                if (now - entry.lastTick >= 0.5) {
                  entry.stacks = Math.min(8, entry.stacks + 1);
                  entry.lastTick = now;
                }
                laserStackRef.current.set(e.id, entry);
                stackMult = 1 + entry.stacks * 0.25;
              }
              if (vertical) {
                hitEnemy(e, (basedps + searingDps) * 0.1 * stackMult);
                continue;
              }
              for (const pa of prismAngles) {
                for (const sign of [-1, 1]) {
                  const ang = -Math.PI / 2 + sign * pa;
                  const dirX = Math.cos(ang);
                  const dirY = Math.sin(ang);
                  const ox = e.pos.x - beamX;
                  const oy = e.pos.y - player.pos.y;
                  const proj = ox * dirX + oy * dirY;
                  if (proj < 0 || proj > CANVAS_H) continue;
                  const perp = Math.abs(ox * -dirY + oy * dirX);
                  if (perp < e.radius + beamHalfWidth * 0.7) {
                    hitEnemy(e, (basedps + searingDps) * 0.1 * 0.7);
                    break;
                  }
                }
              }
            }
          }
        }
      }

      for (const b of bulletsRef.current) {
        if (!b.alive || !b.fromPlayer) continue;
        for (const e of enemiesRef.current) {
          if (!e.alive) continue;
          const dx = b.pos.x - e.pos.x;
          const dy = b.pos.y - e.pos.y;
          if (dx * dx + dy * dy < (b.radius + e.radius) * (b.radius + e.radius)) {
            b.alive = false;
            e.hp -= b.damage;
            if (e.hp <= 0) {
              e.alive = false;
              scoreRef.current += e.score;
              awardXp(enemyXp(e.kind));
              spawnExplosion(e.pos.x, e.pos.y, e.color, 28);

              if (b.kind === 'missile') {
                const bAny = b as Bullet & { __split?: number };
                if (bAny.__split && bAny.__split > 0) {
                  spawnMissileSplit(b, bAny.__split);
                }
                if (tree.m_key_saturation > 0) {
                  const s = saturationStackRef.current;
                  if (s.expireAt <= now) s.count = 0;
                  s.count = Math.min(6, s.count + 1);
                  s.expireAt = now + 5;
                }
              }

              const dropRate = 0.15 * getPowerupDropMult(par);
              if (Math.random() < dropRate) spawnPowerup(e.pos.x, e.pos.y);
              if (par.pa_chainboom > 0 && Math.random() < 0.15 * par.pa_chainboom) {
                spawnExplosion(e.pos.x, e.pos.y, '#FFD700', 14);
                for (const other of enemiesRef.current) {
                  if (!other.alive || other === e) continue;
                  const ex = other.pos.x - e.pos.x;
                  const ey = other.pos.y - e.pos.y;
                  if (ex * ex + ey * ey < 70 * 70) {
                    other.hp -= 2;
                    if (other.hp <= 0) {
                      other.alive = false;
                      scoreRef.current += other.score;
                      awardXp(enemyXp(other.kind));
                      spawnExplosion(other.pos.x, other.pos.y, other.color, 16);
                    }
                  }
                }
              }
            } else {
              if (b.kind === 'missile') {
                const bAny = b as Bullet & { __split?: number };
                if (bAny.__split && bAny.__split > 0) spawnMissileSplit(b, bAny.__split);
              }
              spawnExplosion(b.pos.x, b.pos.y, e.color, 8);
            }
            break;
          }
        }
      }

      onScoreChangeRef.current(scoreRef.current);

      const damagePlayer = (fx: number, fy: number) => {
        if (hasBuff(player, 'shield') && player.shieldCharges > 0) {
          player.shieldCharges -= 1;
          player.invincibleUntil = now + 0.6;
          spawnExplosion(fx, fy, COLORS.powerupShield, 30);
          if (player.shieldCharges <= 0) delete player.powerups.shield;
          emitPowerupSnapshot();
          return;
        }
        const hpPct = player.lives / MAX_LIVES;
        if (hpPct <= 0.25 && par.pd_repair > 0) {
          const mitigate = [0, 0.3, 0.45, 0.6][Math.min(3, par.pd_repair)];
          if (Math.random() < mitigate) {
            player.invincibleUntil = now + 0.6;
            spawnExplosion(fx, fy, '#00FF88', 18);
            return;
          }
        }
        player.lives -= 1;
        onLivesChangeRef.current(player.lives);
        player.invincibleUntil = now + INVINCIBLE_DURATION;
        spawnExplosion(player.pos.x, player.pos.y, COLORS.player, 30);
        shakeRef.current = 18;
        if (player.lives <= 0) {
          const luckyChance = 0.1 * par.pd_lucky;
          if (luckyChance > 0 && Math.random() < luckyChance) {
            player.lives = 1;
            onLivesChangeRef.current(player.lives);
            player.invincibleUntil = now + 2;
            return;
          }
          onGameOverRef.current(scoreRef.current);
          stateRef.current = 'gameover';
        }
      };

      if (player.invincibleUntil < now) {
        for (const e of enemiesRef.current) {
          if (!e.alive) continue;
          const dx = player.pos.x - e.pos.x;
          const dy = player.pos.y - e.pos.y;
          const hitDist = player.radius + e.radius;
          if (dx * dx + dy * dy < hitDist * hitDist) {
            if (e.kind !== 'midBoss') {
              e.alive = false;
              spawnExplosion(e.pos.x, e.pos.y, e.color, 20);
            }
            damagePlayer(player.pos.x, player.pos.y);
            break;
          }
        }
      }

      if (player.invincibleUntil < now) {
        for (const b of bulletsRef.current) {
          if (!b.alive || b.fromPlayer) continue;
          const dx = player.pos.x - b.pos.x;
          const dy = player.pos.y - b.pos.y;
          const hitDist = player.radius + b.radius;
          if (dx * dx + dy * dy < hitDist * hitDist) {
            b.alive = false;
            damagePlayer(player.pos.x, player.pos.y);
            break;
          }
        }
      }

      for (const p of powerupsRef.current) {
        if (!p.alive) continue;
        const dx = player.pos.x - p.pos.x;
        const dy = player.pos.y - p.pos.y;
        if (dx * dx + dy * dy < (player.radius + p.radius) * (player.radius + p.radius)) {
          p.alive = false;
          applyPowerupToPlayer(player, p.kind);
          spawnExplosion(p.pos.x, p.pos.y, getPowerupColor(p.kind), 16);
        }
      }

      bulletsRef.current = bulletsRef.current.filter((b) => b.alive);
      enemiesRef.current = enemiesRef.current.filter((e) => e.alive);
      powerupsRef.current = powerupsRef.current.filter((p) => p.alive);
      dronesRef.current = dronesRef.current.filter((d) => d.alive);
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      shakeRef.current = Math.max(0, shakeRef.current - dt * 40);

      emitCooldowns();
    };

    const draw = (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      const shake = shakeRef.current;
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake;
      ctx.translate(sx, sy);

      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      const offset = (totalTimeRef.current * 20) % gridSize;
      for (let x = -gridSize + offset; x < CANVAS_W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_H);
        ctx.stroke();
      }
      for (let y = -gridSize + offset; y < CANVAS_H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }

      const player = playerRef.current;
      if (player && hasBuff(player, 'nocd')) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }

      for (const p of particlesRef.current) {
        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      for (const b of bulletsRef.current) {
        const color = b.color ?? COLORS.bullet;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        if (b.kind === 'missile') {
          const ang = Math.atan2(b.vel.y, b.vel.x);
          ctx.save();
          ctx.translate(b.pos.x, b.pos.y);
          ctx.rotate(ang + Math.PI / 2);
          ctx.fillRect(-2.5, -10, 5, 14);
          ctx.restore();
        } else if (b.kind === 'enemyShell') {
          ctx.beginPath();
          ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(b.pos.x, b.pos.y, b.radius + 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (b.kind === 'enemyAimed' || b.kind === 'enemy') {
          const ang = Math.atan2(b.vel.y, b.vel.x);
          ctx.save();
          ctx.translate(b.pos.x, b.pos.y);
          ctx.rotate(ang);
          ctx.beginPath();
          ctx.moveTo(6, 0);
          ctx.lineTo(-4, 3);
          ctx.lineTo(-4, -3);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.fillRect(b.pos.x - 2, b.pos.y - 8, 4, 12);
        }
      }
      ctx.shadowBlur = 0;

      for (const e of enemiesRef.current) drawEnemy(ctx, e);
      for (const p of powerupsRef.current) drawPowerup(ctx, p, totalTimeRef.current);

      for (const d of dronesRef.current) {
        ctx.strokeStyle = SKILL_DEFS.droneSwarm.color;
        ctx.fillStyle = SKILL_DEFS.droneSwarm.color;
        ctx.shadowColor = SKILL_DEFS.droneSwarm.color;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(d.pos.x, d.pos.y, d.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.shadowBlur = 0;

      if (player && stateRef.current !== 'gameover') {
        const blinking = player.invincibleUntil > totalTimeRef.current;
        const show = !blinking || Math.floor(totalTimeRef.current * 20) % 2 === 0;
        if (show) {
          const px = player.pos.x + (Math.random() - 0.5) * 1.5;
          const py = player.pos.y + (Math.random() - 0.5) * 1.5;
          if (hasBuff(player, 'shield')) {
            ctx.strokeStyle = COLORS.powerupShield;
            ctx.shadowColor = COLORS.powerupShield;
            ctx.shadowBlur = 20;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, 24, 0, Math.PI * 2);
            ctx.stroke();
          }
          if (hasBuff(player, 'nocd')) {
            ctx.strokeStyle = COLORS.powerupNoCd;
            ctx.shadowColor = COLORS.powerupNoCd;
            ctx.shadowBlur = 25;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, 28 + Math.sin(totalTimeRef.current * 8) * 2, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.strokeStyle = COLORS.player;
          ctx.shadowColor = COLORS.player;
          ctx.shadowBlur = 15;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(px, py - 14);
          ctx.lineTo(px + 12, py + 10);
          ctx.lineTo(px, py + 4);
          ctx.lineTo(px - 12, py + 10);
          ctx.closePath();
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 170, 0, 0.8)';
          ctx.shadowColor = '#FFAA00';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py + 8, 3 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();

          if (laserRef.current.active) {
            const flicker = 0.7 + Math.random() * 0.3;
            const tree = treeRef.current;
            const beamWidth = getLaserWidth(tree) + Math.sin(totalTimeRef.current * 30) * 2;
            const prism = getLaserPrismCount(tree);
            ctx.save();
            ctx.globalAlpha = flicker;
            const grd = ctx.createLinearGradient(px, 0, px, py);
            grd.addColorStop(0, 'rgba(255,255,255,0.9)');
            grd.addColorStop(1, SKILL_DEFS.laserBeam.color);
            ctx.fillStyle = grd;
            ctx.shadowColor = SKILL_DEFS.laserBeam.color;
            ctx.shadowBlur = 25;
            ctx.fillRect(px - beamWidth / 2, 0, beamWidth, py - 14);
            for (let i = 1; i <= prism; i++) {
              const angle = (i * 15 * Math.PI) / 180;
              for (const sign of [-1, 1]) {
                ctx.save();
                ctx.translate(px, py - 14);
                ctx.rotate(sign * angle);
                ctx.fillRect(-(beamWidth * 0.6) / 2, -CANVAS_H, beamWidth * 0.6, CANVAS_H);
                ctx.restore();
              }
            }
            ctx.restore();
          }
        }
      }
      ctx.shadowBlur = 0;

      ctx.restore();
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      className="block w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
  ctx.strokeStyle = e.color;
  ctx.fillStyle = e.color;
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 15;
  ctx.lineWidth = 2.5;
  const jitter = e.kind === 'midBoss' ? 0.6 : 1.2;
  const x = e.pos.x + (Math.random() - 0.5) * jitter;
  const y = e.pos.y + (Math.random() - 0.5) * jitter;
  const r = e.radius;

  switch (e.kind) {
    case 'square':
      ctx.beginPath();
      ctx.rect(x - r, y - r, r * 2, r * 2);
      ctx.stroke();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y + r);
      ctx.lineTo(x - r, y + r);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      ctx.stroke();
      break;
    case 'fighter':
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.lineTo(x + r, y - r * 0.4);
      ctx.lineTo(x + r * 0.4, y - r * 0.2);
      ctx.lineTo(x, y - r * 0.6);
      ctx.lineTo(x - r * 0.4, y - r * 0.2);
      ctx.lineTo(x - r, y - r * 0.4);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
      break;
    case 'gunship':
      ctx.beginPath();
      ctx.moveTo(x - r, y - r * 0.4);
      ctx.lineTo(x - r * 0.3, y - r * 0.8);
      ctx.lineTo(x + r * 0.3, y - r * 0.8);
      ctx.lineTo(x + r, y - r * 0.4);
      ctx.lineTo(x + r * 0.7, y + r * 0.6);
      ctx.lineTo(x - r * 0.7, y + r * 0.6);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillRect(x - r * 0.75, y + r * 0.5, 4, 6);
      ctx.fillRect(x + r * 0.75 - 4, y + r * 0.5, 4, 6);
      ctx.beginPath();
      ctx.arc(x, y - r * 0.2, r * 0.25, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'bomber':
      ctx.beginPath();
      ctx.moveTo(x - r * 1.1, y);
      ctx.lineTo(x - r * 0.4, y - r * 0.7);
      ctx.lineTo(x + r * 0.4, y - r * 0.7);
      ctx.lineTo(x + r * 1.1, y);
      ctx.lineTo(x + r * 0.6, y + r * 0.7);
      ctx.lineTo(x - r * 0.6, y + r * 0.7);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, y + r * 0.2, r * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'turret':
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(e.angle);
      ctx.fillRect(-3, -r - 4, 6, r + 4);
      ctx.fillRect(-3, -2, 6, r + 6);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'midBoss':
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - r, y - r * 0.3);
      ctx.lineTo(x - r * 0.5, y - r * 0.8);
      ctx.lineTo(x + r * 0.5, y - r * 0.8);
      ctx.lineTo(x + r, y - r * 0.3);
      ctx.lineTo(x + r * 0.8, y + r * 0.7);
      ctx.lineTo(x - r * 0.8, y + r * 0.7);
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.ellipse(x, y - r * 0.2, r * 0.4, r * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(x - r * 0.9, y + r * 0.5, 5, 10);
      ctx.fillRect(x + r * 0.9 - 5, y + r * 0.5, 5, 10);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(e.angle);
      ctx.strokeStyle = '#FFFFFF';
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25);
        ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
        ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      break;
  }
  ctx.shadowBlur = 0;

  const showBar = (e.hp < e.maxHp && e.hp > 0) || e.kind === 'midBoss';
  if (showBar) {
    const barW = e.kind === 'midBoss' ? r * 2.5 : r * 2;
    const h = e.kind === 'midBoss' ? 4 : 2;
    const offY = e.kind === 'midBoss' ? r + 12 : r + 6;
    const pct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(e.pos.x - barW / 2, e.pos.y - offY, barW, h);
    ctx.fillStyle = e.color;
    ctx.fillRect(e.pos.x - barW / 2, e.pos.y - offY, barW * pct, h);
  }
}

function drawPowerup(ctx: CanvasRenderingContext2D, p: Powerup, t: number) {
  const color = getPowerupColor(p.kind);
  ctx.save();
  ctx.translate(p.pos.x, p.pos.y);
  ctx.rotate(t * 2);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.lineWidth = 2;
  const r = p.radius;
  ctx.strokeRect(-r, -r, r * 2, r * 2);
  ctx.globalAlpha = 0.3;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  const letter =
    p.kind === 'rapid'
      ? 'R'
      : p.kind === 'shield'
        ? 'S'
        : p.kind === 'speed'
          ? '»'
          : p.kind === 'nocd'
            ? '∞'
            : '+';
  ctx.fillText(letter, p.pos.x, p.pos.y);
  ctx.restore();
}

function getPowerupColor(kind: PowerupType): string {
  switch (kind) {
    case 'rapid':
      return COLORS.powerupRapid;
    case 'shield':
      return COLORS.powerupShield;
    case 'heal':
      return COLORS.powerupHeal;
    case 'speed':
      return COLORS.powerupSpeed;
    case 'nocd':
      return COLORS.powerupNoCd;
  }
}

export const _createEmptyRanks = createEmptyRanks;
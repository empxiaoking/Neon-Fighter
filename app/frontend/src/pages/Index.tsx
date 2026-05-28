import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GameCanvas from '@/game/GameCanvas';
import LeftPanel from '@/game/LeftPanel';
import RightPanel from '@/game/RightPanel';
import SkillTree from '@/game/SkillTree';
import StartScreen from '@/game/StartScreen';
import GameOverScreen from '@/game/GameOverScreen';
import { CANVAS_W, CANVAS_H } from '@/game/constants';
import type { GameState, PowerupType, Progression } from '@/game/types';
import {
  TREE_NODES,
  KEY_PASSIVE_IDS,
  createEmptyRanks,
  createEmptyTreeRanks,
  createEmptyParagon,
  deriveSkillRanks,
  getSchoolPoints,
  PARAGON_DEFS,
  type SkillId,
  type TreeNodeId,
  type TreeRanks,
  type ParagonRanks,
  type ParagonId,
} from '@/game/skills';
import { xpToNext, PARAGON_UNLOCK_LEVEL, LEVEL_MAX, PARAGON_MAX } from '@/game/progression';

const HIGH_SCORE_KEY = 'neon-blaster-highscore';
const REVIVE_XP_LOSS_RATIO = 0.2;
const STARTING_REVIVE_TOKENS = 1;
const REVIVE_TOKEN_LEVEL_REWARDS = [40, 55, 65, 75] as const;

type PowerupMap = Partial<Record<PowerupType, number>>;
type CooldownMap = Partial<Record<SkillId, number>>;

/**
 * Check if a tree node can be allocated right now:
 *   - player level >= unlockLevel
 *   - prerequisites satisfied
 *   - for key passives: no OTHER key passive is active AND school has enough points
 *   - rank < maxRank
 */
const canAllocateNode = (
  id: TreeNodeId,
  tree: TreeRanks,
  playerLevel: number,
): { ok: boolean; reason?: string } => {
  const def = TREE_NODES[id];
  if (tree[id] >= def.maxRank) return { ok: false, reason: 'maxed' };
  if (playerLevel < def.unlockLevel) return { ok: false, reason: 'level' };
  if (def.requires) {
    const sum = def.requires.ids.reduce((a, pid) => a + tree[pid], 0);
    if (sum < def.requires.total) return { ok: false, reason: 'requires' };
  }
  if (def.kind === 'key') {
    if (def.schoolPointsRequired) {
      const pts = getSchoolPoints(tree, def.school);
      if (pts < def.schoolPointsRequired) return { ok: false, reason: 'school' };
    }
    // Only 1 key passive at a time — skip if another is active.
    for (const k of KEY_PASSIVE_IDS) {
      if (k !== id && tree[k] > 0) return { ok: false, reason: 'key-exclusive' };
    }
  }
  return { ok: true };
};

export default function Index() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [treeOpen, setTreeOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [powerups, setPowerups] = useState<PowerupMap>({});
  const [highScore, setHighScore] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);

  // Full tree state lives here. HUD-facing SkillRanks are derived.
  const [treeRanks, setTreeRanks] = useState<TreeRanks>(() => createEmptyTreeRanks());
  const [paragon, setParagon] = useState<ParagonRanks>(() => createEmptyParagon());

  const [progression, setProgression] = useState<Progression>(() => ({
    level: 1,
    xp: 0,
    xpToNext: xpToNext(1),
    skillPoints: 0,
    paragonPoints: 0,
    ranks: createEmptyRanks(),
    paragonLevel: 0,
    endless: false,
  }));
  const [endlessNoticeOpen, setEndlessNoticeOpen] = useState(false);
  const endlessShownRef = useRef(false);
  const [cooldowns, setCooldowns] = useState<CooldownMap>({});
  const [baseCooldowns, setBaseCooldowns] = useState<CooldownMap>({});

  const [reviveTokens, setReviveTokens] = useState<number>(STARTING_REVIVE_TOKENS);
  const lastLevelRef = useRef<number>(1);

  const [fullResetCounter, setFullResetCounter] = useState(0);
  const [reviveCounter, setReviveCounter] = useState(0);
  const [initialXp, setInitialXp] = useState(0);
  const [initialSkillPoints, setInitialSkillPoints] = useState(0);
  const [initialParagonPoints, setInitialParagonPoints] = useState(0);

  const prevStateRef = useRef<GameState>('start');

  useEffect(() => {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (stored) setHighScore(parseInt(stored, 10) || 0);
  }, []);

  const skillRanks = useMemo(
    () => deriveSkillRanks(treeRanks, progression.level),
    [treeRanks, progression.level],
  );

  const startFreshRun = useCallback(() => {
    setIsNewHigh(false);
    const freshTree = createEmptyTreeRanks();
    const freshPar = createEmptyParagon();
    setTreeRanks(freshTree);
    setParagon(freshPar);
    setProgression({
      level: 1,
      xp: 0,
      xpToNext: xpToNext(1),
      skillPoints: 0,
      paragonPoints: 0,
      ranks: createEmptyRanks(),
      paragonLevel: 0,
      endless: false,
    });
    lastLevelRef.current = 1;
    endlessShownRef.current = false;
    setEndlessNoticeOpen(false);
    setReviveTokens(STARTING_REVIVE_TOKENS);
    setScore(0);
    setLives(5);
    setPowerups({});
    setInitialXp(0);
    setInitialSkillPoints(0);
    setInitialParagonPoints(0);
    setFullResetCounter((n) => n + 1);
    setGameState('playing');
  }, []);

  const revive = useCallback(() => {
    if (reviveTokens <= 0) return;
    setIsNewHigh(false);
    const lostXp = Math.floor(progression.xp * REVIVE_XP_LOSS_RATIO);
    const keptXp = Math.max(0, progression.xp - lostXp);
    setProgression((p) => ({ ...p, xp: keptXp }));
    setReviveTokens((t) => t - 1);
    setLives(5);
    setPowerups({});
    setInitialXp(keptXp);
    setInitialSkillPoints(progression.skillPoints);
    setInitialParagonPoints(progression.paragonPoints);
    setReviveCounter((n) => n + 1);
    setGameState('playing');
  }, [progression.xp, progression.skillPoints, progression.paragonPoints, reviveTokens]);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem(HIGH_SCORE_KEY, String(finalScore));
        setIsNewHigh(true);
      }
      setGameState('gameover');
    },
    [highScore],
  );

  const handlePowerupChange = useCallback((remainingByKind: PowerupMap) => {
    setPowerups(remainingByKind);
  }, []);

  const handleProgressionChange = useCallback((p: Progression) => {
    setProgression(p);

    const prev = lastLevelRef.current;
    if (p.level > prev) {
      let granted = 0;
      for (const milestone of REVIVE_TOKEN_LEVEL_REWARDS) {
        if (prev < milestone && p.level >= milestone) granted += 1;
      }
      if (granted > 0) setReviveTokens((t) => t + granted);
      lastLevelRef.current = p.level;
    }

    // First-time entering endless mode: pop a centered notice.
    if (p.endless && !endlessShownRef.current) {
      endlessShownRef.current = true;
      setEndlessNoticeOpen(true);
      window.setTimeout(() => setEndlessNoticeOpen(false), 4500);
    }
  }, []);

  const handleCooldownsChange = useCallback((cd: CooldownMap, base: CooldownMap) => {
    setCooldowns(cd);
    setBaseCooldowns(base);
  }, []);

  const toggleTree = useCallback(() => {
    setTreeOpen((prev) => {
      const next = !prev;
      if (next) {
        prevStateRef.current = gameState === 'playing' ? 'playing' : prevStateRef.current;
        if (gameState === 'playing') setGameState('paused');
      } else {
        if (gameState === 'paused') setGameState('playing');
      }
      return next;
    });
  }, [gameState]);

  // NOTE: We deliberately do NOT call another setState inside a setState updater.
  // React's updater functions must be PURE — under Strict Mode they may run twice
  // for invariant checking, which would otherwise double-apply tree/paragon edits
  // and trigger cascading re-renders that look like a "game restart" to the player.
  const allocateNode = useCallback(
    (id: TreeNodeId) => {
      if (progression.skillPoints <= 0) return;
      const check = canAllocateNode(id, treeRanks, progression.level);
      if (!check.ok) return;
      setTreeRanks({ ...treeRanks, [id]: treeRanks[id] + 1 });
      setProgression((p) => ({ ...p, skillPoints: p.skillPoints - 1 }));
    },
    [treeRanks, progression.skillPoints, progression.level],
  );

  const refundNode = useCallback(
    (id: TreeNodeId) => {
      if (treeRanks[id] <= 0) return;
      setTreeRanks({ ...treeRanks, [id]: treeRanks[id] - 1 });
      setProgression((p) => ({ ...p, skillPoints: p.skillPoints + 1 }));
    },
    [treeRanks],
  );

  const allocateParagon = useCallback(
    (id: ParagonId) => {
      if (progression.paragonPoints <= 0) return;
      const def = PARAGON_DEFS[id];
      if (paragon[id] >= def.maxRank) return;
      setParagon({ ...paragon, [id]: paragon[id] + 1 });
      setProgression((p) => ({ ...p, paragonPoints: p.paragonPoints - 1 }));
    },
    [paragon, progression.paragonPoints],
  );

  const refundParagon = useCallback(
    (id: ParagonId) => {
      if (paragon[id] <= 0) return;
      setParagon({ ...paragon, [id]: paragon[id] - 1 });
      setProgression((p) => ({ ...p, paragonPoints: p.paragonPoints + 1 }));
    },
    [paragon],
  );

  const resetAllPoints = useCallback(() => {
    const total = Object.values(treeRanks).reduce((a, b) => a + b, 0);
    if (total <= 0) return;
    setTreeRanks(createEmptyTreeRanks());
    setProgression((p) => ({ ...p, skillPoints: p.skillPoints + total }));
  }, [treeRanks]);

  const resetParagon = useCallback(() => {
    const total = Object.values(paragon).reduce((a, b) => a + b, 0);
    if (total <= 0) return;
    setParagon(createEmptyParagon());
    setProgression((p) => ({ ...p, paragonPoints: p.paragonPoints + total }));
  }, [paragon]);

  const gameCanvasState: GameState = treeOpen ? 'paused' : gameState;

  const canvasProps = useMemo(
    () => ({
      ranks: skillRanks,
      treeRanks,
      paragon,
      level: progression.level,
    }),
    [skillRanks, treeRanks, paragon, progression.level],
  );

  const reviveXpLoss = Math.floor(progression.xp * REVIVE_XP_LOSS_RATIO);
  const showHud = gameState === 'playing' || gameState === 'paused';

  // Feed the derived skillRanks into progression so the HUD hotbar shows them.
  const progressionForHud = useMemo<Progression>(
    () => ({ ...progression, ranks: skillRanks }),
    [progression, skillRanks],
  );

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-black p-4"
      style={{
        background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #000000 70%), #000',
      }}
    >
      <div className="flex flex-col lg:flex-row items-stretch gap-4 w-full max-w-[1280px]">
        {showHud && (
          <div className="lg:w-64 w-full">
            <LeftPanel
              lives={lives}
              powerups={powerups}
              progression={progressionForHud}
              cooldownsRemaining={cooldowns}
              baseCooldowns={baseCooldowns}
              reviveTokens={reviveTokens}
            />
          </div>
        )}

        <div className="flex-1 flex items-center justify-center">
          <div
            className="relative"
            style={{
              width: '100%',
              maxWidth: CANVAS_W,
              aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
              border: '2px solid #00FFFF',
              boxShadow:
                '0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 30px rgba(0, 255, 255, 0.1)',
            }}
          >
            <GameCanvas
              state={gameCanvasState}
              onScoreChange={setScore}
              onLivesChange={setLives}
              onPowerupChange={handlePowerupChange}
              onProgressionChange={handleProgressionChange}
              onCooldownsChange={handleCooldownsChange}
              onGameOver={handleGameOver}
              onToggleTree={toggleTree}
              ranks={canvasProps.ranks}
              treeRanks={canvasProps.treeRanks}
              paragon={canvasProps.paragon}
              level={canvasProps.level}
              fullResetCounter={fullResetCounter}
              reviveCounter={reviveCounter}
              initialXp={initialXp}
              initialSkillPoints={initialSkillPoints}
              initialParagonPoints={initialParagonPoints}
            />

            {gameState === 'start' && (
              <StartScreen onStart={startFreshRun} highScore={highScore} />
            )}
            {endlessNoticeOpen && (
              <div
                onClick={() => setEndlessNoticeOpen(false)}
                className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(0, 0, 0, 0.35)' }}
              >
                <div
                  className="px-10 py-6 text-center"
                  style={{
                    border: '2px solid #B266FF',
                    background: 'rgba(20, 6, 40, 0.9)',
                    boxShadow:
                      '0 0 40px rgba(178, 102, 255, 0.7), inset 0 0 24px rgba(178, 102, 255, 0.25)',
                    borderRadius: 12,
                  }}
                >
                  <div
                    className="text-3xl font-extrabold tracking-widest"
                    style={{
                      color: '#FFE8FF',
                      textShadow: '0 0 16px #B266FF, 0 0 32px #B266FF',
                    }}
                  >
                    巅峰等级已满
                  </div>
                  <div
                    className="mt-2 text-xl font-bold tracking-wider"
                    style={{ color: '#B266FF' }}
                  >
                    进入无尽模式
                  </div>
                  <div className="mt-3 text-xs text-white/60">
                    （点击关闭 · {PARAGON_UNLOCK_LEVEL} 级 · 巅峰 {PARAGON_MAX} 满）
                  </div>
                </div>
              </div>
            )}
            {gameState === 'gameover' && (
              <GameOverScreen
                score={score}
                highScore={highScore}
                isNewHigh={isNewHigh}
                level={progression.level}
                xp={progression.xp}
                xpToNext={progression.xpToNext}
                reviveXpLoss={reviveXpLoss}
                reviveTokens={reviveTokens}
                onRevive={revive}
                onRestart={startFreshRun}
              />
            )}

            <SkillTree
              open={treeOpen}
              progression={progression}
              treeRanks={treeRanks}
              paragon={paragon}
              paragonUnlockLevel={PARAGON_UNLOCK_LEVEL}
              onClose={toggleTree}
              onAllocateNode={allocateNode}
              onRefundNode={refundNode}
              onAllocateParagon={allocateParagon}
              onRefundParagon={refundParagon}
              onResetAll={resetAllPoints}
              onResetParagon={resetParagon}
            />
          </div>
        </div>

        {showHud && (
          <div className="lg:w-64 w-full">
            <RightPanel score={score} highScore={highScore} progression={progressionForHud} />
          </div>
        )}
      </div>
    </div>
  );
}
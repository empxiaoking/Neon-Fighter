import { useMemo, useState } from 'react';
import {
  TREE_NODES,
  TREE_NODE_IDS,
  KEY_PASSIVE_IDS,
  SCHOOL_COLORS,
  SCHOOL_NAMES,
  PARAGON_DEFS,
  PARAGON_IDS,
  getSchoolPoints,
  getActiveKeyPassive,
  type TreeNodeId,
  type TreeRanks,
  type ParagonRanks,
  type ParagonId,
  type SchoolId,
  type NodeLayer,
} from './skills';
import type { Progression } from './types';

type Props = {
  open: boolean;
  progression: Progression;
  treeRanks: TreeRanks;
  paragon: ParagonRanks;
  paragonUnlockLevel: number;
  onClose: () => void;
  onAllocateNode: (id: TreeNodeId) => void;
  onRefundNode: (id: TreeNodeId) => void;
  onAllocateParagon: (id: ParagonId) => void;
  onRefundParagon: (id: ParagonId) => void;
  onResetAll: () => void;
  onResetParagon: () => void;
};

type Tab = 'tree' | 'paragon';

/**
 * Skill tree panel — vertical scrollable layout.
 *
 * Design changes from the pentagon prototype:
 *   - Each school is a **horizontal row** stacked top-to-bottom, so the
 *     player can discover every node by simply scrolling the wheel. No
 *     nodes get clipped outside the viewport.
 *   - Per-row nodes are grouped into 4 layer columns: T0 basic → T3 key.
 *   - Tooltip is anchored at the bottom of the panel (sticky), so it's always
 *     visible no matter the scroll pos.
 */
export default function SkillTree({
  open,
  progression,
  treeRanks,
  paragon,
  paragonUnlockLevel,
  onClose,
  onAllocateNode,
  onRefundNode,
  onAllocateParagon,
  onRefundParagon,
  onResetAll,
  onResetParagon,
}: Props) {
  const [hovered, setHovered] = useState<TreeNodeId | null>(null);
  const [hoveredPara, setHoveredPara] = useState<ParagonId | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [keyConfirm, setKeyConfirm] = useState<TreeNodeId | null>(null);
  const [tab, setTab] = useState<Tab>('tree');

  const totalAllocated = useMemo(
    () => Object.values(treeRanks).reduce((a, b) => a + b, 0),
    [treeRanks],
  );
  const totalParagon = useMemo(
    () => Object.values(paragon).reduce((a, b) => a + b, 0),
    [paragon],
  );

  const activeKey = getActiveKeyPassive(treeRanks);

  if (!open) return null;

  const canAllocate = (id: TreeNodeId): boolean => {
    const def = TREE_NODES[id];
    if (treeRanks[id] >= def.maxRank) return false;
    if (progression.skillPoints <= 0) return false;
    if (progression.level < def.unlockLevel) return false;
    if (def.requires) {
      const sum = def.requires.ids.reduce((a, pid) => a + treeRanks[pid], 0);
      if (sum < def.requires.total) return false;
    }
    if (def.kind === 'key') {
      if (def.schoolPointsRequired) {
        if (getSchoolPoints(treeRanks, def.school) < def.schoolPointsRequired) return false;
      }
      for (const k of KEY_PASSIVE_IDS) {
        if (k !== id && treeRanks[k] > 0) return false;
      }
    }
    return true;
  };

  const handleClick = (id: TreeNodeId) => {
    const def = TREE_NODES[id];
    if (def.kind === 'key' && activeKey && activeKey !== id && treeRanks[id] === 0) {
      setKeyConfirm(id);
      return;
    }
    if (canAllocate(id)) onAllocateNode(id);
  };

  const confirmKeySwap = () => {
    if (!keyConfirm) return;
    if (activeKey) onRefundNode(activeKey);
    onAllocateNode(keyConfirm);
    setKeyConfirm(null);
  };

  const paragonUnlocked = progression.level > paragonUnlockLevel;
  const schoolOrder: SchoolId[] = ['missile', 'laser', 'drone'];

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at center, rgba(8,6,16,0.94) 0%, rgba(0,0,0,0.97) 80%)',
      }}
      onClick={onClose}
    >
      <div
        className="relative font-mono text-cyan-100 flex flex-col"
        style={{
          width: 1100,
          maxWidth: '98%',
          height: 720,
          maxHeight: '96%',
          border: '2px solid #00FFFF',
          boxShadow: '0 0 40px rgba(0,255,255,0.5), inset 0 0 40px rgba(0,255,255,0.1)',
          background: 'linear-gradient(180deg, rgba(6,10,30,0.96), rgba(0,0,0,0.96))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-2.5 shrink-0 gap-2 flex-wrap"
          style={{ borderBottom: '1px solid rgba(0,255,255,0.3)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0">
              <div className="text-cyan-300 tracking-[0.3em] text-[10px]">技能树 / PARAGON</div>
              <div
                className="text-white text-lg font-bold leading-tight"
                style={{ textShadow: '0 0 10px #0ff' }}
              >
                Lv.{progression.level}
              </div>
            </div>
            <div className="flex border border-cyan-400/30 shrink-0">
              <button
                onClick={() => setTab('tree')}
                className="px-3 py-1 text-xs tracking-widest"
                style={{
                  background: tab === 'tree' ? 'rgba(0,255,255,0.2)' : 'transparent',
                  color: tab === 'tree' ? '#0ff' : '#9ae6ff',
                }}
              >
                技能树
              </button>
              <button
                onClick={() => paragonUnlocked && setTab('paragon')}
                disabled={!paragonUnlocked}
                className="px-3 py-1 text-xs tracking-widest border-l border-cyan-400/30"
                style={{
                  background: tab === 'paragon' ? 'rgba(255,215,0,0.2)' : 'transparent',
                  color: paragonUnlocked ? (tab === 'paragon' ? '#FFD700' : '#ffe066') : '#555',
                  cursor: paragonUnlocked ? 'pointer' : 'not-allowed',
                }}
              >
                PARAGON {paragonUnlocked ? '' : `(Lv.${paragonUnlockLevel + 1})`}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {tab === 'tree' ? (
              <>
                <div
                  className="px-3 py-1 border text-xs"
                  style={{
                    borderColor: progression.skillPoints > 0 ? '#FFD700' : 'rgba(255,255,255,0.2)',
                    color: progression.skillPoints > 0 ? '#FFD700' : '#888',
                    boxShadow: progression.skillPoints > 0 ? '0 0 10px rgba(255,215,0,0.5)' : 'none',
                  }}
                >
                  可用 {progression.skillPoints} · 已分配 {totalAllocated}
                </div>
                {totalAllocated > 0 && (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="px-3 py-1 border text-xs tracking-wider"
                    style={{ borderColor: '#ff6688', color: '#ff99bb', background: 'transparent' }}
                  >
                    洗点
                  </button>
                )}
              </>
            ) : (
              <>
                <div
                  className="px-3 py-1 border text-xs"
                  style={{
                    borderColor: progression.paragonPoints > 0 ? '#FFD700' : 'rgba(255,255,255,0.2)',
                    color: progression.paragonPoints > 0 ? '#FFD700' : '#888',
                  }}
                >
                  Paragon {progression.paragonPoints} / 已分配 {totalParagon}
                </div>
                {totalParagon > 0 && (
                  <button
                    onClick={onResetParagon}
                    className="px-3 py-1 border text-xs"
                    style={{ borderColor: '#ff6688', color: '#ff99bb' }}
                  >
                    洗点
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 text-xs tracking-widest"
              style={{
                border: '1px solid #00FFFF',
                color: '#00FFFF',
                background: 'rgba(0,255,255,0.08)',
              }}
            >
              关闭 C / ESC
            </button>
          </div>
        </div>

        {/* Main body */}
        <div className="flex flex-1 min-h-0">
          {/* Tree / Paragon content area */}
          <div className="flex-1 relative min-w-0" style={{ background: 'rgba(0,5,15,0.4)' }}>
            {tab === 'tree' ? (
              <TreeView
                schoolOrder={schoolOrder}
                treeRanks={treeRanks}
                canAllocate={canAllocate}
                onNodeClick={handleClick}
                onNodeRefund={onRefundNode}
                hovered={hovered}
                setHovered={setHovered}
                progression={progression}
                activeKey={activeKey}
              />
            ) : (
              <ParagonView
                paragon={paragon}
                progression={progression}
                onAllocate={onAllocateParagon}
                onRefund={onRefundParagon}
                hovered={hoveredPara}
                setHovered={setHoveredPara}
              />
            )}
          </div>
        </div>

        {/* Reset confirm */}
        {confirmReset && (
          <ResetConfirm
            message={`确认洗点？所有 ${totalAllocated} 点将返还。`}
            onOk={() => {
              onResetAll();
              setConfirmReset(false);
            }}
            onCancel={() => setConfirmReset(false)}
          />
        )}

        {/* Key-passive swap confirm */}
        {keyConfirm && (
          <ResetConfirm
            message={`同时只能激活 1 个关键被动。是否替换为 ${TREE_NODES[keyConfirm].name}？`}
            onOk={confirmKeySwap}
            onCancel={() => setKeyConfirm(null)}
          />
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Vertical tree view — one row per school
// ----------------------------------------------------------------------------

type TreeViewProps = {
  schoolOrder: SchoolId[];
  treeRanks: TreeRanks;
  canAllocate: (id: TreeNodeId) => boolean;
  onNodeClick: (id: TreeNodeId) => void;
  onNodeRefund: (id: TreeNodeId) => void;
  hovered: TreeNodeId | null;
  setHovered: (id: TreeNodeId | null) => void;
  progression: Progression;
  activeKey: TreeNodeId | null;
};

// Column ordering for the row layout. Time-warp is an extra slot for EMP.
const LAYER_COLUMNS: NodeLayer[] = ['T0', 'T1', 'T2', 'TX', 'T3'];
const COLUMN_LABEL: Record<NodeLayer, string> = {
  T0: '基础',
  T1: '核心',
  T2: '进阶',
  T3: '关键被动',
  TX: '附加',
};

function TreeView({
  schoolOrder,
  treeRanks,
  canAllocate,
  onNodeClick,
  onNodeRefund,
  hovered,
  setHovered,
  progression,
  activeKey,
}: TreeViewProps) {
  // Group nodes by school+layer once.
  const bySchoolLayer = useMemo(() => {
    const out: Record<SchoolId, Partial<Record<NodeLayer, TreeNodeId[]>>> = {
      missile: {},
      laser: {},
      drone: {},
    };
    for (const id of TREE_NODE_IDS) {
      const def = TREE_NODES[id];
      const s = out[def.school];
      (s[def.layer] ??= []).push(id);
    }
    return out;
  }, []);

  return (
    <div className="w-full h-full overflow-y-auto relative">
      {/* Column header bar (sticky) */}
      <div
        className="sticky top-0 z-10 grid grid-cols-[120px_repeat(5,1fr)] gap-2 px-3 py-2 text-[10px] tracking-[0.3em] text-cyan-300"
        style={{
          background: 'rgba(0,5,15,0.95)',
          borderBottom: '1px solid rgba(0,255,255,0.2)',
        }}
      >
        <div>流派</div>
        {LAYER_COLUMNS.map((layer) => (
          <div key={layer} className="text-center">
            {COLUMN_LABEL[layer]}
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        {schoolOrder.map((school) => {
          const pts = getSchoolPoints(treeRanks, school);
          const color = SCHOOL_COLORS[school];
          return (
            <div
              key={school}
              className="grid grid-cols-[120px_repeat(5,1fr)] gap-2 px-3 py-3 items-center"
              style={{
                borderBottom: '1px dashed rgba(255,255,255,0.08)',
                background: `linear-gradient(90deg, ${color}08, transparent 40%)`,
              }}
            >
              {/* School label */}
              <div className="flex flex-col gap-0.5 pr-2">
                <div
                  className="text-sm font-bold tracking-[0.15em]"
                  style={{ color, textShadow: `0 0 6px ${color}` }}
                >
                  {SCHOOL_NAMES[school]}
                </div>
                <div className="text-[10px] text-gray-400 tabular-nums">
                  已投入 <span style={{ color }}>{pts}</span> 点
                </div>
              </div>

              {/* Each layer column */}
              {LAYER_COLUMNS.map((layer) => {
                const ids = bySchoolLayer[school][layer] ?? [];
                if (ids.length === 0) {
                  return <div key={layer} className="opacity-0" />;
                }
                return (
                  <div
                    key={layer}
                    className="flex flex-wrap gap-1.5 justify-center items-center"
                  >
                    {ids.map((id) => (
                      <TreeNodeChip
                        key={id}
                        id={id}
                        treeRanks={treeRanks}
                        progression={progression}
                        canAlloc={canAllocate(id)}
                        activeKey={activeKey}
                        onClick={() => onNodeClick(id)}
                        onRefund={() => onNodeRefund(id)}
                        hovered={hovered === id}
                        onHover={(h) => setHovered(h ? id : null)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Sticky tooltip pinned at bottom so it never gets clipped */}
      {hovered && <TooltipBar id={hovered} treeRanks={treeRanks} progression={progression} />}

      {/* Legend */}
      <div
        className="sticky bottom-0 px-3 py-1.5 text-[10px] text-gray-400 flex justify-between"
        style={{
          background: 'rgba(0,5,15,0.95)',
          borderTop: '1px solid rgba(0,255,255,0.15)',
        }}
      >
        <span>左键 = 加点 · 右键 = 退点 · ⊘ = 已激活另一个关键被动</span>
        <span>鼠标悬停查看详情</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Individual clickable chip
// ----------------------------------------------------------------------------

function TreeNodeChip({
  id,
  treeRanks,
  progression,
  canAlloc,
  activeKey,
  onClick,
  onRefund,
  hovered,
  onHover,
}: {
  id: TreeNodeId;
  treeRanks: TreeRanks;
  progression: Progression;
  canAlloc: boolean;
  activeKey: TreeNodeId | null;
  onClick: () => void;
  onRefund: () => void;
  hovered: boolean;
  onHover: (h: boolean) => void;
}) {
  const def = TREE_NODES[id];
  const rank = treeRanks[id];
  const color = SCHOOL_COLORS[def.school];
  const levelLocked = progression.level < def.unlockLevel;
  const isKey = def.kind === 'key';
  const isActiveKey = isKey && rank > 0;
  const isAnotherKeyActive = isKey && rank === 0 && activeKey !== null;

  const size =
    def.kind === 'key' ? 44 : def.kind === 'advanced' ? 40 : def.kind === 'core' ? 38 : 44;
  const bgOpacity = rank > 0 ? 0.45 : 0.12;
  const borderColor = rank > 0 ? color : levelLocked ? '#444' : canAlloc ? color : '#555';

  return (
    <div
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (rank > 0) onRefund();
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className="relative flex flex-col items-center justify-center cursor-pointer transition-all"
      style={{
        width: size,
        height: size,
        transform: hovered ? 'scale(1.1)' : 'scale(1)',
        border: `2px solid ${borderColor}`,
        background: `${color}${Math.floor(bgOpacity * 255).toString(16).padStart(2, '0')}`,
        color: rank > 0 ? '#fff' : '#aaa',
        boxShadow: isActiveKey
          ? `0 0 16px ${color}, 0 0 8px #FFD700`
          : rank > 0
            ? `0 0 8px ${color}`
            : 'none',
        borderRadius:
          isKey ? '50%' : def.kind === 'advanced' ? 0 : def.kind === 'basic' ? 6 : 4,
        clipPath:
          def.kind === 'advanced' ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' : undefined,
        opacity: levelLocked ? 0.45 : 1,
      }}
      title={`${def.name} (${rank}/${def.maxRank})`}
    >
      <span className="text-[10px] font-bold leading-none">
        {rank}/{def.maxRank}
      </span>
      {levelLocked && (
        <span className="text-[8px] leading-none text-red-300 mt-0.5">
          Lv.{def.unlockLevel}
        </span>
      )}
      {isAnotherKeyActive && (
        <div
          className="absolute inset-0 flex items-center justify-center text-[18px]"
          style={{ color: '#ff6688' }}
        >
          ⊘
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Bottom tooltip bar — always visible, fits inside the viewport.
// ----------------------------------------------------------------------------

function TooltipBar({
  id,
  treeRanks,
  progression,
}: {
  id: TreeNodeId;
  treeRanks: TreeRanks;
  progression: Progression;
}) {
  const def = TREE_NODES[id];
  const rank = treeRanks[id];
  const color = SCHOOL_COLORS[def.school];
  const levelLocked = progression.level < def.unlockLevel;

  let reqText = '';
  if (def.requires) {
    const sum = def.requires.ids.reduce((a, pid) => a + treeRanks[pid], 0);
    const ok = sum >= def.requires.total;
    reqText = `前置 ${def.requires.total}（当前 ${sum}）${ok ? ' ✓' : ' ✗'}`;
  }
  let keyText = '';
  if (def.kind === 'key' && def.schoolPointsRequired) {
    const pts = getSchoolPoints(treeRanks, def.school);
    const ok = pts >= def.schoolPointsRequired;
    keyText = `流派点数 ≥ ${def.schoolPointsRequired}（当前 ${pts}）${ok ? ' ✓' : ' ✗'}`;
  }

  return (
    <div
      className="absolute left-2 right-2 bottom-2 px-2 py-1 text-[11px] z-20 pointer-events-none"
      style={{
        background: 'rgba(0,0,0,0.95)',
        border: `1px solid ${color}`,
        boxShadow: `0 0 10px ${color}`,
        color: '#fff',
        maxWidth: 'calc(100% - 16px)',
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <span
            className="font-bold text-[12px]"
            style={{ color, textShadow: `0 0 4px ${color}` }}
          >
            {def.name}
          </span>
          <span className="text-[9px] text-gray-400">
            {def.layer} · {def.kind} · {SCHOOL_NAMES[def.school]}
          </span>
        </div>
        <div className="text-[9px] text-cyan-200 tabular-nums">
          {rank}/{def.maxRank} · Lv.{def.unlockLevel}
          {levelLocked && <span className="text-red-300 ml-1">(未解锁)</span>}
        </div>
      </div>
      <div className="text-gray-100 leading-snug mt-0.5 text-[10px]">{def.short}</div>
      {(reqText || keyText) && (
        <div className="text-amber-300 mt-0.5 text-[9px] flex gap-2 flex-wrap">
          {reqText && <span>{reqText}</span>}
          {keyText && <span>{keyText}</span>}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Paragon view
// ----------------------------------------------------------------------------

function ParagonView({
  paragon,
  progression,
  onAllocate,
  onRefund,
  hovered,
  setHovered,
}: {
  paragon: ParagonRanks;
  progression: Progression;
  onAllocate: (id: ParagonId) => void;
  onRefund: (id: ParagonId) => void;
  hovered: ParagonId | null;
  setHovered: (id: ParagonId | null) => void;
}) {
  const panels: Array<{
    key: 'attack' | 'defense' | 'economy' | 'synergy';
    name: string;
    color: string;
  }> = [
    { key: 'attack', name: '攻击', color: '#FF6600' },
    { key: 'defense', name: '防御', color: '#00AAFF' },
    { key: 'economy', name: '经济', color: '#FFD700' },
    { key: 'synergy', name: '协同', color: '#FF66CC' },
  ];

  return (
    <div className="w-full h-full overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-3">
        {panels.map((panel) => {
          const ids = PARAGON_IDS.filter((id) => PARAGON_DEFS[id].panel === panel.key);
          return (
            <div
              key={panel.key}
              className="p-3 border"
              style={{
                borderColor: panel.color,
                background: `${panel.color}15`,
                boxShadow: `inset 0 0 10px ${panel.color}22`,
              }}
            >
              <div
                className="text-xs tracking-[0.3em] font-bold mb-2"
                style={{ color: panel.color, textShadow: `0 0 6px ${panel.color}` }}
              >
                {panel.name} PANEL
              </div>
              <div className="flex flex-col gap-1.5">
                {ids.map((id) => {
                  const def = PARAGON_DEFS[id];
                  const r = paragon[id];
                  const maxed = r >= def.maxRank;
                  const canUse = !maxed && progression.paragonPoints > 0;
                  return (
                    <div
                      key={id}
                      onMouseEnter={() => setHovered(id)}
                      onMouseLeave={() => setHovered(null)}
                      className="flex items-center justify-between gap-2 p-1.5 text-xs border"
                      style={{
                        borderColor: r > 0 ? panel.color : 'rgba(255,255,255,0.15)',
                        background: r > 0 ? `${panel.color}22` : 'transparent',
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-bold truncate"
                          style={{ color: r > 0 ? '#fff' : '#bbb' }}
                        >
                          {def.name}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">{def.short}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-white">
                          {r}/{def.maxRank}
                        </span>
                        <button
                          onClick={() => onRefund(id)}
                          disabled={r <= 0}
                          className="w-5 h-5 text-xs border"
                          style={{
                            borderColor: r > 0 ? '#ff6688' : '#333',
                            color: r > 0 ? '#ff99bb' : '#555',
                            background: 'transparent',
                            cursor: r > 0 ? 'pointer' : 'not-allowed',
                          }}
                        >
                          -
                        </button>
                        <button
                          onClick={() => canUse && onAllocate(id)}
                          disabled={!canUse}
                          className="w-5 h-5 text-xs border"
                          style={{
                            borderColor: canUse ? panel.color : '#333',
                            color: canUse ? panel.color : '#555',
                            background: canUse ? `${panel.color}33` : 'transparent',
                            cursor: canUse ? 'pointer' : 'not-allowed',
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {hovered && (
        <div className="mt-3 p-2 text-[10px] text-gray-300 border border-white/10">
          {PARAGON_DEFS[hovered].name} — {PARAGON_DEFS[hovered].short}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Reset confirm modal
// ----------------------------------------------------------------------------

function ResetConfirm({
  message,
  onOk,
  onCancel,
}: {
  message: string;
  onOk: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.8)' }}
    >
      <div
        className="p-5 max-w-sm"
        style={{ border: '2px solid #ff6688', background: 'rgba(20,0,0,0.95)' }}
      >
        <div className="text-[#ff99bb] font-bold tracking-wider mb-2 text-sm">确认</div>
        <div className="text-white text-xs mb-4 leading-relaxed">{message}</div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs border border-white/30 text-white !bg-transparent !hover:bg-transparent"
          >
            取消
          </button>
          <button
            onClick={onOk}
            className="px-3 py-1 text-xs text-white"
            style={{ background: '#ff6688' }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
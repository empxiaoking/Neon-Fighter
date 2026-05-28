import type { PowerupType, Progression } from './types';
import {
  POWERUP_DURATION,
  POWERUP_MAX_DURATION,
  SHIELD_MAX_CHARGES,
} from './constants';
import { SKILL_DEFS, SKILL_IDS, type SkillId } from './skills';

type PowerupMap = Partial<Record<PowerupType, number>>;
type CooldownMap = Partial<Record<SkillId, number>>;

type Props = {
  lives: number;
  powerups: PowerupMap;
  rapidStacks?: number;
  shieldCharges?: number;
  progression: Progression;
  cooldownsRemaining: CooldownMap;
  baseCooldowns: CooldownMap;
  reviveTokens?: number;
};

const powerupLabel: Record<PowerupType, string> = {
  rapid: '连射',
  shield: '护盾',
  heal: '回血',
  speed: '极速',
  nocd: '零CD',
};

const powerupColor: Record<PowerupType, string> = {
  rapid: '#FFAA00',
  shield: '#00AAFF',
  heal: '#00FF88',
  speed: '#00FFAA',
  nocd: '#FFD700',
};

// Buffs we show in the active panel (heal is instant so excluded).
const BUFF_ORDER: PowerupType[] = ['rapid', 'shield', 'speed', 'nocd'];

/**
 * Left-side control panel. Holds everything combat/defense related: lives,
 * shield charges, active buffs, skill cooldowns, and revive tokens.
 */
export default function LeftPanel({
  lives,
  powerups,
  rapidStacks = 0,
  shieldCharges,
  progression,
  cooldownsRemaining,
  baseCooldowns,
  reviveTokens = 0,
}: Props) {
  const active = BUFF_ORDER.filter((k) => (powerups[k] ?? 0) > 0.01);
  const shieldActive = (powerups.shield ?? 0) > 0.01;
  const effectiveShieldCharges =
    shieldCharges !== undefined
      ? shieldCharges
      : shieldActive
        ? SHIELD_MAX_CHARGES
        : 0;

  return (
    <aside
      className="font-mono text-white flex flex-col gap-3 select-none"
      style={{ width: 220 }}
    >
      <Section title="生命值" color="#FF0066">
        <div className="flex gap-1 flex-wrap min-h-[18px]">
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4"
              style={{
                background: '#FF0066',
                clipPath: 'polygon(50% 0%, 100% 100%, 50% 75%, 0% 100%)',
                boxShadow: '0 0 8px #FF0066',
              }}
            />
          ))}
          {lives === 0 && <span className="text-xs text-white/60">——</span>}
        </div>
      </Section>

      <Section
        title="护盾格挡"
        color={effectiveShieldCharges > 0 ? '#00AAFF' : '#555'}
        dim={effectiveShieldCharges <= 0}
      >
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: SHIELD_MAX_CHARGES }).map((_, i) => {
            const isActive = i < effectiveShieldCharges;
            return (
              <div
                key={i}
                className="w-4 h-4 rounded-full border-2"
                style={{
                  borderColor: isActive ? '#00AAFF' : 'rgba(120,120,120,0.6)',
                  background: isActive ? 'rgba(0,170,255,0.35)' : 'transparent',
                  boxShadow: isActive ? '0 0 8px #00AAFF' : 'none',
                }}
              />
            );
          })}
          <span className="text-xs ml-1 text-white/60 tabular-nums">
            {effectiveShieldCharges}/{SHIELD_MAX_CHARGES}
          </span>
        </div>
      </Section>

      <Section
        title="复活币"
        color={reviveTokens > 0 ? '#FFAA00' : '#555'}
        dim={reviveTokens <= 0}
      >
        <div
          className="text-xl font-bold tabular-nums"
          style={{
            color: reviveTokens > 0 ? '#FFCC55' : '#666',
            textShadow: reviveTokens > 0 ? '0 0 10px #FFAA00' : 'none',
          }}
        >
          ✦ {reviveTokens}
        </div>
      </Section>

      <Section title="当前增益" color="#9D4EDD">
        {active.length === 0 ? (
          <div className="text-xs text-white/40">无</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {active.map((kind) => {
              const remaining = Math.max(0, powerups[kind] ?? 0);
              const pct = Math.min(100, (remaining / POWERUP_MAX_DURATION) * 100);
              const baseMark = (POWERUP_DURATION / POWERUP_MAX_DURATION) * 100;
              const color = powerupColor[kind];
              const showStacks = kind === 'rapid' && rapidStacks > 1;
              return (
                <div key={kind}>
                  <div className="flex items-baseline justify-between text-[11px] mb-0.5">
                    <span style={{ color }} className="tracking-widest">
                      {powerupLabel[kind]}
                      {showStacks && (
                        <span
                          className="ml-1 text-[10px] font-bold"
                          style={{ color: '#FFF', textShadow: `0 0 6px ${color}` }}
                        >
                          ×{rapidStacks}
                        </span>
                      )}
                    </span>
                    <span style={{ color }} className="tabular-nums">
                      {remaining.toFixed(1)}s
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-white/10 rounded overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        boxShadow: `0 0 6px ${color}`,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-px bg-white/40"
                      style={{ left: `${baseMark}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="技能栏" color="#00FFFF">
        <div className="grid grid-cols-3 gap-1.5">
          {SKILL_IDS.map((id) => {
            const def = SKILL_DEFS[id];
            const rank = progression.ranks[id];
            const locked = progression.level < def.unlockLevel;
            const unrankedLocked = !locked && rank === 0 && def.id !== 'basic';
            const remaining = cooldownsRemaining[id] ?? 0;
            const base = baseCooldowns[id] ?? def.cooldown;
            const pct = base > 0 && remaining > 0 ? Math.min(1, remaining / base) : 0;
            return (
              <div
                key={id}
                className="relative w-full aspect-square flex items-center justify-center border-2 rounded"
                style={{
                  borderColor:
                    locked || unrankedLocked ? 'rgba(120,120,120,0.6)' : def.color,
                  background: 'rgba(0,0,0,0.75)',
                  boxShadow:
                    !locked && !unrankedLocked
                      ? `0 0 8px ${def.color}66, inset 0 0 6px ${def.color}33`
                      : 'none',
                  opacity: locked ? 0.35 : unrankedLocked ? 0.55 : 1,
                }}
                title={`${def.name} [${def.keyLabel}]`}
              >
                <span
                  className="text-sm font-bold"
                  style={{
                    color: locked || unrankedLocked ? '#888' : def.color,
                    textShadow:
                      !locked && !unrankedLocked ? `0 0 4px ${def.color}` : undefined,
                  }}
                >
                  {def.keyLabel}
                </span>
                {pct > 0 && (
                  <div
                    className="absolute inset-0 bg-black/70 pointer-events-none"
                    style={{ clipPath: `inset(0 0 ${(1 - pct) * 100}% 0)` }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold tabular-nums">
                      {remaining.toFixed(1)}
                    </span>
                  </div>
                )}
                {!locked && rank > 0 && (
                  <div
                    className="absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded"
                    style={{
                      background: def.color,
                      color: '#000',
                      boxShadow: `0 0 4px ${def.color}`,
                    }}
                  >
                    {rank}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {progression.skillPoints > 0 && (
          <div
            className="text-[10px] mt-2 tracking-widest animate-pulse"
            style={{ color: '#FFD700', textShadow: '0 0 6px #FFD700' }}
          >
            ✦ 未分配技能点 {progression.skillPoints}
          </div>
        )}
      </Section>
    </aside>
  );
}

function Section({
  title,
  color,
  dim,
  children,
}: {
  title: string;
  color: string;
  dim?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="border rounded px-3 py-2 backdrop-blur-sm"
      style={{
        borderColor: dim ? 'rgba(120,120,120,0.5)' : `${color}99`,
        background: 'rgba(0,0,0,0.55)',
        boxShadow: dim ? 'none' : `0 0 10px ${color}44`,
      }}
    >
      <div
        className="text-[10px] tracking-widest mb-1"
        style={{ color: dim ? '#888' : color }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
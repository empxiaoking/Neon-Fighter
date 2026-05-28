import { SKILL_DEFS, SKILL_IDS, type SkillId } from './skills';
import type { Progression } from './types';

type Props = {
  progression: Progression;
  cooldownsRemaining: Partial<Record<SkillId, number>>; // seconds remaining per skill
  baseCooldowns: Partial<Record<SkillId, number>>; // effective base cooldown per skill after ranks
};

/**
 * Hotbar showing 6 skill slots across the bottom of the play area.
 * Slot 0 = Space (basic attack), 1..5 = number keys.
 */
export default function SkillBar({ progression, cooldownsRemaining, baseCooldowns }: Props) {
  return (
    <div className="absolute left-0 right-0 bottom-4 flex items-end justify-center gap-2 px-4 pointer-events-none font-mono">
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
            className="relative flex flex-col items-center"
            style={{ width: 56 }}
          >
            <div
              className="relative w-12 h-12 flex items-center justify-center border-2 rounded"
              style={{
                borderColor: locked || unrankedLocked ? 'rgba(120,120,120,0.6)' : def.color,
                background: 'rgba(0,0,0,0.75)',
                boxShadow:
                  !locked && !unrankedLocked
                    ? `0 0 10px ${def.color}66, inset 0 0 8px ${def.color}33`
                    : 'none',
                opacity: locked ? 0.35 : unrankedLocked ? 0.55 : 1,
              }}
            >
              <span
                className="text-lg font-bold"
                style={{
                  color: locked || unrankedLocked ? '#888' : def.color,
                  textShadow:
                    !locked && !unrankedLocked ? `0 0 6px ${def.color}` : undefined,
                }}
              >
                {def.keyLabel}
              </span>

              {/* Cooldown sweep */}
              {pct > 0 && (
                <div
                  className="absolute inset-0 bg-black/70 pointer-events-none"
                  style={{
                    clipPath: `inset(0 0 ${(1 - pct) * 100}% 0)`,
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold tabular-nums">
                    {remaining.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Rank pip */}
              {!locked && rank > 0 && (
                <div
                  className="absolute -top-1 -right-1 text-[10px] font-bold px-1 rounded"
                  style={{
                    background: def.color,
                    color: '#000',
                    boxShadow: `0 0 6px ${def.color}`,
                  }}
                >
                  {rank}
                </div>
              )}
            </div>
            <div
              className="text-[9px] mt-1 tracking-widest truncate w-full text-center"
              style={{
                color: locked || unrankedLocked ? '#888' : def.color,
              }}
            >
              {def.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
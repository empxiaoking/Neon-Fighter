import type { PowerupType, Progression } from './types';
import { POWERUP_DURATION, POWERUP_MAX_DURATION } from './constants';

type Props = {
  score: number;
  highScore: number;
  lives: number;
  powerups: Partial<Record<PowerupType, number>>; // kind -> remaining seconds
  progression: Progression;
  reviveTokens: number;
};

const powerupLabel: Record<PowerupType, string> = {
  rapid: '连射模式',
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

const ORDER: PowerupType[] = ['rapid', 'shield', 'speed', 'nocd'];

export default function HUD({
  score,
  highScore,
  lives,
  powerups,
  progression,
  reviveTokens,
}: Props) {
  const active = ORDER.filter((k) => (powerups[k] ?? 0) > 0.01);
  const xpPct =
    progression.xpToNext === Infinity
      ? 100
      : Math.min(100, (progression.xp / progression.xpToNext) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between font-mono text-sm">
      <div className="flex justify-between items-start gap-3">
        <div
          className="bg-black/60 border border-cyan-500/60 px-3 py-2 rounded backdrop-blur"
          style={{ boxShadow: '0 0 15px rgba(0,255,255,0.3)' }}
        >
          <div className="text-cyan-400 text-xs tracking-widest">当前得分</div>
          <div
            className="text-cyan-300 text-2xl font-bold tabular-nums"
            style={{ textShadow: '0 0 10px #0ff' }}
          >
            {score.toString().padStart(6, '0')}
          </div>
        </div>

        {/* Level / XP */}
        <div
          className="bg-black/60 border border-purple-400/60 px-3 py-2 rounded backdrop-blur flex-1 max-w-xs"
          style={{ boxShadow: '0 0 15px rgba(157,78,221,0.3)' }}
        >
          <div className="flex items-baseline justify-between">
            <div className="text-purple-300 text-xs tracking-widest">等级</div>
            <div className="text-[10px] text-white/70 tabular-nums">
              {progression.xpToNext === Infinity
                ? 'MAX'
                : `${progression.xp} / ${progression.xpToNext} XP`}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div
              className="text-white text-xl font-bold tabular-nums"
              style={{ textShadow: '0 0 10px #9D4EDD' }}
            >
              {progression.level}
            </div>
            <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden relative">
              <div
                className="h-full transition-all"
                style={{
                  width: `${xpPct}%`,
                  background:
                    'linear-gradient(90deg, #9D4EDD 0%, #FF66CC 100%)',
                  boxShadow: '0 0 6px #FF66CC',
                }}
              />
            </div>
          </div>
          {progression.skillPoints > 0 && (
            <div
              className="text-[10px] mt-1 tracking-widest animate-pulse"
              style={{ color: '#FFD700', textShadow: '0 0 6px #FFD700' }}
            >
              ✦ 未分配技能点 {progression.skillPoints} · 按 C 打开技能树
            </div>
          )}
        </div>

        <div
          className="bg-black/60 border border-yellow-400/60 px-3 py-2 rounded backdrop-blur"
          style={{ boxShadow: '0 0 15px rgba(255,255,0,0.3)' }}
        >
          <div className="text-yellow-300 text-xs tracking-widest">最高分</div>
          <div
            className="text-yellow-200 text-2xl font-bold tabular-nums"
            style={{ textShadow: '0 0 10px #ff0' }}
          >
            {highScore.toString().padStart(6, '0')}
          </div>
        </div>

        <div
          className="bg-black/60 border border-pink-500/60 px-3 py-2 rounded backdrop-blur"
          style={{ boxShadow: '0 0 15px rgba(255,0,102,0.3)' }}
        >
          <div className="text-pink-400 text-xs tracking-widest">生命值</div>
          <div className="flex gap-1 mt-1 min-h-[16px]">
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
          </div>
        </div>

        {/* Revive tokens */}
        <div
          className="bg-black/60 border px-3 py-2 rounded backdrop-blur"
          style={{
            borderColor: reviveTokens > 0 ? 'rgba(255,170,0,0.7)' : 'rgba(100,100,100,0.5)',
            boxShadow:
              reviveTokens > 0
                ? '0 0 15px rgba(255,170,0,0.3)'
                : '0 0 8px rgba(60,60,60,0.3)',
          }}
        >
          <div
            className="text-xs tracking-widest"
            style={{ color: reviveTokens > 0 ? '#FFAA00' : '#888' }}
          >
            复活币
          </div>
          <div
            className="text-xl font-bold tabular-nums mt-0.5"
            style={{
              color: reviveTokens > 0 ? '#FFCC55' : '#666',
              textShadow: reviveTokens > 0 ? '0 0 10px #FFAA00' : 'none',
            }}
          >
            ✦ {reviveTokens}
          </div>
        </div>
      </div>

      {active.length > 0 && (
        <div className="self-center mt-auto mb-20 flex flex-col gap-1.5 items-stretch">
          {active.map((kind) => {
            const remaining = Math.max(0, powerups[kind] ?? 0);
            const pct = Math.min(100, (remaining / POWERUP_MAX_DURATION) * 100);
            const baseMark = (POWERUP_DURATION / POWERUP_MAX_DURATION) * 100;
            const color = powerupColor[kind];
            return (
              <div
                key={kind}
                className="bg-black/70 border px-4 py-1.5 rounded backdrop-blur"
                style={{
                  borderColor: color,
                  boxShadow: `0 0 15px ${color}`,
                  minWidth: 260,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs tracking-widest w-20" style={{ color }}>
                    {powerupLabel[kind]}
                  </span>
                  <div className="relative flex-1 h-2 bg-white/10 rounded overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: color,
                        boxShadow: `0 0 6px ${color}`,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-px bg-white/50"
                      style={{ left: `${baseMark}%` }}
                    />
                  </div>
                  <span
                    className="text-xs tabular-nums w-10 text-right"
                    style={{ color }}
                  >
                    {remaining.toFixed(1)}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
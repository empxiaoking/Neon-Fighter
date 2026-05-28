import type { Progression } from './types';
import { LEVEL_MAX, PARAGON_MAX } from './progression';

type Props = {
  score: number;
  highScore: number;
  progression: Progression;
};

/**
 * Right-side information panel. Holds scoring and progression — anything that
 * doesn't need to be glanced at while dodging is kept over here so the play
 * area stays clean.
 */
export default function RightPanel({ score, highScore, progression }: Props) {
  const xpPct =
    progression.xpToNext === Infinity
      ? 100
      : Math.min(100, (progression.xp / progression.xpToNext) * 100);

  return (
    <aside
      className="font-mono text-white flex flex-col gap-3 select-none"
      style={{ width: 220 }}
    >
      {/* Game title */}
      <div
        className="text-center py-2 border rounded"
        style={{
          borderColor: '#00FFFF99',
          background: 'rgba(0,0,0,0.55)',
          boxShadow: '0 0 14px #00FFFF44',
        }}
      >
        <div
          className="text-xl font-bold tracking-widest whitespace-nowrap"
          style={{
            color: '#00FFFF',
            textShadow: '0 0 8px #0ff, 0 0 18px #f0f',
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          霓虹战机
        </div>
      </div>

      {/* Score */}
      <Section title="当前得分" color="#00FFFF">
        <div
          className="text-2xl font-bold tabular-nums"
          style={{ color: '#0ff', textShadow: '0 0 10px #0ff' }}
        >
          {score.toString().padStart(6, '0')}
        </div>
      </Section>

      {/* High score */}
      <Section title="最高分" color="#FFFF00">
        <div
          className="text-xl font-bold tabular-nums"
          style={{ color: '#ff0', textShadow: '0 0 10px #ff0' }}
        >
          {highScore.toString().padStart(6, '0')}
        </div>
      </Section>

      {/* Level / XP */}
      <Section title="等级" color="#9D4EDD">
        <div className="flex items-baseline justify-between">
          <span
            className="text-2xl font-bold tabular-nums flex items-baseline gap-2"
            style={{ color: '#fff', textShadow: '0 0 10px #9D4EDD' }}
          >
            <span>Lv {progression.level}</span>
            {progression.level >= LEVEL_MAX && (
              <span
                className="text-[10px] font-bold tracking-widest px-1.5 py-0.5 rounded"
                style={{
                  color: '#000',
                  background: '#FFD700',
                  boxShadow: '0 0 8px #FFD700',
                }}
              >
                MAX
              </span>
            )}
          </span>
          <span className="text-[10px] text-white/70 tabular-nums">
            {progression.endless
              ? '无尽'
              : progression.xpToNext === Infinity
                ? 'MAX'
                : `${progression.xp}/${progression.xpToNext}`}
          </span>
        </div>
        <div className="mt-1 h-2 bg-white/10 rounded overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${xpPct}%`,
              background: 'linear-gradient(90deg, #9D4EDD 0%, #FF66CC 100%)',
              boxShadow: '0 0 6px #FF66CC',
            }}
          />
        </div>
        {progression.level >= LEVEL_MAX && (
          <div className="mt-2 flex items-baseline justify-between text-[10px]">
            <span className="text-white/70">巅峰</span>
            <span
              className="font-bold tabular-nums"
              style={{ color: '#B266FF', textShadow: '0 0 6px #B266FF' }}
            >
              {progression.paragonLevel}/{PARAGON_MAX}
              {progression.endless && (
                <span
                  className="ml-2 px-1 rounded"
                  style={{ background: '#B266FF', color: '#fff' }}
                >
                  无尽
                </span>
              )}
            </span>
          </div>
        )}
      </Section>

      {/* Controls hint */}
      <Section title="操作" color="#AAAAAA">
        <div className="text-[10px] leading-relaxed text-white/70 space-y-0.5">
          <div>
            <span className="text-yellow-300">↑↓←→</span> 移动
          </div>
          <div>
            <span className="text-yellow-300">空格</span> 射击
          </div>
          <div>
            <span className="text-yellow-300">1-4</span> 技能（可同时释放）
          </div>
          <div>
            <span className="text-yellow-300">C</span> 技能树
          </div>
        </div>
      </Section>
    </aside>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="border rounded px-3 py-2 backdrop-blur-sm"
      style={{
        borderColor: `${color}99`,
        background: 'rgba(0,0,0,0.55)',
        boxShadow: `0 0 10px ${color}33`,
      }}
    >
      <div className="text-[10px] tracking-widest mb-1" style={{ color }}>
        {title}
      </div>
      {children}
    </div>
  );
}
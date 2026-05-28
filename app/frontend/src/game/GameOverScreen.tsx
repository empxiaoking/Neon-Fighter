type Props = {
  score: number;
  highScore: number;
  isNewHigh: boolean;
  level: number;
  xp: number;
  xpToNext: number;
  reviveXpLoss: number;
  reviveTokens: number;
  onRevive: () => void;
  onRestart: () => void;
};

export default function GameOverScreen({
  score,
  highScore,
  isNewHigh,
  level,
  xp,
  xpToNext,
  reviveXpLoss,
  reviveTokens,
  onRevive,
  onRestart,
}: Props) {
  const xpPct = xpToNext === Infinity ? 100 : Math.min(100, (xp / xpToNext) * 100);
  const canRevive = reviveTokens > 0;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm font-mono px-4">
      <h1
        className="text-5xl md:text-6xl font-bold mb-4 tracking-widest"
        style={{
          color: '#FF0066',
          textShadow: '0 0 10px #FF0066, 0 0 20px #FF0066, 0 0 40px #FF0066',
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        游戏结束
      </h1>

      {isNewHigh && (
        <div
          className="text-yellow-300 text-2xl mb-4 animate-pulse"
          style={{ textShadow: '0 0 15px #ff0' }}
        >
          ★ 创造新纪录 ★
        </div>
      )}

      <div className="text-cyan-300 text-xl mb-2">
        本局得分：
        <span className="text-cyan-200 font-bold" style={{ textShadow: '0 0 10px #0ff' }}>
          {score.toString().padStart(6, '0')}
        </span>
      </div>

      <div className="text-yellow-300 text-lg mb-4">
        历史最高：
        <span style={{ textShadow: '0 0 10px #ff0' }}>
          {highScore.toString().padStart(6, '0')}
        </span>
      </div>

      {/* Level / XP summary */}
      <div
        className="border rounded px-4 py-2 mb-4 w-full max-w-sm"
        style={{
          borderColor: '#9D4EDD',
          boxShadow: '0 0 15px rgba(157,78,221,0.4)',
          background: 'rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-baseline justify-between text-xs tracking-widest mb-1">
          <span className="text-purple-300">当前等级</span>
          <span className="text-white/70 tabular-nums">
            {xp} / {xpToNext === Infinity ? 'MAX' : xpToNext} XP
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-white text-2xl font-bold tabular-nums"
            style={{ textShadow: '0 0 10px #9D4EDD' }}
          >
            {level}
          </span>
          <div className="flex-1 h-2 bg-white/10 rounded overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${xpPct}%`,
                background: 'linear-gradient(90deg, #9D4EDD 0%, #FF66CC 100%)',
                boxShadow: '0 0 6px #FF66CC',
              }}
            />
          </div>
        </div>
        <div className="text-[11px] text-orange-300 mt-2 tracking-wider">
          复活将损失 20% 当前经验
          {reviveXpLoss > 0 && (
            <span className="text-orange-200"> · 约 -{reviveXpLoss} XP</span>
          )}
        </div>
      </div>

      {/* Revive tokens indicator */}
      <div
        className="border rounded px-4 py-2 mb-6 w-full max-w-sm text-center"
        style={{
          borderColor: canRevive ? '#FFAA00' : '#555',
          boxShadow: canRevive
            ? '0 0 15px rgba(255,170,0,0.4)'
            : '0 0 10px rgba(60,60,60,0.3)',
          background: 'rgba(0,0,0,0.6)',
        }}
      >
        <div className="text-xs tracking-widest text-white/70 mb-1">复活币</div>
        <div className="flex items-center justify-center gap-2">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{
              color: canRevive ? '#FFAA00' : '#666',
              textShadow: canRevive ? '0 0 12px #FFAA00' : 'none',
            }}
          >
            ✦ {reviveTokens}
          </span>
        </div>
        <div className="text-[11px] text-white/50 mt-1 tracking-wider">
          开局 1 枚 · 40 / 55 / 65 / 75 级各获得 1 枚
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={onRevive}
          disabled={!canRevive}
          className={`px-6 py-3 border-2 text-base tracking-widest transition-all ${
            canRevive
              ? 'text-orange-200 hover:bg-orange-400/10 cursor-pointer'
              : 'text-gray-500 cursor-not-allowed opacity-60'
          }`}
          style={{
            borderColor: canRevive ? '#FFAA00' : '#555',
            boxShadow: canRevive
              ? '0 0 20px #FFAA00, inset 0 0 20px rgba(255,170,0,0.1)'
              : 'none',
            textShadow: canRevive ? '0 0 10px #FFAA00' : 'none',
          }}
        >
          {canRevive
            ? `✦ 复活（剩 ${reviveTokens} 枚 · -20% 经验）`
            : '✦ 复活币已用尽'}
        </button>

        <button
          onClick={onRestart}
          className="px-6 py-3 border-2 text-pink-300 text-base tracking-widest hover:bg-pink-400/10 transition-all"
          style={{
            borderColor: '#FF00FF',
            boxShadow: '0 0 20px #FF00FF, inset 0 0 20px rgba(255,0,255,0.1)',
            textShadow: '0 0 10px #FF00FF',
          }}
        >
          ↻ 重新开始（清空进度）
        </button>
      </div>

      <div className="mt-4 text-[11px] text-white/50 tracking-widest text-center max-w-md">
        复活：保留得分、等级与技能树加点，消耗一枚复活币
        <br />
        重新开始：一切归零（等级 · 技能 · 复活币）
      </div>
    </div>
  );
}
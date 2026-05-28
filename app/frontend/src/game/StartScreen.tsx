type Props = {
  onStart: () => void;
  highScore: number;
};

export default function StartScreen({ onStart, highScore }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm font-mono px-4">
      <h1
        className="text-5xl md:text-7xl font-bold mb-8 tracking-widest whitespace-nowrap"
        style={{
          color: '#00FFFF',
          textShadow:
            '0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #f0f, 0 0 60px #f0f',
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        霓虹战机
      </h1>

      <div className="text-cyan-300 text-sm mb-6 text-center space-y-2 max-w-md">
        <div>
          <span className="text-yellow-300">方向键 ↑ ↓ ← →</span> — 移动（仅方向键）
        </div>
        <div>
          <span className="text-yellow-300">空格</span> — 基础射击 ·
          <span className="text-yellow-300 ml-2">1 2 3</span> — 主动技能
        </div>
        <div>
          <span className="text-yellow-300">C</span> — 打开技能树 ·
          击杀获得经验 · 升级获得技能点（66 级解锁巅峰）
        </div>
        <div className="text-pink-400 mt-4">收集道具 · 解锁 3 个主动技能 · 刷新最高分</div>
      </div>

      {highScore > 0 && (
        <div className="text-yellow-300 mb-6 text-lg" style={{ textShadow: '0 0 10px #ff0' }}>
          最高分：{highScore.toString().padStart(6, '0')}
        </div>
      )}

      <button
        onClick={onStart}
        className="px-8 py-3 border-2 border-cyan-400 text-cyan-300 text-lg tracking-widest hover:bg-cyan-400/10 transition-all"
        style={{
          boxShadow: '0 0 20px #0ff, inset 0 0 20px rgba(0,255,255,0.1)',
          textShadow: '0 0 10px #0ff',
        }}
      >
        ► 开始游戏
      </button>

      <div className="mt-8 text-xs text-cyan-500/60 flex flex-wrap gap-4 justify-center max-w-md">
        <span>R = 连射（叠加 +30% 射速）</span>
        <span>S = 护盾（2 次格挡）</span>
        <span>» = 极速（+100% 移动）</span>
        <span>+ = 回血</span>
        <span>∞ = 零CD</span>
      </div>
    </div>
  );
}
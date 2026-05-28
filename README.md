# 霓虹战机 · Neon Fighter

赛博朋克风格俯视角弹幕射击游戏，融合暗黑4风格深度技能树系统。

## 本地开发

```bash
cd app/frontend
pnpm install
pnpm dev        # 启动开发服务器 (http://localhost:3000)
```

或直接双击 `启动游戏.bat` 选择模式。

## 生产构建

```bash
pnpm build      # 标准多文件构建 → dist/
```

## 部署到 GitHub Pages

### 自动部署（推荐）

1. 将代码推送到 GitHub 仓库
2. 进入仓库 → **Settings** → **Pages**
3. Source 选择 **GitHub Actions**
4. 每次推送 `main` 分支，`.github/workflows/deploy.yml` 会自动构建并部署

### 手动部署

```bash
# 本地构建（指定你的仓库名）
VITE_BASE=/你的仓库名/ pnpm build

# 将 dist/ 目录推送到 gh-pages 分支
npx gh-pages -d dist
```

## 项目结构

```
app/frontend/
├── public/404.html         # GitHub Pages SPA 路由回退
├── src/
│   ├── game/               # 游戏引擎 (Canvas 2D)
│   ├── pages/              # 页面组件
│   └── ...
├── index.html              # 入口 HTML
├── vite.config.ts          # 标准构建配置（多文件输出）
└── vite.standalone.config.ts  # 单文件构建配置（备用）
```

## 技术栈

- **构建**: Vite 5 + React 18 + TypeScript
- **渲染**: Canvas 2D（纯矢量绘制，零外部资源）
- **路由**: react-router-dom v6
- **样式**: Tailwind CSS 3 + shadcn/ui
- **部署**: GitHub Pages (GitHub Actions 自动部署)

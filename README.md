# 刘晖洋个人作品集

一个桌面 Web 优先的 3D 滚动个人作品集，用于展示刘晖洋在 AI / AIGC / Agent / 多模态工程方向的项目经历和技术能力。

## 项目亮点

- Three.js 程序化 3D 人物，随 Hero、About、能力区滚动发生位移、转身、镜头推进和灯光变化
- Lenis 平滑滚动 + GSAP ScrollTrigger 驱动的滚动叙事
- 横向 pinned project rail，用于展示 MoonAI、遥小绘、video_fast_clip、Qwen3-VL-Embedding 等项目
- Claude-inspired 视觉系统：warm cream canvas、muted coral、dark product surface、serif display、Inter body、JetBrains Mono 技术标签
- React 19 + TypeScript + Vite + Tailwind CSS 4

## 核心内容

- **Hero**：刘晖洋，AI 产品经理 / AI 算法工程师
- **About**：建筑学背景、AIGC 内容生产、Agent 工具链、全栈工程落地
- **What I Do**：AIGC 工作流、MCP / N8N / 飞书多维表格、ComfyUI 插件、LoRA / embedding、多模态视频 AI
- **Projects**：MoonAI 短剧 Agent 工作台、遥小绘飞书多维表格 AIGC 平台、video_fast_clip 自动混剪系统、Qwen3-VL-Embedding 微调、AIGC 课程与 SOP
- **Contact**：邮箱、电话、GitHub、RunningHub

## 技术栈

- React
- TypeScript
- Vite
- Tailwind CSS
- Three.js
- GSAP / ScrollTrigger
- Lenis
- lucide-react

## 本地运行

环境要求：

- Node.js 18+
- npm

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

构建生产版本：

```bash
npm run build
```

TypeScript 检查：

```bash
npm run lint
```

## 环境变量

项目包含 `.env.example`。当前前端作品集主体不依赖 Gemini API；如果后续接入 AI 能力，可复制为 `.env.local` 并配置：

```bash
GEMINI_API_KEY="your_api_key"
APP_URL="your_app_url"
```

## 参考设计

- 3D 人物滚动交互参考：<https://red1-for-hek.vercel.app/>
- 配色与字体系统参考：<https://getdesign.md/claude/design-md>

## 联系方式

- Email: `18379022106@163.com`
- Phone: `18379022106`
- GitHub: <https://github.com/qinghui316/moonaigc>
- RunningHub: <https://www.runninghub.cn/user-center/1907701705306169345>

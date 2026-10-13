import { galleryAssets } from './projectAssets';
import projectManifest from '../../assets/projects/project-manifest.json';
export type ProjectLink = { label: string; href: string; external: boolean };
export type ProjectItem = { id:string; title:string; titleLines?:string[]; position:string; description:string; tags:string[]; image:string; coverAlt:string; status:'live'|'case-study-building'; primaryLink?:ProjectLink; secondaryLinks:ProjectLink[] };
const [sayweaveCover,moonaiCover,eclCover,yaoxiaohuiCover,videoCover,embeddingCover,courseCover] = projectManifest.map(p=>galleryAssets[p.id].desktop);
const moonaiPromoVideoUrl=import.meta.env.VITE_MOONAI_PROMO_VIDEO_URL?.trim();
const moonaiFilmDemoVideoUrl=import.meta.env.VITE_MOONAI_FILM_DEMO_VIDEO_URL?.trim();
export const projects:ProjectItem[] = [

      {
        id: 'sayweave',
        title: 'Sayweave 随言',
        titleLines: ['Sayweave', '随言'],
        position: 'Windows 实时语音输入与口语整理工具',
        description: '把口述实时写入当前应用，衔接语音与键盘编辑，结合口语整理、专有词典和表达偏好，让说出的想法成为清晰、自然的文字。',
        tags: ['Tauri 2', 'React + TS', 'Rust', 'ASR', 'SQLite'],
        image: sayweaveCover,
        coverAlt: 'Sayweave 随言产品宣传图，展示实时输入、录音浮条和专有词典',
        status: 'live',
        primaryLink: { label: 'View live project', href: 'https://sayweave.top/', external: true },
        secondaryLinks: [{ label: 'GitHub', href: 'https://github.com/qinghui316/Sayweave', external: true }],
      },
      {
        id: 'moonai',
        title: 'MoonAI 短剧 Agent 工作台',
        titleLines: ['MoonAI 短剧', 'Agent 工作台'],
        position: 'AI 短剧创作平台 / 独立全栈开发并部署上线',
        description: '从剧本改编、镜头语言、分镜生成和参考图匹配，到视频合成，串起完整的 AI 短剧创作链路。',
        tags: ['React + TS', 'Node.js', 'Prisma', 'PostgreSQL', 'FFmpeg'],
        image: moonaiCover,
        coverAlt: 'MoonAI 短剧工作台宣传图，展示官网视频工作台、分镜和生成画面',
        status: 'live',
        primaryLink: { label: 'View live project', href: 'https://moonai.asia/', external: true },
        secondaryLinks: [
          { label: 'GitHub', href: 'https://github.com/qinghui316/moonaigc', external: true },
          ...(moonaiPromoVideoUrl
            ? [{ label: 'Promo video', href: moonaiPromoVideoUrl, external: true }]
            : []),
          ...(moonaiFilmDemoVideoUrl
            ? [{ label: 'Film demo', href: moonaiFilmDemoVideoUrl, external: true }]
            : []),
        ],
      },
      {
        id: 'beaver-code',
        title: 'Beaver Code',
        titleLines: ['Beaver Code'],
        position: '本地优先的 Agent 开发桌面工作台',
        description: '把 Codex、项目对话、文件、Terminal 和 Git 集成到同一个桌面工作台，支持直接与 Agent 开发，以及多 Agent 按规划、开发、测试和审查流程协作。',
        tags: ['Codex', 'Multi-Agent', 'AHO', 'Git'],
        image: eclCover,
        coverAlt: 'Beaver Code 宣传图，展示项目对话和多 Agent 开发协作',
        status: 'live',
        primaryLink: {
          label: 'View live project',
          href: 'https://beavercode.moonai.asia/',
          external: true,
        },
        secondaryLinks: [
          { label: 'GitHub', href: 'https://github.com/qinghui316/beaver-code', external: true },
        ],
      },
      {
        id: 'yaoxiaohui',
        title: '遥小绘飞书多维表格 AIGC 平台',
        titleLines: ['遥小绘飞书', '多维表格 AIGC 平台'],
        position: '团队内部 AIGC 操作平台',
        description: '把 ComfyUI、本地 API、RunningHub、爬虫和闭源接口封装成可批量调用的 MCP 工具与生产流程。',
        tags: ['Agent', 'MCP', 'ComfyUI', '飞书多维表格'],
        image: yaoxiaohuiCover,
        coverAlt: '遥小绘流程示意宣传图，展示多维表格、工具编排和批量生成产出',
        status: 'case-study-building',
        secondaryLinks: [],
      },
      {
        id: 'video-fast-clip',
        title: 'video_fast_clip 混剪系统',
        titleLines: ['video_fast_clip', '混剪系统'],
        position: '长视频到短视频成片的自动化流水线',
        description: '通过切片、质量过滤、聚类、代表片段选择和多模型理解，把长视频转化为可控的短视频生产流水线。',
        tags: ['Python', 'OpenCV', 'FFmpeg', 'Embedding', 'VLM'],
        image: videoCover,
        coverAlt: 'video_fast_clip 流程示意宣传图，展示原始视频、片段筛选、内容理解和成片输出',
        status: 'case-study-building',
        secondaryLinks: [],
      },
      {
        id: 'qwen-embedding',
        title: 'Qwen3-VL-Embedding 微调',
        titleLines: ['Qwen3-VL-Embedding', '微调'],
        position: '面向视频素材的多模态精细召回训练',
        description: '建设数据、训练与评测闭环，以 Recall、MRR 和 NDCG 驱动视频素材检索效果持续迭代。',
        tags: ['Qwen3-VL-8B', 'LoRA', 'Recall', 'MRR', 'NDCG'],
        image: embeddingCover,
        coverAlt: 'Qwen3-VL-Embedding 微调流程示意，展示视频检索样例及数据、训练、评测闭环',
        status: 'case-study-building',
        secondaryLinks: [],
      },
      {
        id: 'aigc-course',
        title: 'AIGC 课程与 SOP 建设',
        titleLines: ['AIGC 课程', '与 SOP 建设'],
        position: 'AI 课程主讲与可复用方法论沉淀',
        description: '把复杂 AI 工具拆成可教学、可复用、可落地的课程模块、操作流程与团队内容生产 SOP。',
        tags: ['AIGC', 'ComfyUI', 'Agent 应用', 'SOP'],
        image: courseCover,
        coverAlt: 'AIGC 课程内容示意宣传图，展示 AI 工作流课件、操作 SOP 和复用清单',
        status: 'case-study-building',
        secondaryLinks: [],
      },
    ];

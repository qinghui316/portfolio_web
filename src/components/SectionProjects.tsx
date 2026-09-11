import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, CircleDashed } from 'lucide-react';

import InfiniteProjectMenu, { type InfiniteMenuItem } from './projects/InfiniteProjectMenu';
import { projectAssets } from './projects/projectAssets';

const {
  atlas: atlasUrl,
  covers: {
    aigcCourse: courseCover,
    eclHarness: eclCover,
    moonai: moonaiCover,
    qwenEmbedding: embeddingCover,
    videoFastClip: videoCover,
    yaoxiaohui: yaoxiaohuiCover,
  },
} = projectAssets;

type ProjectStatus = 'live' | 'case-study-building';

type ProjectLink = {
  label: string;
  href: string;
  external: boolean;
};

type ProjectItem = InfiniteMenuItem & {
  titleLines?: string[];
  position: string;
  tags: string[];
  coverAlt: string;
  status: ProjectStatus;
  primaryLink?: ProjectLink;
  secondaryLinks: ProjectLink[];
};

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [query]);

  return matches;
};

export default function SectionProjects() {
  const moonaiPromoVideoUrl = import.meta.env.VITE_MOONAI_PROMO_VIDEO_URL?.trim();
  const moonaiFilmDemoVideoUrl = import.meta.env.VITE_MOONAI_FILM_DEMO_VIDEO_URL?.trim();
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuReady, setMenuReady] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const wideLayout = useMediaQuery('(min-width: 900px)');
  const desktopPointer = useMediaQuery('(min-width: 900px) and (pointer: fine)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const projects = useMemo<ProjectItem[]>(
    () => [
      {
        id: 'moonai',
        title: 'MoonAI 短剧 Agent 工作台',
        titleLines: ['MoonAI 短剧', 'Agent 工作台'],
        position: 'AI 短剧创作平台 / 独立全栈开发并部署上线',
        description: '从剧本改编、镜头语言、分镜生成和参考图匹配，到视频合成，串起完整的 AI 短剧创作链路。',
        tags: ['React + TS', 'Node.js', 'Prisma', 'PostgreSQL', 'FFmpeg'],
        image: moonaiCover,
        coverAlt: 'AI 影视创作工作台与分镜、时间轴构成的概念封面',
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
        id: 'ecl-harness',
        title: 'ECL Harness Engineer',
        titleLines: ['ECL Harness', 'Engineer'],
        position: 'AI Agent Harness 工程工具 / Codex Skill',
        description: '为代码仓库建立共享知识、Active Change、验证门禁和任务交接，让多个 Agent 能持续理解并可靠演进项目。',
        tags: ['Agent Harness', 'Codex Skill', 'ECL', 'CI Gate'],
        image: eclCover,
        coverAlt: '多 Agent、项目轨道与验证节点组成的 Harness 架构概念封面',
        status: 'live',
        primaryLink: {
          label: 'View on GitHub',
          href: 'https://github.com/qinghui316/ecl-harness-engineer',
          external: true,
        },
        secondaryLinks: [
          { label: 'Article', href: 'https://mp.weixin.qq.com/s/L4x5B-wmG8JEgaCXxuhe1w', external: true },
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
        coverAlt: '多维表格、工作流模块和批处理生产线组成的概念封面',
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
        coverAlt: '胶片、视频片段聚类和剪辑时间轴组成的概念封面',
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
        coverAlt: '媒体片段围绕向量空间聚类和召回的概念封面',
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
        coverAlt: '课程模块、流程图和操作工作台组成的概念封面',
        status: 'case-study-building',
        secondaryLinks: [],
      },
    ],
    [moonaiFilmDemoVideoUrl, moonaiPromoVideoUrl],
  );

  useEffect(() => {
    const canvas = document.createElement('canvas');
    setWebglAvailable(Boolean(canvas.getContext('webgl2')));
  }, []);

  const activeProject = projects[activeIndex];
  const useInteractiveMenu = desktopPointer && !reducedMotion && webglAvailable;

  const selectProject = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const openProject = useCallback(
    (index: number) => {
      const link = projects[index]?.primaryLink;
      if (!link) return;
      if (link.external) window.open(link.href, '_blank', 'noopener,noreferrer');
      else window.location.assign(link.href);
    },
    [projects],
  );

  const handleMenuReady = useCallback((ready: boolean) => {
    setMenuReady(ready);
  }, []);

  const handleProgressChange = useCallback((progress: number) => {
    stageRef.current?.style.setProperty('--project-progress', `${Math.max(0, Math.min(1, progress)) * 100}%`);
  }, []);

  const moveSelection = (offset: number) => {
    setActiveIndex(current => (current + offset + projects.length) % projects.length);
  };

  const staticStage = (hidden: boolean) => (
    <div className={`projects-static-stage ${hidden ? 'is-hidden' : ''}`}>
      {[-2, -1, 1, 2].map((offset, position) => {
        const index = (activeIndex + offset + projects.length) % projects.length;
        const project = projects[index];
        return (
          <button
            key={`${project.id}-${offset}`}
            type="button"
            className={`projects-static-lens is-edge is-edge-${position + 1}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`选择项目：${project.title}`}
          >
            <img src={project.image} alt="" />
          </button>
        );
      })}
      <button
        type="button"
        className="projects-static-lens is-center"
        onClick={() => openProject(activeIndex)}
        aria-label={activeProject.primaryLink ? `打开项目：${activeProject.title}` : activeProject.title}
      >
        <img src={activeProject.image} alt={activeProject.coverAlt} />
      </button>
    </div>
  );

  return (
    <section className="projects-section" id="projects" aria-labelledby="projects-title">
      <div className="projects-grid-overlay" aria-hidden="true" />

      <header className="projects-heading">
        <p>Selected systems</p>
        <h2 id="projects-title">Featured <em>Projects</em></h2>
      </header>

      <div
        ref={stageRef}
        className={`projects-stage ${isOrbiting ? 'is-orbiting' : ''}`}
        style={{ '--project-progress': `${(activeIndex / Math.max(1, projects.length - 1)) * 100}%` } as React.CSSProperties}
      >
        <div className="projects-orbit is-ready">
          {useInteractiveMenu ? (
            <>
              {staticStage(menuReady)}
              <div className={`projects-webgl ${menuReady ? 'is-ready' : ''}`}>
                <InfiniteProjectMenu
                  items={projects}
                  atlasUrl={atlasUrl}
                  activeIndex={activeIndex}
                  onActiveChange={selectProject}
                  onActivate={openProject}
                  onReady={handleMenuReady}
                  onMovementChange={setIsOrbiting}
                  onProgressChange={handleProgressChange}
                  restCameraDistance={3.8}
                  dragCameraDistance={4.8}
                  lensScale={0.47}
                />
              </div>
            </>
          ) : wideLayout ? (
            staticStage(false)
          ) : (
            <div className="projects-fallback" role="list" aria-label="项目列表">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  type="button"
                  role="listitem"
                  className={index === activeIndex ? 'is-active' : ''}
                  onClick={() => setActiveIndex(index)}
                  aria-label={`选择项目：${project.title}`}
                  aria-pressed={index === activeIndex}
                >
                  <img src={project.image} alt={project.coverAlt} />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="project-title-panel" aria-live="polite">
          <div className="project-stage-copy" key={`title-${activeProject.id}`}>
            <p className="project-position">{activeProject.position}</p>
            <h3 aria-label={activeProject.title}>
              {(activeProject.titleLines ?? [activeProject.title]).map(line => (
                <span
                  key={line}
                  aria-hidden="true"
                  className={`project-title-line ${line.length >= 17 ? 'is-long' : ''}`}
                >
                  {line}
                </span>
              ))}
            </h3>
          </div>
        </div>

        <aside className="project-detail-panel" aria-live="polite">
          <div className="project-detail-topline">
            <span>{String(activeIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
            <span className={`project-status is-${activeProject.status}`}>
              <i /> {activeProject.status === 'live' ? 'Live system' : 'Case study building'}
            </span>
          </div>
          <div className="project-stage-copy" key={`detail-${activeProject.id}`}>
            <p className="project-description">{activeProject.description}</p>
            <div className="project-tags" aria-label="技术标签">
              {activeProject.tags.map(tag => <span key={tag}>{tag}</span>)}
            </div>
          </div>
        </aside>

        <div className="project-stage-action">
          {activeProject.primaryLink ? (
            <a
              className="project-orbit-link"
              href={activeProject.primaryLink.href}
              target={activeProject.primaryLink.external ? '_blank' : undefined}
              rel={activeProject.primaryLink.external ? 'noreferrer' : undefined}
              aria-label={`${activeProject.primaryLink.label}：${activeProject.title}`}
              title={activeProject.primaryLink.label}
            >
              <ArrowUpRight aria-hidden="true" />
            </a>
          ) : (
            <span className="project-orbit-link is-disabled" aria-label="案例页面建设中">
              <CircleDashed aria-hidden="true" />
            </span>
          )}
        </div>

        {activeProject.secondaryLinks.length > 0 && (
          <div className="project-secondary-links">
            {activeProject.secondaryLinks.map(link => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
            ))}
          </div>
        )}

        <nav className="project-progress" aria-label="选择项目">
          <button type="button" onClick={() => moveSelection(-1)} aria-label="上一个项目" title="上一个项目">
            <ChevronLeft aria-hidden="true" />
          </button>
          <span className="project-progress-edge">01</span>
          <div className="project-progress-track">
            <i aria-hidden="true" />
            {projects.map((project, index) => (
              <button
                key={project.id}
                type="button"
                className={index === activeIndex ? 'is-active' : ''}
                onClick={() => setActiveIndex(index)}
                aria-label={`选择项目：${project.title}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              >
                <span />
              </button>
            ))}
          </div>
          <span className="project-progress-edge">06</span>
          <button type="button" onClick={() => moveSelection(1)} aria-label="下一个项目" title="下一个项目">
            <ChevronRight aria-hidden="true" />
          </button>
        </nav>
      </div>
    </section>
  );
}

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Project = {
  title: string;
  href?: string;
  demo?: string;
  position: string;
  desc: string;
  tags: string[];
  visual: "moonai" | "yaoxiaohui" | "video" | "embedding" | "course";
};

function ProjectVisual({ type }: { type: Project["visual"] }) {
  if (type === "moonai") {
    return (
      <div className="project-visual moonai-visual">
        <div className="mock-window">
          <div className="mock-topbar"><span /><span /><span /></div>
          <div className="mock-grid">
            <div className="mock-sidebar" />
            <div className="mock-script">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="mock-preview">
              <b>SHOT</b>
              <em>AI</em>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "yaoxiaohui") {
    return (
      <div className="project-visual flow-visual">
        {["Feishu", "MCP", "ComfyUI", "API"].map((label) => (
          <div key={label} className="flow-node">{label}</div>
        ))}
        <div className="flow-line flow-line-a" />
        <div className="flow-line flow-line-b" />
        <div className="flow-line flow-line-c" />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="project-visual timeline-visual">
        {Array.from({ length: 12 }).map((_, index) => (
          <span key={index} style={{ height: `${26 + (index % 4) * 18}px` }} />
        ))}
        <div className="timeline-chip">ASR + VLM + FFmpeg</div>
      </div>
    );
  }

  if (type === "embedding") {
    return (
      <div className="project-visual matrix-visual">
        {Array.from({ length: 36 }).map((_, index) => (
          <span key={index} className={index % 7 === 0 || index % 11 === 0 ? "is-hot" : ""} />
        ))}
        <div className="matrix-label">RECALL@K</div>
      </div>
    );
  }

  return (
    <div className="project-visual course-visual">
      {["SOP", "Demo", "ComfyUI", "Agent"].map((label, index) => (
        <div key={label} className="course-step">
          <span>{String(index + 1).padStart(2, "0")}</span>
          {label}
        </div>
      ))}
    </div>
  );
}

export default function SectionProjects() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const projects: Project[] = [
    {
      title: "MoonAI 短剧 Agent 工作台",
      href: "https://github.com/qinghui316/moonaigc",
      demo: "https://moonai.asia/",
      position: "AI 短剧创作平台 / 个人独立全栈开发并部署上线",
      desc: "从剧本改编、镜头语言、分镜生成、参考图匹配到视频合成，串起完整 AI 创作链路。",
      tags: ["React+TS", "Node.js", "Prisma", "PostgreSQL", "JWT", "FFmpeg"],
      visual: "moonai",
    },
    {
      title: "遥小绘飞书多维表格 AIGC 平台",
      position: "团队内部 AIGC 操作平台",
      desc: "把 ComfyUI、本地 API、RunningHub、爬虫和闭源接口封装成可批量调用的 MCP tool。",
      tags: ["Agent", "MCP", "ComfyUI", "飞书多维表格", "Python", "Local API"],
      visual: "yaoxiaohui",
    },
    {
      title: "video_fast_clip 混剪系统",
      position: "长视频到短视频成片的自动化流水线",
      desc: "通过切片、检索、理解、生成、合成，把长视频变成可控的短视频生产流水线。",
      tags: ["Python", "OpenCV", "FFmpeg", "Embedding", "KMeans", "VLM", "ASR"],
      visual: "video",
    },
    {
      title: "Qwen3-VL-Embedding 微调",
      position: "针对 video_fast_clip 的脚本精细召回训练",
      desc: "建设多模态召回训练闭环，用 Recall、MRR、NDCG 驱动视频素材检索效果迭代。",
      tags: ["Qwen3-VL-8B", "LoRA", "数据集构建", "Recall", "MRR", "NDCG"],
      visual: "embedding",
    },
    {
      title: "AIGC 课程与 SOP 建设",
      position: "AI 课程主讲老师与方法论沉淀",
      desc: "把复杂 AI 工具拆成可教学、可复用、可落地的课程结构和团队 SOP。",
      tags: ["AI 辅助设计", "ComfyUI", "Agent 应用", "vibe coding", "SOP"],
      visual: "course",
    },
  ];

  useEffect(() => {
    if (!containerRef.current || !trackRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let timeline: gsap.core.Timeline | null = null;

    const setupPin = () => {
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
      timeline = null;

      if (!trackRef.current) return;
      if (window.innerWidth <= 1024) {
        gsap.set(trackRef.current, { clearProps: "transform" });
        return;
      }

      const rightPadding = 160;
      const trackScrollDistance = Math.max(0, trackRef.current.scrollWidth - window.innerWidth + rightPadding);

      timeline = gsap.timeline({
        scrollTrigger: {
          id: "projects-rail",
          trigger: containerRef.current,
          start: "top top",
          end: `+=${trackScrollDistance}`,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(trackRef.current, {
        x: -trackScrollDistance,
        ease: "none",
      });
    };

    const timer = window.setTimeout(setupPin, 150);
    window.addEventListener("resize", setupPin);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", setupPin);
      timeline?.scrollTrigger?.kill();
      timeline?.kill();
    };
  }, []);

  return (
    <section className="projects-section bg-surface-dark text-on-dark overflow-hidden flex items-center" ref={containerRef} id="projects">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(204,120,92,0.16),transparent_24%),linear-gradient(90deg,rgba(24,23,21,1)_0%,rgba(24,23,21,0.6)_38%,rgba(24,23,21,1)_100%)]" />
      <div className="project-rail-heading">
        <p className="font-mono text-xs uppercase text-primary tracking-[0.26em] mb-4">Selected Systems</p>
        <h2 className="font-display text-5xl md:text-7xl leading-[0.9] text-on-dark">
          Featured<br /><span className="text-primary italic">Projects</span>
        </h2>
        <p className="font-mono text-xs uppercase text-on-dark-soft tracking-[0.24em] mt-6">Scroll to explore →</p>
      </div>

      <div className="project-track" ref={trackRef}>
        <div className="project-spacer" />
        {projects.map((proj, i) => (
          <article key={proj.title} className="project-card">
            <div className="project-card-inner">
              <div className="project-meta">
                <span>Project {String(i + 1).padStart(2, "0")}</span>
                <span>{proj.position}</span>
              </div>

              <ProjectVisual type={proj.visual} />

                <div>
                  <h3 className="font-display text-4xl md:text-5xl leading-[0.95] text-on-dark mb-5">
                    {proj.demo ? (
                      <a href={proj.demo} target="_blank" rel="noreferrer" className="transition-colors hover:text-primary">
                        {proj.title}
                      </a>
                    ) : (
                      proj.title
                    )}
                  </h3>
                  <p className="text-on-dark-soft leading-relaxed max-w-[520px]">{proj.desc}</p>
                </div>

              <div className="flex flex-wrap gap-2">
                {proj.tags.map((tag) => (
                  <span key={tag} className="dark-badge">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-5 font-mono text-xs uppercase tracking-[0.18em]">
                {proj.href && (
                  <a href={proj.href} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-active">
                    GitHub ↗
                  </a>
                )}
                {proj.demo && (
                  <a href={proj.demo} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-active">
                    Live Demo ↗
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}

        <div className="project-end">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary mb-5">Next</p>
          <h3 className="font-display text-5xl leading-none mb-8">Let's build<br />AI systems.</h3>
          <a href="#contact" className="btn-primary">Contact</a>
        </div>
      </div>
    </section>
  );
}

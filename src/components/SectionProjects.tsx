import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SectionProjects() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const projects = [
    {
      title: "MoonAI 短剧 Agent 工作台",
      href: "https://github.com/qinghui316/moonaigc",
      demo: "http://43.167.184.248:6402/",
      position: "AI 短剧创作平台 / 个人独立全栈开发并部署上线",
      desc: "证明候选人能独立完成 AI 产品从前端、后端、数据、AI 链路到部署上线。",
      tags: ["React+TS", "Node.js", "Express", "Prisma", "PostgreSQL", "JWT", "AI生图", "TTS", "FFmpeg"]
    },
    {
      title: "遥小绘飞书多维表格AIGC平台",
      position: "团队内部 AIGC 操作平台",
      desc: "解决 ComfyUI 和 AI 工具技术门槛高、工具复用困难的问题。证明候选人能把零散工具封装成标准化、可批量、可被 LLM 调用的生产系统。",
      tags: ["Agent", "MCP", "ComfyUI", "飞书多维表格", "Python", "Local API"]
    },
    {
      title: "video_fast_clip 混剪系统",
      position: "长视频到短视频成片的自动化流水线",
      desc: "把视频理解、检索、生成和工程稳定性组合成自动化生产链。",
      tags: ["Python", "OpenCV", "FFmpeg", "Embedding", "KMeans", "VLM", "LLM", "ASR"]
    },
    {
      title: "Qwen3-VL-Embedding 微调",
      position: "针对 video_fast_clip 的脚本精细召回训练",
      desc: "建设多模态召回训练闭环，证明候选人不仅会搭工具，也能参与模型训练、评估体系和可迭代基线建设。",
      tags: ["Qwen3-VL-8B", "LoRA", "数据集构建", "Recall", "MRR", "NDCG"]
    },
    {
      title: "AIGC 课程与 SOP 建设",
      position: "AI 课程主讲老师与方法论沉淀",
      desc: "证明候选人具备把复杂 AI 技术讲清楚、教会团队、沉淀流程的能力。",
      tags: ["AI 辅助设计", "ComfyUI", "Agent 应用", "vibe coding", "SOP"]
    }
  ];

  useEffect(() => {
    if (!containerRef.current || !trackRef.current) return;

    const setupPin = () => {
      const boxes = document.getElementsByClassName("project-card");
      if (!boxes.length) return;
      
      const containerLeft = containerRef.current!.getBoundingClientRect().left;
      const firstBoxRect = boxes[0].getBoundingClientRect();
      const parentWidth = window.innerWidth;
      
      // Calculate total width based on number of cards and their fixed width
      const trackScrollDistance = (firstBoxRect.width * boxes.length) - parentWidth + 120 + 80; // 120 padding-right, 80 padding-left

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: ".projects-section",
          start: "top top",
          end: `+=${trackScrollDistance}`,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      timeline.to(".project-track", {
        x: -trackScrollDistance,
        ease: "none"
      });
    };

    // Small delay to ensure styles are applied before calculating metrics
    const timer = setTimeout(setupPin, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section className="projects-section bg-surface-dark text-on-dark overflow-hidden flex items-center" ref={containerRef} id="projects">
      <div className="absolute top-16 left-24 z-10">
        <h2 className="text-display-lg text-on-dark mb-4">Featured<br/><span className="text-primary italic">Projects</span></h2>
        <p className="font-mono text-sm uppercase text-on-dark-soft tracking-wider">Scroll to explore →</p>
      </div>
      
      <div className="project-track" ref={trackRef} style={{ paddingTop: '20vh' }}>
        {projects.map((proj, i) => (
          <div key={i} className="project-card justify-center gap-8">
            <div className="font-mono text-primary text-xl uppercase">Project {(i + 1).toString().padStart(2, '0')}</div>
            <h3 className="text-3xl font-display font-medium leading-tight">{proj.title}</h3>
            
            <div className="space-y-4">
              <p className="font-sans font-medium text-white/90">{proj.position}</p>
              <p className="text-on-dark-soft leading-relaxed">{proj.desc}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {proj.tags.map((tag, j) => (
                <span key={j} className="font-mono text-xs text-on-dark bg-surface-dark-elevated px-3 py-1 rounded-full border border-surface-dark-soft">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              {proj.href && (
                <a href={proj.href} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-active font-medium flex items-center gap-2">
                  GitHub ↗
                </a>
              )}
              {proj.demo && (
                <a href={proj.demo} target="_blank" rel="noreferrer" className="text-primary hover:text-primary-active font-medium flex items-center gap-2">
                  Live Demo ↗
                </a>
              )}
            </div>
          </div>
        ))}
        {/* Final end block to signal completion */}
        <div className="flex-shrink-0 w-[400px] flex items-center justify-center p-20 border-r border-hairline/20">
          <div className="text-center">
            <h3 className="font-display text-3xl mb-6">Let's build something.</h3>
            <button className="bg-primary text-on-primary rounded-full px-8 py-3 w-full hover:bg-primary-active transition-colors">
              Contact Me
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

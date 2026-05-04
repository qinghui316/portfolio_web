import { useEffect, useRef } from 'react';

export default function SectionExperience() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const experiences = [
    {
      period: "2025.02 - 2026.04",
      company: "杭州遥望网络科技有限公司",
      role: "AI 算法工程师",
      desc: "参与 video_fast_clip AI 长视频自动混剪系统开发和 Qwen3-VL-Embedding 模型微调，搭建从长视频到短视频成片的自动化流水线。"
    },
    {
      period: "2025.10 - 2026.02",
      company: "杭州遥望网络科技有限公司",
      role: "AIGC 设计师",
      desc: "负责 AI 视觉内容生产全流程落地，包括 AIGC 漫剧、数字人口播、ComfyUI 工作流、ComfyUI 节点开发、LoRA 训练、N8N 工作流、飞书多维表格和项目 demo。"
    },
    {
      period: "长期合作",
      company: "上海一条网络科技有限公司",
      role: "AI 课程老师",
      desc: "负责 AIGC、AI 辅助设计、AI 智能体应用、ComfyUI、AI 应用开发和 vibe coding 课程。"
    },
    {
      period: "2024.09 - 2027.06",
      company: "南昌大学 211 双一流",
      role: "建筑学 / 硕士",
      desc: ""
    },
    {
      period: "2018.09 - 2023.06",
      company: "江西水利电力大学",
      role: "建筑学 / 本科",
      desc: ""
    }
  ];

  useEffect(() => {
    const timeline = timelineRef.current;
    const items = itemRefs.current.filter(Boolean);
    if (!timeline || items.length === 0) return;

    const motionQuery = window.matchMedia('(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let rafId = 0;

    const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

    const updateProgress = () => {
      if (!motionQuery.matches) {
        timeline.style.setProperty('--timeline-progress', '1');
        items.forEach((item) => item.style.setProperty('--item-progress', '1'));
        return;
      }

      const timelineRect = timeline.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const startLine = viewportHeight * 0.72;
      const endLine = viewportHeight * 0.28;
      const progress = clamp01((startLine - timelineRect.top) / Math.max(1, timelineRect.height + startLine - endLine));

      timeline.style.setProperty('--timeline-progress', progress.toFixed(4));

      items.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.top + itemRect.height / 2;
        const distance = Math.abs(itemCenter - viewportHeight * 0.52);
        const itemProgress = clamp01(1 - distance / (viewportHeight * 0.38));
        item.style.setProperty('--item-progress', itemProgress.toFixed(4));
      });
    };

    const tick = () => {
      updateProgress();
      rafId = window.requestAnimationFrame(tick);
    };

    tick();
    motionQuery.addEventListener('change', updateProgress);
    window.addEventListener('resize', updateProgress);

    return () => {
      window.cancelAnimationFrame(rafId);
      motionQuery.removeEventListener('change', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <section ref={sectionRef} id="experience" className="experience-section bg-canvas py-32 relative text-ink z-20 overflow-hidden">
      <div className="experience-top-fade" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-hairline" />
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary mb-5">Experience</p>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95] mb-6">
            My career &<br/> <span className="text-primary italic">education</span>
          </h2>
        </div>
        
        <div ref={timelineRef} className="experience-timeline relative mt-24">
          {/* Center timeline line */}
          <div className="experience-timeline-line hidden md:block absolute top-0 bottom-0" />
          <div className="experience-progress-orb hidden md:block" aria-hidden="true" />
          
          <div className="space-y-16">
            {experiences.map((exp, i) => (
              <div
                key={i}
                ref={(node) => {
                  itemRefs.current[i] = node;
                }}
                className={`experience-item relative flex flex-col md:flex-row items-center ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                
                {/* Center Dot */}
                <div className="experience-dot hidden md:block absolute left-1/2 top-1/2 rounded-full bg-primary shadow-[0_0_15px_rgba(204,120,92,0.6)]" />

                <div className={`experience-copy w-full md:w-1/2 ${i % 2 === 0 ? 'md:pl-16' : 'md:pr-16 text-left md:text-right'} mb-4 md:mb-0`}>
                  <h3 className="font-display text-2xl md:text-3xl font-medium mb-1">{exp.role}</h3>
                  <h4 className="font-mono text-sm text-primary mb-4 uppercase tracking-widest">{exp.company}</h4>
                </div>
                
                <div className={`experience-copy w-full md:w-1/2 ${i % 2 === 0 ? 'md:pr-16 text-left md:text-right' : 'md:pl-16'}`}>
                  <div className="experience-period font-display text-4xl md:text-5xl text-ink/20 font-medium mb-4">{exp.period.split(' - ')[0]}</div>
                  {exp.desc && <p className="text-body text-sm leading-relaxed max-w-sm inline-block text-left">{exp.desc}</p>}
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

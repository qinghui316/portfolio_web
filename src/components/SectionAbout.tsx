import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import AboutCharacterCard from './AboutCharacterCard';
import AboutLanyard from './AboutLanyard';
import { ABOUT_ASSETS as assets } from './about/aboutAssets';
import { BADGE_DROP } from './about/aboutMotion';
import { useAboutLifecycle } from './about/useAboutLifecycle';
import './about/about.css';

function ResumeContent() {
  const experiences = [
    { period: '2026.02–04', company: '杭州遥望', role: 'AI 算法工程师', summary: '构建 video_fast_clip 的质量过滤、Embedding 聚类与代表片段选择，并串联 ASR、VLM、LLM、TTS 与 FFmpeg。' },
    { period: '2025.10–2026.02', company: '杭州遥望', role: 'AIGC 设计师', summary: '负责漫剧与数字人口播生产，沉淀 ComfyUI、LoRA、N8N 工作流及内容 SOP。' },
    { period: '长期合作', company: '上海一条', role: 'AI 课程主讲老师', summary: '负责 AIGC、Agent、ComfyUI 与 AI 应用开发课程设计和授课。' },
  ];
  return (
    <article className="resume-content">
      <div className="resume-grid">
        <section className="open-source">
          <h3><span className="section-index">01</span> 核心开源贡献 <small>OPEN SOURCE</small></h3>
          <h4>ECL Harness Engineer</h4>
          <b>项目级 Agent 工程系统 · 独立开源</b>
          <p>为复杂项目建立共享知识、项目地图与变更记录；以 Structured Change 组织需求、任务和验收，支持多 Agent、多 Worktree 并行开发、验证与失败恢复。</p>
          <nav aria-label="开源贡献链接"><a href="https://github.com/qinghui316/ecl-harness-engineer" target="_blank" rel="noreferrer">GitHub / ECL</a><a href="https://github.com/sickn33/agentic-awesome-skills/pull/678" target="_blank" rel="noreferrer">PR #678 · 已收录</a></nav>
        </section>
        <section className="experience-list">
          <h3><span className="section-index">02</span> 工作经历 <small>EXPERIENCE</small></h3>
          {experiences.map(({ period, company, role, summary }) => (
            <div className="experience-row" key={`${period}-${role}`}>
              <div className="experience-meta"><time>{period}</time><span>·</span><b>{company}</b></div>
              <h4>{role}</h4><p>{summary}</p>
            </div>
          ))}
        </section>
      </div>
    </article>
  );
}

export default function SectionAbout() {
  const { section, near, visible, phase, entryCycle, foreground, reduced, settleEntrance, finishExit } = useAboutLifecycle();
  const dossier = useRef<HTMLDivElement>(null);
  const entrance = useRef<gsap.core.Timeline | null>(null);
  const lanyardActiveRef = useRef(false);
  const [lanyardActive, setLanyardActive] = useState(false);

  useLayoutEffect(() => {
    const element = dossier.current;
    if (!element) return;
    const context = gsap.context(() => {
      gsap.set(element, { autoAlpha: 0, y: -140, scale: 0.985, transformOrigin: '78% 0%' });
      entrance.current = gsap.timeline({
        paused: true,
        onComplete: settleEntrance,
        onReverseComplete: finishExit,
        onUpdate: () => {
          const active = (entrance.current?.progress() ?? 0) >= BADGE_DROP.triggerProgress;
          if (active !== lanyardActiveRef.current) {
            lanyardActiveRef.current = active;
            setLanyardActive(active);
          }
        },
      })
        .to(element, { autoAlpha: 1, duration: 0.14, ease: 'power1.out' }, 0)
        .to(element, { y: 12, scale: 1, duration: 0.44, ease: 'power3.out' }, 0)
        .to(element, { y: -5, duration: 0.14, ease: 'power1.inOut' })
        .to(element, { y: 0, duration: 0.18, ease: 'power1.out' });
    }, element);
    return () => { entrance.current = null; context.revert(); };
  }, [finishExit, settleEntrance]);

  useLayoutEffect(() => {
    const timeline = entrance.current;
    if (!timeline) return;
    if (reduced || phase === 'settled') timeline.progress(1).pause();
    else if (phase === 'entering') timeline.timeScale(1).play();
    else if (phase === 'exiting') timeline.timeScale(1.55).reverse();
    else timeline.progress(0).pause();
  }, [phase, reduced]);

  return <section ref={section} id="about" className={`about-section is-${phase}`} aria-labelledby="about-title">
    <div className="about-original-layout">
    <div className="about-process" aria-hidden="true"><div className="about-visual-anchor"><span>Process 01</span><div/></div></div>
    <div className="about-anchor about-copy">
      <div ref={dossier} className="dossier-layout" inert={phase !== 'settled' || undefined} aria-hidden={phase === 'hidden' || undefined}>
        <img className="dossier-spread" src={near ? assets.paper : undefined} alt="" aria-hidden="true"/>
        <img className="comic-backing" src={near ? assets.backing : undefined} alt="" aria-hidden="true"/>
        <header className="dossier-header">
          <span>LIU HUIYANG / DOSSIER 001</span><h2 id="about-title">ABOUT ME</h2>
          <p><span>AI 产品经理</span><span>AI 应用开发工程师</span></p>
        </header>
        <AboutCharacterCard load={near} reduced={reduced}/>
        <ResumeContent/>
        <AboutLanyard
          load={near}
          active={lanyardActive}
          running={lanyardActive && visible && foreground}
          entryCycle={entryCycle}
          reduced={reduced}
        />
      </div>
    </div>
    </div>
  </section>;
}

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { projects, type ProjectItem } from './projects/projectData';
import { firstProjectPreview, galleryAssets, galleryImageState, prepareProjectExperience, useGalleryAssetRevision } from './projects/projectAssets';
import { clampProgress, galleryDimensions, GALLERY_CONFIG, progressFromScroll, scrollFromProgress, selectedFromProgress } from './projects/galleryMath';
import './projects/ProjectGallery.css';

const ProjectGallery = lazy(() => import('./projects/ProjectGallery'));
const display = [
  { name: ['Sayweave', '随言'], position: '实时语音输入与口语整理', summary: '把口述写入当前应用，衔接语音与键盘编辑。结合口语整理、专有词典和表达偏好，让想法自然成文。' },
  { name: ['MoonAI 短剧', 'Agent 工作台'], position: '从剧本到成片的创作工作台', summary: '从剧本改编、镜头语言、分镜生成和参考图匹配，到视频合成，串起完整的 AI 短剧创作链路。' },
  { name: ['Beaver Code'], position: '本地优先的 Agent 开发工作台', summary: '把项目对话、文件、终端和 Git 放在同一工作台，让多个 Agent 按规划、开发、测试和审查协作。' },
  { name: ['遥小绘', 'AIGC 平台'], position: '团队内部的批量创作平台', summary: '把 ComfyUI、本地 API、RunningHub 与接口封装成工具，衔接飞书多维表格与批量内容生产。' },
  { name: ['video_fast_clip', '混剪系统'], position: '长视频到短视频的生产流水线', summary: '通过切片、质量过滤、聚类、代表片段选择和多模型理解，把长视频转化为可控的短视频生产流水线。' },
  { name: ['Qwen3-VL', 'Embedding 微调'], position: '面向视频素材的多模态召回', summary: '围绕视频素材检索建设数据、训练与评测闭环，用 Recall、MRR 和 NDCG 持续评估与迭代效果。' },
  { name: ['AIGC 课程', '与 SOP 建设'], position: '让方法成为可复用的工作流程', summary: '把复杂 AI 工具拆成可教学、可复用、可落地的课程模块、操作流程与团队内容生产 SOP。' },
];
type LenisWindow = Window & { __portfolioLenis?: { scrollTo: (target: number, options?: { immediate?: boolean; duration?: number; force?: boolean }) => void; resize: () => void } };
function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => { const media = window.matchMedia(query); const update = () => setMatches(media.matches); media.addEventListener('change', update); update(); return () => media.removeEventListener('change', update); }, [query]);
  return matches;
}
function ProjectLinks({ project }: { project: ProjectItem }) {
  const links = [...(project.primaryLink ? [{ ...project.primaryLink, label: '访问官网' }] : []), ...project.secondaryLinks];
  return <div className="gallery-links">{links.map((link, index) => <a key={index} href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener noreferrer' : undefined}>{({ 'Promo video': '宣传视频', 'Film demo': '成片演示' } as Record<string, string>)[link.label] ?? link.label}<ArrowUpRight size={16} /></a>)}</div>;
}
function Poster({ index, compact }: { index: number; compact: boolean }) {
  const project = projects[index], url = galleryAssets[project.id][compact ? 'mobile' : 'desktop'];
  const state = galleryImageState(url);
  return <span className="gallery-image-wrap" data-failed={state === 'failed'} style={index === 0 ? { backgroundImage: `url(${firstProjectPreview})` } : undefined}>
    {state === 'ready' && <img src={url} alt={project.coverAlt} width="1600" height="900" />}
    {state === 'failed' && <span className="gallery-image-error">图片暂不可用</span>}
  </span>;
}

export default function SectionProjects() {
  useGalleryAssetRevision();
  const compact = useMedia('(max-width: 899px), (pointer: coarse)');
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const [failed, setFailed] = useState(false), [ready, setReady] = useState(false), [near, setNear] = useState(() => window.location.hash === '#projects');
  const [progress, setProgress] = useState(0), [active, setActive] = useState(0), [exit, setExit] = useState(0);
  const section = useRef<HTMLElement>(null), stage = useRef<HTMLDivElement>(null), scroller = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0), metrics = useRef({ top: 0, height: 1 }), scrollFrame = useRef(0);
  const staticMode = compact || reduced || failed;
  const items = useMemo(() => projects.map(project => ({ id: project.id, title: project.title, image: galleryAssets[project.id].desktop })), []);
  const onReady = useCallback((value: boolean) => setReady(value), []);
  const onError = useCallback(() => { setFailed(true); setReady(false); }, []);
  const activate = useCallback((index: number) => { activeRef.current = index; setActive(index); }, []);
  const navigate = useCallback((value: number, immediate = false) => {
    const next = clampProgress(value, projects.length);
    if (staticMode) {
      const index = Math.round(next), list = scroller.current, node = list?.children[index] as HTMLElement | undefined;
      if (list && node) list.scrollTo({ left: node.offsetLeft - list.clientWidth / 2 + node.clientWidth / 2, behavior: reduced || immediate ? 'instant' : 'smooth' });
      activate(index); return;
    }
    const top = scrollFromProgress(next, metrics.current.top, metrics.current.height, projects.length);
    const lenis = (window as LenisWindow).__portfolioLenis;
    if (lenis) lenis.scrollTo(top, { immediate, duration: .7 });
    else window.scrollTo({ top, behavior: immediate ? 'instant' : 'smooth' });
  }, [staticMode, reduced, activate]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setNear(true); void prepareProjectExperience(activeRef.current); observer.disconnect(); } }, { rootMargin: '100% 0px' });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { if (near) void prepareProjectExperience(active); }, [near, active, compact]);
  useEffect(() => {
    const node = section.current, surface = stage.current;
    if (!node || !surface) return;
    let disposed = false;
    const update = () => {
      scrollFrame.current = 0;
      if (staticMode || disposed) return;
      const { top, height } = metrics.current;
      const next = progressFromScroll(window.scrollY, top, height, projects.length);
      setProgress(next); activate(selectedFromProgress(next, activeRef.current, projects.length));
      setExit(Math.max(0, Math.min(1, (window.scrollY - scrollFromProgress(projects.length - 1, top, height, projects.length)) / (height * GALLERY_CONFIG.releaseScreens))));
    };
    const scroll = () => { if (!scrollFrame.current) scrollFrame.current = requestAnimationFrame(update); };
    const layout = () => {
      metrics.current = { top: node.getBoundingClientRect().top + window.scrollY, height: surface.clientHeight };
      if (!staticMode) {
        const size = galleryDimensions(surface.clientWidth, surface.clientHeight);
        surface.style.setProperty('--poster-width', `${size.boardWidth}px`);
        surface.style.setProperty('--poster-height', `${size.boardHeight}px`);
        surface.style.setProperty('--poster-center', `${size.centerY}px`);
      }
      (window as LenisWindow).__portfolioLenis?.resize(); scroll();
    };
    const resize = new ResizeObserver(layout); resize.observe(node); resize.observe(surface); resize.observe(document.body);
    window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', layout);
    layout(); void document.fonts.ready.then(() => { if (!disposed) layout(); });
    return () => { disposed = true; resize.disconnect(); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', layout); cancelAnimationFrame(scrollFrame.current); scrollFrame.current = 0; };
  }, [staticMode, activate]);
  useEffect(() => {
    if (staticMode) { setReady(false); requestAnimationFrame(() => navigate(activeRef.current, true)); }
  }, [staticMode, navigate]);
  const current = projects[active], copy = display[active];
  useEffect(() => {
    if (!reduced) stage.current?.querySelectorAll('.gallery-copy-content').forEach(node => node.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }));
  }, [active, reduced]);
  return <section id="projects" ref={section} className={`product-gallery-section ${staticMode ? 'is-static' : ''}`} aria-labelledby="gallery-heading" data-active={active} style={{ '--gallery-screens': 1 + (projects.length - 1) * GALLERY_CONFIG.stepScreens + GALLERY_CONFIG.releaseScreens } as CSSProperties} onKeyDown={event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); navigate(activeRef.current + (event.key === 'ArrowLeft' ? -1 : 1)); }
  }}>
    <div ref={stage} className={`gallery-stage ${ready && !staticMode ? 'is-ready' : ''}`}>
      <h2 id="gallery-heading">作品</h2>
      {staticMode ? <div className="gallery-snap-list" ref={scroller} data-lenis-prevent onScroll={() => {
        cancelAnimationFrame(scrollFrame.current); scrollFrame.current = requestAnimationFrame(() => {
          scrollFrame.current = 0; const list = scroller.current; if (!list) return;
          let best = 0, distance = Infinity;
          Array.from(list.children).forEach((child, index) => { const item = child as HTMLElement; const delta = Math.abs(item.offsetLeft + item.clientWidth / 2 - list.scrollLeft - list.clientWidth / 2); if (delta < distance) { distance = delta; best = index; } });
          activate(best);
        });
      }}>{projects.map((project, index) => <article key={project.id} className="gallery-snap-item" aria-label={project.title} inert={active !== index}>
        <div className="gallery-poster"><Poster index={index} compact={compact} /></div>
        <div className="gallery-snap-copy"><h3>{project.title}</h3><p className="gallery-position">{display[index].position}</p><p>{display[index].summary}</p><ProjectLinks project={project} /></div>
      </article>)}</div> : <>
        <div className="gallery-static-poster" aria-hidden={ready}><Poster index={active} compact={false} /></div>
        {near && <Suspense fallback={null}><ProjectGallery items={items} progress={progress} activeIndex={active} exit={exit} onProgress={navigate} onReady={onReady} onError={onError} /></Suspense>}
        <div className="gallery-side-copy gallery-identity"><div className="gallery-copy-content"><h3 className={active === 4 || active === 5 ? 'is-technical' : ''}>{copy.name.map(line => <span key={line}>{line}</span>)}</h3><p>{copy.position}</p></div></div>
        <div className="gallery-side-copy gallery-description"><div className="gallery-copy-content"><p>{copy.summary}</p><ProjectLinks project={current} /></div></div>
      </>}
      <button className="gallery-arrow gallery-arrow-left" type="button" aria-label="上一个项目" title="上一个项目" disabled={active === 0} onClick={() => navigate(active - 1)}><ChevronLeft size={24} /></button>
      <button className="gallery-arrow gallery-arrow-right" type="button" aria-label="下一个项目" title="下一个项目" disabled={active === projects.length - 1} onClick={() => navigate(active + 1)}><ChevronRight size={24} /></button>
      <span className="sr-only" aria-live="polite">{current.title}</span>
    </div>
  </section>;
}

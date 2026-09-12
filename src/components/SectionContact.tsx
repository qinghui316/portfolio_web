import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type FocusEvent } from 'react';
import { ArrowDownToLine, ArrowUpRight, Mail, Phone } from 'lucide-react';
import resumePdf from '../assets/docs/liu-huiyang-ai-product-development.pdf';
import { contactAssets, getContactAssetState, subscribeContactAssetState, prepareContactEssentials, prepareContactInteractive } from './contact/contactAssets';
import { handArrow, type Point } from './contact/contactLayout';
import { deviceHitPath, inContactCorridor } from './contact/contactHit';
import { contactValues, resolveContactState, type ContactTarget } from './contact/contactState';
import './contact/contact.css';

const groups: ContactTarget[] = ['email', 'phone'];

async function copyValue(value: string) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(value); return; } catch { /* Try the local clipboard fallback. */ }
  }
  const previous = document.activeElement as HTMLElement | null;
  const field = document.createElement('textarea');
  field.value = value;
  field.style.cssText = 'position:fixed;left:-10000px;top:0';
  document.body.appendChild(field);
  try {
    field.select();
    if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
  } finally { field.remove(); previous?.focus({ preventScroll: true }); }
}

function HandLabel({ target }: { target: ContactTarget }) {
  const Icon = target === 'email' ? Mail : Phone;
  return <span className="contact-hand-label"><Icon aria-hidden="true" strokeWidth={1.25} />
    <svg viewBox="0 0 130 46" aria-hidden="true"><text x="3" y="35">{target === 'email' ? 'Email' : 'Phone'}</text></svg>
  </span>;
}

export default function SectionContact({ preloadEnabled = true }: { preloadEnabled?: boolean }) {
  const [hover, setHover] = useState<ContactTarget | null>(null);
  const [focus, setFocus] = useState<ContactTarget | null>(null);
  const [touch, setTouch] = useState<ContactTarget | null>(null);
  const [availability, setAvailability] = useState(getContactAssetState);
  const [visualAllowed, setVisualAllowed] = useState(false);
  const [compositing] = useState(() => typeof CSS !== 'undefined' && CSS.supports('mix-blend-mode','plus-lighter') ? 'additive' : 'discrete');
  const [hitPaths, setHitPaths] = useState<Record<ContactTarget,string>>({email:'',phone:''});
  const [feedback, setFeedback] = useState<{ target: ContactTarget; ok: boolean } | null>(null);
  const active = resolveContactState(focus, touch, hover);
  const section = useRef<HTMLElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const modality = useRef('keyboard');
  const cycle = useRef('idle');
  const mounted = useRef(true);
  const [paths, setPaths] = useState<{ target: ContactTarget; d: string; start: Point; end: Point }[]>([]);
  const sceneSettled = availability.essentials === 'ready' || availability.essentials === 'failed';

  useLayoutEffect(() => {
    const root = section.current;
    if (!root) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const bounds = root.getBoundingClientRect();
      const hitGeometry = Object.fromEntries(groups.map(target => {
        const device = root.querySelector<HTMLElement>(`.contact-device--${target}`)!.getBoundingClientRect();
        return [target,deviceHitPath(target,device.width,device.height)];
      })) as Record<ContactTarget,string>;
      setHitPaths(hitGeometry);
      if (bounds.width < 800) {
        groups.forEach(target => { const el = root.querySelector<HTMLElement>(`.contact-channel--${target}`)!; el.style.removeProperty('left'); el.style.removeProperty('top'); });
        setPaths([]); return;
      }
      const data = groups.map(target => {
        const channel = root.querySelector<HTMLElement>(`.contact-channel--${target}`)!;
        const group = channel.getBoundingClientRect();
        const value = channel.querySelector<HTMLElement>('.contact-hand-value')!.getBoundingClientRect();
        const device = root.querySelector<HTMLElement>(`.contact-device--${target}`)!.getBoundingClientRect();
        return { target, channel, group, value, device };
      });
      const next = data.map(({ target, channel, group, value, device }) => {
        const dx = device.left - bounds.left, dy = device.top - bounds.top;
        const valueX = value.left - group.left, valueBottom = value.bottom - group.top;
        const end = target === 'email'
          ? { x: dx + device.width * .5, y: dy + device.height * .58 - 10 }
          : { x: dx + device.width * .755 + 10, y: dy + device.height * .47 };
        const desiredX = target === 'email' ? end.x - 108 - value.width - valueX : Math.max(end.x + 108, dx + device.width * .97 + 24);
        const x = Math.max(32, Math.min(bounds.width - group.width - 32, desiredX));
        let y = end.y - 84 - valueBottom;
        if (target === 'email' && bounds.width >= 1200) y -= 24;
        if (target === 'phone' && x < dx + device.width * .97 + 20) y = Math.min(y, dy + device.height * .37 - group.height - 32);
        y = Math.max(100, y);
        const start = { x: x + valueX + (target === 'email' ? value.width + 16 : -16), y: y + valueBottom - 8 };
        channel.style.left = `${x}px`; channel.style.top = `${y}px`;
        return { target, start, end, d: handArrow(start, end, target === 'email' ? 1 : -1) };
      });
      setPaths(next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    root.querySelectorAll('.contact-channel, .contact-device').forEach(el => observer.observe(el));
    document.fonts.addEventListener('loadingdone', schedule);
    void document.fonts.ready.then(schedule); schedule();
    return () => { disposed = true; observer.disconnect(); cancelAnimationFrame(frame); document.fonts.removeEventListener('loadingdone', schedule); };
  }, []);

  useEffect(() => {
    const root = section.current;
    if (!root || !preloadEnabled) return;
    const near = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void prepareContactEssentials('high').then(prepareContactInteractive);
    }, { rootMargin: '100% 0px' });
    const visible = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!performance.getEntriesByName('contact:visible').length) performance.mark('contact:visible');
        if (sceneSettled && !performance.getEntriesByName('contact:presented').length) performance.mark('contact:presented');
      }
    });
    near.observe(root); visible.observe(root);
    return () => { near.disconnect(); visible.disconnect(); };
  }, [preloadEnabled, sceneSettled]);

  // Freeze asset eligibility at activation, so late decoding cannot change an ongoing hover.
  useEffect(() => {
    if (active !== cycle.current) {
      cycle.current = active;
      setVisualAllowed(active !== 'idle' && getContactAssetState()[active] === 'ready');
    }
  }, [active]);

  useEffect(() => {
    mounted.current = true;
    const unsubscribe = subscribeContactAssetState(setAvailability);
    const keyboard = () => { modality.current = 'keyboard'; };
    const reset = () => {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = undefined;
      setHover(null); setFocus(null); setTouch(null);
    };
    const keydown = (event: KeyboardEvent) => {
      keyboard();
      if (event.key === 'Escape' && section.current?.contains(event.target as Node)) reset();
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('blur', reset);
    return () => {
      mounted.current = false; unsubscribe(); clearTimeout(hoverTimer.current); clearTimeout(copyTimer.current);
      window.removeEventListener('keydown', keydown); window.removeEventListener('blur', reset);
    };
  }, []);

  const enter = (event: PointerEvent, target: ContactTarget) => {
    if (event.pointerType !== 'mouse') return;
    clearTimeout(hoverTimer.current); hoverTimer.current = undefined; setHover(target);
  };
  const scheduleClose = () => {
    if (hoverTimer.current !== undefined) return;
    hoverTimer.current = setTimeout(() => { hoverTimer.current = undefined; setHover(null); },120);
  };
  const leave = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    scheduleClose();
  };
  const trackCorridor = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse' || hover === null) return;
    if ((event.target as Element).closest('.contact-device-hit:not(:disabled), .contact-channel')) return;
    const route = paths.find(path => path.target === hover);
    const bounds = section.current?.getBoundingClientRect();
    if (route && bounds && inContactCorridor({x:event.clientX-bounds.left,y:event.clientY-bounds.top},route.start,route.end,hover==='email'?1:-1)) {
      clearTimeout(hoverTimer.current); hoverTimer.current = undefined;
    } else scheduleClose();
  };
  const onFocus = (target: ContactTarget) => { if (modality.current === 'keyboard') setFocus(target); };
  const onBlur = (event: FocusEvent) => {
    if (modality.current !== 'keyboard') { setFocus(null); return; }
    const next = (event.relatedTarget as HTMLElement | null)?.closest<HTMLElement>('[data-channel]')?.dataset.channel;
    setFocus(next === 'email' || next === 'phone' ? next : null);
  };
  const copy = async (target: ContactTarget) => {
    if (modality.current === 'touch' && touch !== target) { setTouch(target); return; }
    try { await copyValue(contactValues[target]); if (mounted.current) setFeedback({ target, ok: true }); }
    catch { if (mounted.current) setFeedback({ target, ok: false }); }
    if (mounted.current) { clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setFeedback(null), 2400); }
  };

  return <section ref={section} className="contact-section" id="contact" aria-labelledby="contact-title" data-state={active}
    onPointerMove={trackCorridor} onPointerLeave={leave}
    onPointerDownCapture={event => { modality.current = event.pointerType; setFocus(null); }}>
    <header className="contact-heading"><h2 id="contact-title">Contact</h2></header>
    <div className="contact-terrain" aria-hidden="true">
      {sceneSettled && availability.terrain === 'ready' && <img src={contactAssets.terrain} alt="" />}
    </div>
    <div className="contact-composition">
      {groups.map(target => {
        const selected = active === target;
        const open = selected && visualAllowed;
        const source = contactAssets[target];
        return <div className={`contact-device contact-device--${target}`} key={target} data-open={open} data-channel={target}>
          <div className="contact-device-shadow" aria-hidden="true" />
          <div className="contact-device-images" data-compositing={compositing} aria-hidden="true">
            {sceneSettled && availability[`${target}Closed`] === 'ready' && <img src={source.closed} alt="" className="contact-device-closed" />}
            {availability[target] === 'ready' && <img src={source.open} alt="" className="contact-device-open" />}
          </div>
          <button type="button" className="contact-device-hit" disabled={!sceneSettled || availability[`${target}Closed`] !== 'ready'} aria-label={target === 'email' ? '开合邮件数据舱' : '开合电话通信舱'} aria-pressed={selected}
            style={{clipPath:hitPaths[target] ? `path('${hitPaths[target]}')` : 'inset(100%)'}}
            onPointerEnter={e => enter(e, target)} onPointerLeave={leave} onFocus={() => onFocus(target)} onBlur={onBlur}
            onClick={event => {
              if (modality.current === 'mouse') return;
              if (event.detail === 0) { setFocus(null); }
              setTouch(current => current === target ? null : target);
            }} />
          <svg className="contact-device-focus" aria-hidden="true"><path d={hitPaths[target]} /></svg>
        </div>;
      })}
      {groups.map(target => {
        const selected = active === target;
        return <div key={target} className={`contact-channel contact-channel--${target}`} data-active={selected} data-channel={target}
          onPointerEnter={e => enter(e, target)} onPointerLeave={leave}>
          <button className="contact-copy" type="button" aria-label={`复制${target === 'email' ? '邮箱' : '电话'} ${contactValues[target]}`}
            onFocus={() => onFocus(target)} onBlur={onBlur} onClick={() => void copy(target)}>
            <span className="contact-lettering-box">
            <span className="contact-default-lettering" aria-hidden="true"><HandLabel target={target} /><span className="contact-hand-value">{contactValues[target]}</span></span>
            <span className="contact-active-lettering" aria-hidden="true">
              <span className="contact-embossed-title">{target === 'email' ? 'Email' : 'Phone'}</span>
              <span className="contact-embossed-value" data-value={contactValues[target]}>{contactValues[target]}</span>
              <i className="contact-signal-tick" />
            </span>
            </span>
            <span className="contact-copy-label">{feedback?.target === target ? (feedback.ok ? 'COPIED / 已复制' : '复制失败，请选择下方文字') : '复制 / Copy'}</span>
          </button>
          {feedback?.target === target && !feedback.ok && <input className="contact-manual-copy" readOnly aria-label="可手动复制的联系方式" value={contactValues[target]} onFocus={e => e.currentTarget.select()} />}
        </div>;
      })}
      <svg className="contact-arrows" aria-hidden="true" style={{ visibility: sceneSettled ? 'visible' : 'hidden' }}>{paths.map(path => <path key={path.target} className={active === path.target ? 'is-active' : ''} data-channel={path.target} data-start-x={path.start.x} data-start-y={path.start.y} data-end-x={path.end.x} data-end-y={path.end.y} d={path.d} />)}</svg>
    </div>
    <footer className="contact-links">
      <span>© {new Date().getFullYear()} Liu Huiyang</span>
      <nav aria-label="联系与资料链接">
        <a href="https://github.com/qinghui316" target="_blank" rel="noreferrer">GitHub <ArrowUpRight /></a>
        <a href="https://www.runninghub.cn/user-center/1907701705306169345" target="_blank" rel="noreferrer">RunningHub <ArrowUpRight /></a>
        <a href={resumePdf} download="刘晖洋_AI产品与应用开发.pdf">Download resume <ArrowDownToLine /></a>
      </nav>
      <span className="contact-footer-status"><i /> Let's build something.</span>
    </footer>
    <p className="contact-live-region" aria-live="polite">{feedback ? (feedback.ok ? '联系方式已复制' : '复制失败，可以选择联系方式手动复制') : ''}</p>
  </section>;
}

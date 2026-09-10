import { useCallback, useEffect, useRef, useState } from 'react';
import { getAboutEntryAction } from './aboutMotion';

export type AboutPhase = 'hidden' | 'entering' | 'settled' | 'exiting';

type PortfolioWindow = Window & {
  __portfolioLenis?: {
    scrollTo: (target: number, options?: { immediate?: boolean }) => void;
    start: () => void;
    stop: () => void;
  };
};

export function useAboutLifecycle() {
  const section = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false), [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<AboutPhase>(() => location.hash === '#about' ? 'settled' : 'hidden');
  const [entryCycle, setEntryCycle] = useState(() => location.hash === '#about' ? 1 : 0);
  const phaseRef = useRef(phase);
  const [foreground, setForeground] = useState(!document.hidden);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const commitPhase = useCallback((next: AboutPhase) => {
    const previous = phaseRef.current;
    if (previous === next) return;
    if (previous === 'hidden' && (next === 'entering' || next === 'settled')) {
      setEntryCycle(value => value + 1);
    }
    phaseRef.current = next;
    setPhase(next);
  }, []);
  const settleEntrance = useCallback(() => commitPhase('settled'), [commitPhase]);
  const finishExit = useCallback(() => commitPhase('hidden'), [commitPhase]);

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 1200px) and (pointer: fine)');
    let lastScrollY = window.scrollY;
    let suppressNavigationScrollUntil = 0;
    const preload = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setNear(true); }, { rootMargin: '100% 0px' });
    const presence = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (!desktop.matches && entry.intersectionRatio >= 0.2 && phaseRef.current === 'hidden') commitPhase('settled');
    }, { threshold: [0, 0.2] });
    const motion = () => { setReduced(mq.matches); if (mq.matches) commitPhase('settled'); };
    const hash = () => {
      if (location.hash !== '#about') return;
      suppressNavigationScrollUntil = performance.now() + 600;
      setNear(true);
      commitPhase('settled');
      requestAnimationFrame(() => { lastScrollY = window.scrollY; });
    };
    const visibility = () => setForeground(!document.hidden);
    const evaluateEntry = () => {
      const currentScrollY = window.scrollY;
      const direction = Math.sign(currentScrollY - lastScrollY);
      const bounds = element.getBoundingClientRect();
      lastScrollY = currentScrollY;

      if (!desktop.matches || mq.matches) return;
      if (performance.now() < suppressNavigationScrollUntil) return;
      const currentPhase = phaseRef.current;
      if (direction < 0 && bounds.top > 24 && (currentPhase === 'entering' || currentPhase === 'settled')) {
        commitPhase('exiting');
        return;
      }
      if (currentPhase === 'exiting' && direction > 0 && bounds.top <= 24 && bounds.bottom > 0) {
        commitPhase('entering');
        return;
      }
      if (currentPhase !== 'hidden') return;

      const action = getAboutEntryAction(bounds.top, bounds.bottom, direction, true, false, false);
      if (action === 'wait') return;
      if (action === 'settle') {
        commitPhase('settled');
        return;
      }

      commitPhase('entering');
      const sectionTop = bounds.top + currentScrollY;
      const lenis = (window as PortfolioWindow).__portfolioLenis;
      if (lenis?.scrollTo) lenis.scrollTo(sectionTop, { immediate: true });
      else window.scrollTo({ top: sectionTop });
    };
    const restore = () => requestAnimationFrame(evaluateEntry);
    preload.observe(element); presence.observe(element); motion(); hash();
    window.addEventListener('hashchange', hash); window.addEventListener('pageshow', hash);
    window.addEventListener('pageshow', restore); window.addEventListener('scroll', evaluateEntry, { passive: true });
    document.addEventListener('visibilitychange', visibility); mq.addEventListener('change', motion);
    return () => {
      preload.disconnect(); presence.disconnect(); window.removeEventListener('hashchange', hash);
      window.removeEventListener('pageshow', hash); window.removeEventListener('pageshow', restore);
      window.removeEventListener('scroll', evaluateEntry); document.removeEventListener('visibilitychange', visibility); mq.removeEventListener('change', motion);
    };
  }, [commitPhase]);

  useEffect(() => {
    if (phase !== 'entering') return;
    const downKeys = new Set(['ArrowDown', 'PageDown', ' ', 'End']);
    const upKeys = new Set(['ArrowUp', 'PageUp', 'Home']);
    const lenis = (window as PortfolioWindow).__portfolioLenis;
    const bounds = section.current?.getBoundingClientRect();
    const sectionTop = bounds ? bounds.top + window.scrollY : window.scrollY;
    lenis?.scrollTo(sectionTop, { immediate: true });
    lenis?.stop();
    const releaseUpward = () => {
      lenis?.start();
      commitPhase('exiting');
    };
    const blockDownWheel = (event: WheelEvent) => {
      if (event.deltaY > 0) event.preventDefault();
      else if (event.deltaY < 0) releaseUpward();
    };
    const blockDownKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (downKeys.has(event.key)) event.preventDefault();
      else if (upKeys.has(event.key)) releaseUpward();
    };
    window.addEventListener('wheel', blockDownWheel, { passive: false, capture: true });
    window.addEventListener('keydown', blockDownKey, true);
    const fallback = window.setTimeout(settleEntrance, 900);
    return () => {
      lenis?.start();
      window.removeEventListener('wheel', blockDownWheel, true);
      window.removeEventListener('keydown', blockDownKey, true);
      window.clearTimeout(fallback);
    };
  }, [phase, commitPhase, settleEntrance]);

  return { section, near, visible, phase, entryCycle, foreground, reduced, settleEntrance, finishExit };
}

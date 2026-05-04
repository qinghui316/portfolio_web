import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LOCAL_POSTER = '/media/scroll/scroll-work-poster.webp';
const LOCAL_DEV_2K_VIDEO = '/media/scroll/scroll-work-2k.mp4?v=scroll-work-v1';
const LOCAL_DEV_1080_VIDEO = '/media/scroll/scroll-work-1080.mp4?v=scroll-work-v1';
const SEEK_INTERVAL_MS = 1000 / 30;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const isDesktopMotionAllowed = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(min-width: 768px)').matches &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};

const shouldUse2KVideo = () => {
  if (typeof window === 'undefined') return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;

  if (connection?.saveData) return false;
  if (connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) return false;

  return window.innerWidth >= 1280 && window.devicePixelRatio <= 2;
};

type NarrativeState = {
  time: number;
  opacity: number;
  x: number;
  y: number;
  scale: number;
  shade: number;
  heroContentOpacity: number;
  heroVideoOpacity: number;
  mode: 'scrub' | 'dwell' | 'hidden';
};

type PortfolioWindow = Window & {
  __portfolioLenis?: {
    scrollTo: (target: number, options?: { duration?: number; easing?: (value: number) => number }) => void;
  };
};

const DWELL_LOOP_START = 6.35;
const DWELL_LOOP_END = 8.72;
const SNAP_IDLE_MS = 200;
const SNAP_MIN_DISTANCE = 36;

const mapHeroProgressToTime = (progress: number) => {
  if (progress < 0.12) {
    return 0;
  }

  if (progress < 0.36) {
    return lerp(0, 0.5, smoothstep(0.12, 0.36, progress));
  }

  if (progress < 0.7) {
    return lerp(0.5, 1.083, smoothstep(0.36, 0.7, progress));
  }

  return lerp(1.083, 2.292, smoothstep(0.7, 1, progress));
};

const createState = (state: Partial<NarrativeState>): NarrativeState => ({
  time: 0,
  opacity: 0,
  x: 0,
  y: 0,
  scale: 1,
  shade: 0,
  heroContentOpacity: 1,
  heroVideoOpacity: 1,
  mode: 'scrub',
  ...state,
});

const getNarrativeMetrics = (scrollY: number) => {
  const hero = document.querySelector<HTMLElement>('.hero-section');
  const about = document.querySelector<HTMLElement>('.about-section');
  const what = document.querySelector<HTMLElement>('.what-i-do-section');
  const experience = document.querySelector<HTMLElement>('#experience, .experience-section');
  const projects = document.querySelector<HTMLElement>('#projects');

  if (!hero || !about || !what) return null;

  const heroTop = hero.getBoundingClientRect().top + scrollY;
  const aboutTop = about.getBoundingClientRect().top + scrollY;
  const whatTop = what.getBoundingClientRect().top + scrollY;
  const experienceTop = experience
    ? experience.getBoundingClientRect().top + scrollY
    : null;
  const projectsTop = projects
    ? projects.getBoundingClientRect().top + scrollY
    : what.getBoundingClientRect().bottom + scrollY;
  const narrativeEndTop = experienceTop ?? projectsTop;
  const workEntryStart = aboutTop + (whatTop - aboutTop) * 0.45;
  const whatExitStart = Math.min(
    narrativeEndTop - window.innerHeight * 0.28,
    whatTop + window.innerHeight * 0.72,
  );

  return {
    heroTop,
    aboutTop,
    whatTop,
    experienceTop,
    projectsTop,
    narrativeEndTop,
    workEntryStart,
    whatExitStart: Math.max(whatTop + window.innerHeight * 0.42, whatExitStart),
  };
};

const mapScrollToState = (scrollY: number): NarrativeState => {
  const metrics = getNarrativeMetrics(scrollY);
  if (!metrics) return createState({});

  const { heroTop, aboutTop, whatTop, narrativeEndTop, workEntryStart, whatExitStart } = metrics;

  if (scrollY < aboutTop) {
    const progress = clamp01((scrollY - heroTop) / Math.max(1, aboutTop - heroTop));
    const visualProgress = smoothstep(0.12, 1, progress);
    const contentFade = 1 - smoothstep(0.12, 0.36, progress);
    return createState({
      time: mapHeroProgressToTime(progress),
      opacity: lerp(0, 0.92, visualProgress),
      x: lerp(0, -8, smoothstep(0.36, 1, progress)),
      y: lerp(0, -1, smoothstep(0.36, 1, progress)),
      scale: lerp(1, 1.03, smoothstep(0.36, 1, progress)),
      shade: lerp(0, 0.24, visualProgress),
      heroContentOpacity: contentFade,
      heroVideoOpacity: 1 - smoothstep(0.12, 0.7, progress),
    });
  }

  if (scrollY < workEntryStart) {
    return createState({
      time: 2.292,
      opacity: 0.84,
      x: -8,
      y: -1,
      scale: 1.03,
      shade: 0.24,
      heroContentOpacity: 0,
      heroVideoOpacity: 0,
    });
  }

  if (scrollY < whatTop) {
    const progress = clamp01((scrollY - workEntryStart) / Math.max(1, whatTop - workEntryStart));
    const motion = smoothstep(0, 1, progress);
    return createState({
      time: lerp(2.292, DWELL_LOOP_START, motion),
      opacity: 0.94,
      x: lerp(-8, -18, motion),
      y: lerp(-1, 2.4, motion),
      scale: lerp(1.03, 0.82, motion),
      shade: lerp(0.24, 0.18, motion),
      heroContentOpacity: 0,
      heroVideoOpacity: 0,
    });
  }

  if (scrollY < whatExitStart) {
    return createState({
      time: DWELL_LOOP_START,
      opacity: 0.92,
      x: -18,
      y: 2.4,
      scale: 0.82,
      shade: 0.18,
      heroContentOpacity: 0,
      heroVideoOpacity: 0,
      mode: 'dwell',
    });
  }

  if (scrollY < narrativeEndTop) {
    const progress = clamp01((scrollY - whatExitStart) / Math.max(1, narrativeEndTop - whatExitStart));
    return createState({
      time: DWELL_LOOP_START,
      opacity: 0.92 * (1 - smoothstep(0, 0.78, progress)),
      x: -18,
      y: 2.4,
      scale: 0.82,
      shade: 0.18,
      heroContentOpacity: 0,
      heroVideoOpacity: 0,
      mode: progress < 0.4 ? 'dwell' : 'hidden',
    });
  }

  return createState({
    time: DWELL_LOOP_START,
    opacity: 0,
    x: -18,
    y: 2.4,
    scale: 0.82,
    shade: 0.18,
    heroContentOpacity: 0,
    heroVideoOpacity: 0,
    mode: 'hidden',
  });
};

export default function NarrativeVideoLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const stateRef = useRef<NarrativeState>(createState({}));
  const lastWheelDeltaRef = useRef(0);
  const wheelDeltaRef = useRef(0);
  const snapTimerRef = useRef<number | null>(null);
  const snappingRef = useRef(false);
  const loopModeRef = useRef(false);
  const lastPlayAttemptRef = useRef(0);
  const [canUseMotion, setCanUseMotion] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const posterUrl = import.meta.env.VITE_SCROLL_WORK_POSTER_URL || LOCAL_POSTER;
  const videoUrl = useMemo(() => {
    if (typeof window === 'undefined' || !canUseMotion) return '';

    const source = shouldUse2KVideo()
      ? import.meta.env.VITE_SCROLL_WORK_VIDEO_2K_URL || import.meta.env.VITE_SCROLL_WORK_VIDEO_1080_URL
      : import.meta.env.VITE_SCROLL_WORK_VIDEO_1080_URL || import.meta.env.VITE_SCROLL_WORK_VIDEO_2K_URL;

    return source || (import.meta.env.DEV ? (shouldUse2KVideo() ? LOCAL_DEV_2K_VIDEO : LOCAL_DEV_1080_VIDEO) : '');
  }, [canUseMotion]);

  useEffect(() => {
    const updateMode = () => setCanUseMotion(isDesktopMotionAllowed());
    updateMode();

    const queries = [
      window.matchMedia('(min-width: 768px)'),
      window.matchMedia('(pointer: fine)'),
      window.matchMedia('(prefers-reduced-motion: reduce)'),
    ];

    queries.forEach((query) => query.addEventListener('change', updateMode));
    return () => queries.forEach((query) => query.removeEventListener('change', updateMode));
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    const video = videoRef.current;
    const hero = document.querySelector<HTMLElement>('.hero-section');
    const what = document.querySelector<HTMLElement>('.what-i-do-section');
    const experience = document.querySelector<HTMLElement>('#experience, .experience-section');

    if (!layer || !video || !hero || !what || !canUseMotion || !videoUrl || videoFailed) return;

    let rafId = 0;
    let lastSeekAt = 0;

    const applyState = () => {
      const state = mapScrollToState(window.scrollY);
      stateRef.current = state;
      targetTimeRef.current = state.time;
      layer.style.setProperty('--narrative-opacity', state.opacity.toFixed(3));
      layer.style.setProperty('--narrative-x', `${state.x.toFixed(2)}vw`);
      layer.style.setProperty('--narrative-y', `${state.y.toFixed(2)}vh`);
      layer.style.setProperty('--narrative-scale', state.scale.toFixed(3));
      layer.style.setProperty('--narrative-shade', state.shade.toFixed(3));
      layer.dataset.mode = state.mode;
      document.documentElement.style.setProperty('--hero-exit-opacity', state.heroContentOpacity.toFixed(3));
      document.documentElement.style.setProperty('--hero-scrub-opacity', state.heroVideoOpacity.toFixed(3));
    };

    const getSnapPoints = () => {
      const metrics = getNarrativeMetrics(window.scrollY);
      if (!metrics) return [];
      const heroSpan = metrics.aboutTop - metrics.heroTop;
      return [
        metrics.heroTop,
        metrics.heroTop + heroSpan * 0.36,
        metrics.heroTop + heroSpan * 0.7,
        metrics.aboutTop,
        metrics.workEntryStart,
        metrics.whatTop,
        metrics.whatExitStart,
        metrics.narrativeEndTop,
      ].filter((point, index, points) => index === 0 || Math.abs(point - points[index - 1]) > 32);
    };

    const snapToNearestPoint = () => {
      if (snappingRef.current) return;
      const points = getSnapPoints();
      if (!points.length) return;

      const current = window.scrollY;
      const catchDistance = window.innerHeight * 0.32;
      const direction = Math.sign(wheelDeltaRef.current || lastWheelDeltaRef.current);
      const ranked = points
        .map((point) => ({ point, distance: Math.abs(point - current) }))
        .sort((a, b) => a.distance - b.distance);
      let target = ranked[0].point;

      if (ranked[0].distance > catchDistance && direction !== 0) {
        const directionalPoint = direction > 0
          ? points.find((point) => point > current + 24)
          : [...points].reverse().find((point) => point < current - 24);
        target = directionalPoint ?? target;
      }

      if (target === undefined || Math.abs(target - current) < SNAP_MIN_DISTANCE) return;

      snappingRef.current = true;
      const lenis = (window as PortfolioWindow).__portfolioLenis;
      if (lenis?.scrollTo) {
        lenis.scrollTo(target, {
          duration: 0.34,
          easing: (value) => 1 - Math.pow(1 - value, 3),
        });
      } else {
        window.scrollTo({ top: target, behavior: 'smooth' });
      }

      window.setTimeout(() => {
        snappingRef.current = false;
        lastWheelDeltaRef.current = 0;
        wheelDeltaRef.current = 0;
      }, 430);
    };

    const scheduleSnap = () => {
      if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = window.setTimeout(snapToNearestPoint, SNAP_IDLE_MS);
    };

    const onWheel = (event: WheelEvent) => {
      const metrics = getNarrativeMetrics(window.scrollY);
      if (!metrics) return;

      const inNarrativeRange =
        window.scrollY > metrics.heroTop - 8 &&
        window.scrollY < metrics.narrativeEndTop - 8;

      if (!inNarrativeRange) return;
      if (window.scrollY <= metrics.heroTop + 8 && event.deltaY < 0) return;

      lastWheelDeltaRef.current = event.deltaY;
      wheelDeltaRef.current += event.deltaY;
      if (Math.abs(wheelDeltaRef.current) < 72) return;
      if (!snappingRef.current) scheduleSnap();
    };

    window.addEventListener('wheel', onWheel, { passive: true });

    const trigger = ScrollTrigger.create({
      id: 'shared-narrative-video',
      trigger: hero,
      start: 'top top',
      endTrigger: experience ?? what,
      end: 'top top',
      scrub: 0.8,
      invalidateOnRefresh: true,
      onUpdate: applyState,
      onRefresh: applyState,
      onEnter: applyState,
      onEnterBack: applyState,
    });

    const render = (timestamp: number) => {
      applyState();

      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      const state = stateRef.current;

      if (duration && state.mode === 'dwell') {
        if (!loopModeRef.current) {
          const shouldReset =
            video.currentTime < DWELL_LOOP_START ||
            video.currentTime >= DWELL_LOOP_END ||
            Math.abs(video.currentTime - DWELL_LOOP_START) > 0.35;
          if (shouldReset) video.currentTime = DWELL_LOOP_START;
          currentTimeRef.current = video.currentTime;
          loopModeRef.current = true;
        }

        if (video.paused && timestamp - lastPlayAttemptRef.current > 500) {
          lastPlayAttemptRef.current = timestamp;
          void video.play().catch(() => {
            loopModeRef.current = false;
          });
        }

        if (video.currentTime >= DWELL_LOOP_END || video.currentTime < DWELL_LOOP_START - 0.02) {
          video.currentTime = DWELL_LOOP_START;
        }
        currentTimeRef.current = video.currentTime;

        rafId = requestAnimationFrame(render);
        return;
      }

      if (loopModeRef.current) {
        video.pause();
        loopModeRef.current = false;
        currentTimeRef.current = video.currentTime;
      }

      if (state.mode === 'hidden') {
        video.pause();
      }

      const targetTime = duration ? Math.min(targetTimeRef.current, duration - 1 / 24) : targetTimeRef.current;
      currentTimeRef.current += (targetTime - currentTimeRef.current) * 0.28;

      if (
        duration &&
        timestamp - lastSeekAt >= SEEK_INTERVAL_MS &&
        Math.abs(video.currentTime - currentTimeRef.current) > 0.016
      ) {
        video.currentTime = currentTimeRef.current;
        lastSeekAt = timestamp;
      }

      rafId = requestAnimationFrame(render);
    };

    applyState();
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      trigger.kill();
      window.removeEventListener('wheel', onWheel);
      if (snapTimerRef.current) window.clearTimeout(snapTimerRef.current);
      document.documentElement.style.removeProperty('--hero-exit-opacity');
      document.documentElement.style.removeProperty('--hero-scrub-opacity');
    };
  }, [canUseMotion, videoUrl, videoFailed]);

  if (!canUseMotion) return null;

  return (
    <div ref={layerRef} className={`narrative-video-layer ${videoReady ? 'has-video' : ''}`} aria-hidden="true">
      <img className="narrative-video-poster" src={posterUrl} alt="" draggable={false} />
      {videoUrl && !videoFailed && (
        <video
          ref={videoRef}
          className={`narrative-video ${videoReady ? 'is-ready' : ''}`}
          src={videoUrl}
          poster={posterUrl}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onLoadedMetadata={(event) => {
            event.currentTarget.pause();
            event.currentTarget.currentTime = 0;
            currentTimeRef.current = 0;
            targetTimeRef.current = 0;
          }}
          onCanPlay={() => {
            videoRef.current?.pause();
            setVideoReady(true);
            ScrollTrigger.refresh();
          }}
          onError={() => setVideoFailed(true)}
          onContextMenu={(event) => event.preventDefault()}
        />
      )}
      <div className="narrative-video-shade" />
    </div>
  );
}

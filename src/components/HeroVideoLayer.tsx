import { useEffect, useMemo, useRef, useState } from 'react';

const LOCAL_POSTER = '/media/hero/hero-poster.webp';
const LOCAL_DEV_SCRUB_2K_VIDEO = '/media/hero/hero-look-scrub-2k.mp4?v=two-source-no-anchor';
const LOCAL_DEV_SCRUB_1080_VIDEO = '/media/hero/hero-look-scrub-1080.mp4?v=two-source-no-anchor';
const CENTER_DEAD_ZONE = 0.03;
const SEEK_INTERVAL_MS = 1000 / 30;

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

export default function HeroVideoLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canShowVideo, setCanShowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const posterUrl = import.meta.env.VITE_HERO_POSTER_URL || LOCAL_POSTER;
  const videoUrl = useMemo(() => {
    const desktopAllowed = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
    if (!desktopAllowed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return '';

    const source = shouldUse2KVideo()
      ? import.meta.env.VITE_HERO_LOOK_SCRUB_2K_URL || import.meta.env.VITE_HERO_LOOK_SCRUB_1080_URL
      : import.meta.env.VITE_HERO_LOOK_SCRUB_1080_URL || import.meta.env.VITE_HERO_LOOK_SCRUB_2K_URL;

    return source || (import.meta.env.DEV ? (shouldUse2KVideo() ? LOCAL_DEV_SCRUB_2K_VIDEO : LOCAL_DEV_SCRUB_1080_VIDEO) : '');
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !isDesktopMotionAllowed()) return;

    const video = videoRef.current;
    if (!video) return;

    let rafId = 0;
    let targetProgress = 0.5;
    let currentProgress = 0.5;
    let lastSeekAt = 0;

    const onMouseMove = (event: MouseEvent) => {
      targetProgress = Math.min(1, Math.max(0, event.clientX / window.innerWidth));
    };

    const render = (timestamp: number) => {
      const nextTarget = Math.abs(targetProgress - 0.5) < CENTER_DEAD_ZONE ? 0.5 : targetProgress;
      currentProgress += (nextTarget - currentProgress) * 0.62;

      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      const targetTime = duration ? Math.min(Math.max(0, duration - 1 / 24), duration * currentProgress) : 0;

      if (duration && timestamp - lastSeekAt >= SEEK_INTERVAL_MS && Math.abs(video.currentTime - targetTime) > 0.025) {
        video.currentTime = targetTime;
        lastSeekAt = timestamp;
      }

      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setCanShowVideo(false);
    setVideoFailed(false);
    video.pause();
  }, [videoUrl]);

  return (
    <div
      ref={layerRef}
      className="hero-video-layer"
      onContextMenu={(event) => event.preventDefault()}
      aria-hidden="true"
    >
      <img className="hero-video-poster" src={posterUrl} alt="" draggable={false} />

      {videoUrl && !videoFailed && (
        <video
          ref={videoRef}
          className={`hero-video ${canShowVideo ? 'is-ready' : ''}`}
          src={videoUrl}
          poster={posterUrl}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onLoadedMetadata={(event) => {
            event.currentTarget.pause();
            event.currentTarget.currentTime = event.currentTarget.duration / 2;
          }}
          onCanPlay={() => {
            videoRef.current?.pause();
            setCanShowVideo(true);
          }}
          onError={() => setVideoFailed(true)}
          onContextMenu={(event) => event.preventDefault()}
        />
      )}
    </div>
  );
}

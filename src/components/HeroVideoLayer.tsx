import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getInitialPortfolioVideoUrls,
  getNextCandidateUrl,
  getPortfolioVideoManifest,
  isDesktopMotionAllowed,
} from '../lib/videoResources';

const CENTER_DEAD_ZONE = 0.03;
const SEEK_INTERVAL_MS = 1000 / 30;

type HeroVideoLayerProps = {
  onWarmupProgress?: (progress: number) => void;
  onWarmupComplete?: () => void;
};

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
};

const waitForVideoFrame = (video: HTMLVideoElement) =>
  new Promise<void>((resolve) => {
    const frameVideo = video as VideoWithFrameCallback;
    if (frameVideo.requestVideoFrameCallback) {
      frameVideo.requestVideoFrameCallback(() => resolve());
      return;
    }

    requestAnimationFrame(() => resolve());
  });

const seekTo = (video: HTMLVideoElement, time: number) =>
  new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    }, 1200);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };

    const handleSeeked = () => {
      if (settled) return;
      settled = true;
      cleanup();
      void waitForVideoFrame(video).then(resolve);
    };

    const handleError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Hero video seek failed'));
    };

    video.addEventListener('seeked', handleSeeked, { once: true });
    video.addEventListener('error', handleError, { once: true });
    video.currentTime = time;
  });

export default function HeroVideoLayer({ onWarmupProgress, onWarmupComplete }: HeroVideoLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canShowVideo, setCanShowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const manifest = useMemo(() => getPortfolioVideoManifest(), []);
  const initialUrls = useMemo(() => getInitialPortfolioVideoUrls(), []);
  const [posterUrl, setPosterUrl] = useState(initialUrls.heroPosterUrl);
  const [videoUrl, setVideoUrl] = useState(initialUrls.heroVideoUrl);
  const warmedUrlRef = useRef('');

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !isDesktopMotionAllowed() || !canShowVideo) return;

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
  }, [canShowVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setCanShowVideo(false);
    setVideoFailed(false);
    video.pause();
  }, [videoUrl]);

  const runWarmup = async (video: HTMLVideoElement) => {
    if (!videoUrl || warmedUrlRef.current === videoUrl) return;
    if (!isDesktopMotionAllowed()) {
      setCanShowVideo(true);
      warmedUrlRef.current = videoUrl;
      onWarmupComplete?.();
      return;
    }

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    if (!duration) return;

    warmedUrlRef.current = videoUrl;
    setCanShowVideo(false);
    onWarmupProgress?.(0);

    const safeEnd = Math.max(0, duration - 1 / 24);
    const points = [
      duration * 0.5,
      0,
      safeEnd,
      duration * 0.25,
      duration * 0.75,
      duration * 0.5,
    ];

    try {
      for (let index = 0; index < points.length; index += 1) {
        await seekTo(video, Math.min(safeEnd, Math.max(0, points[index])));
        onWarmupProgress?.((index + 1) / points.length);
      }

      video.pause();
      setCanShowVideo(true);
      onWarmupComplete?.();
    } catch {
      warmedUrlRef.current = '';
      handleVideoError();
    }
  };

  const handleVideoError = () => {
    const nextUrl = getNextCandidateUrl(manifest.heroVideo, videoUrl);
    if (nextUrl) {
      setCanShowVideo(false);
      setVideoFailed(false);
      warmedUrlRef.current = '';
      setVideoUrl(nextUrl);
      return;
    }

    setVideoFailed(true);
    onWarmupComplete?.();
  };

  return (
    <div
      ref={layerRef}
      className="hero-video-layer"
      onContextMenu={(event) => event.preventDefault()}
      aria-hidden="true"
    >
      <img
        className="hero-video-poster"
        src={posterUrl}
        alt=""
        draggable={false}
        onError={() => {
          if (posterUrl !== manifest.heroPoster.fallbackUrl) setPosterUrl(manifest.heroPoster.fallbackUrl);
        }}
      />

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
            void runWarmup(event.currentTarget);
          }}
          onCanPlay={() => videoRef.current?.pause()}
          onError={handleVideoError}
          onContextMenu={(event) => event.preventDefault()}
        />
      )}
    </div>
  );
}

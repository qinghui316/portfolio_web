import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getInitialPortfolioVideoUrls,
  getNextCandidateUrl,
  getPortfolioVideoManifest,
  isDesktopMotionAllowed,
} from '../lib/videoResources';

const CENTER_DEAD_ZONE = 0.03;
const SEEK_INTERVAL_MS = 1000 / 30;

export default function HeroVideoLayer() {
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [canShowVideo, setCanShowVideo] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const manifest = useMemo(() => getPortfolioVideoManifest(), []);
  const initialUrls = useMemo(() => getInitialPortfolioVideoUrls(), []);
  const [posterUrl, setPosterUrl] = useState(initialUrls.heroPosterUrl);
  const [videoUrl, setVideoUrl] = useState(initialUrls.heroVideoUrl);

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

  const handleVideoError = () => {
    const nextUrl = getNextCandidateUrl(manifest.heroVideo, videoUrl);
    if (nextUrl) {
      setCanShowVideo(false);
      setVideoFailed(false);
      setVideoUrl(nextUrl);
      return;
    }

    setVideoFailed(true);
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
            event.currentTarget.currentTime = event.currentTarget.duration / 2;
          }}
          onCanPlay={() => {
            videoRef.current?.pause();
            setCanShowVideo(true);
          }}
          onError={handleVideoError}
          onContextMenu={(event) => event.preventDefault()}
        />
      )}
    </div>
  );
}

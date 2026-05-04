import { useEffect, useState } from 'react';
import { getPortfolioVideoManifest, type VideoAsset } from '../lib/videoResources';

interface LoadingProps {
  onComplete: () => void;
}

const MAX_LOADING_MS = 10000;
const MIN_LOADING_MS = 1200;

const preloadImage = (asset: VideoAsset) =>
  new Promise<string>((resolve) => {
    const tryCandidate = (index: number) => {
      const url = asset.candidates[index];
      if (!url) {
        resolve(asset.fallbackUrl);
        return;
      }

      const image = new Image();
      image.onload = () => resolve(url);
      image.onerror = () => tryCandidate(index + 1);
      image.src = url;
    };

    tryCandidate(0);
  });

const preloadVideo = (asset: VideoAsset) =>
  new Promise<string>((resolve) => {
    const tryCandidate = (index: number) => {
      const url = asset.candidates[index];
      if (!url) {
        resolve('');
        return;
      }

      const video = document.createElement('video');
      let settled = false;
      const finish = (resolvedUrl: string) => {
        if (settled) return;
        settled = true;
        video.pause();
        video.removeAttribute('src');
        video.load();
        resolve(resolvedUrl);
      };

      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.oncanplay = () => finish(url);
      video.onloadeddata = () => finish(url);
      video.onerror = () => tryCandidate(index + 1);
      video.src = url;
      video.load();
    };

    tryCandidate(0);
  });

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function Loading({ onComplete }: LoadingProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [status, setStatus] = useState('Loading video system...');

  useEffect(() => {
    let cancelled = false;
    const manifest = getPortfolioVideoManifest();

    const preload = async () => {
      const timeout = delay(MAX_LOADING_MS);
      const minDelay = delay(MIN_LOADING_MS);
      const work = (async () => {
        if (!manifest.motionEnabled) {
          setStatus('Preparing static view...');
          const heroPosterUrl = await preloadImage(manifest.heroPoster);
          window.__portfolioVideoResources = {
            motionEnabled: false,
            heroPosterUrl,
            heroVideoUrl: '',
            scrollPosterUrl: manifest.scrollPoster.fallbackUrl,
            scrollVideoUrl: '',
          };
          return;
        }

        setStatus('Preloading hero video...');
        const heroPosterPromise = preloadImage(manifest.heroPoster);
        const scrollPosterPromise = preloadImage(manifest.scrollPoster);
        const heroVideoUrl = await preloadVideo(manifest.heroVideo);

        setStatus('Preloading work video...');
        const scrollVideoUrl = await preloadVideo(manifest.scrollVideo);
        const [heroPosterUrl, scrollPosterUrl] = await Promise.all([heroPosterPromise, scrollPosterPromise]);

        window.__portfolioVideoResources = {
          motionEnabled: true,
          heroPosterUrl,
          heroVideoUrl,
          scrollPosterUrl,
          scrollVideoUrl,
        };
      })();

      await Promise.race([work, timeout]);
      await minDelay;

      if (cancelled) return;
      if (!window.__portfolioVideoResources) {
        window.__portfolioVideoResources = {
          motionEnabled: manifest.motionEnabled,
          heroPosterUrl: manifest.heroPoster.fallbackUrl,
          heroVideoUrl: manifest.motionEnabled ? manifest.heroVideo.fallbackUrl : '',
          scrollPosterUrl: manifest.scrollPoster.fallbackUrl,
          scrollVideoUrl: manifest.motionEnabled ? manifest.scrollVideo.fallbackUrl : '',
        };
      }

      setIsExiting(true);
      window.setTimeout(() => {
        if (!cancelled) onComplete();
      }, 700);
    };

    void preload();

    return () => {
      cancelled = true;
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-surface-dark text-on-dark z-[100] flex flex-col justify-center overflow-hidden transition-opacity duration-700 ease-in-out ${isExiting ? "opacity-0" : "opacity-100"}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_34%,rgba(204,120,92,0.18),transparent_28%),radial-gradient(circle_at_82%_68%,rgba(93,184,166,0.08),transparent_24%)]" />
      <div className="flex whitespace-nowrap opacity-25 relative">
        <div className="animate-[marquee_20s_linear_infinite] flex gap-16 font-display text-7xl md:text-9xl uppercase">
          <span>AI PRODUCT MANAGER</span>
          <span>AIGC ENGINEER</span>
          <span>AGENT BUILDER</span>
          <span>MULTIMODAL RETRIEVAL</span>
        </div>
        <div className="animate-[marquee_20s_linear_infinite] flex gap-16 font-display text-7xl md:text-9xl uppercase ml-16">
          <span>AI PRODUCT MANAGER</span>
          <span>AIGC ENGINEER</span>
          <span>AGENT BUILDER</span>
          <span>MULTIMODAL RETRIEVAL</span>
        </div>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-sm uppercase tracking-[0.26em] text-on-dark-soft">
        {status}
      </div>
    </div>
  );
}

type ConnectionLike = {
  saveData?: boolean;
  effectiveType?: string;
};

export type VideoAsset = {
  candidates: string[];
  fallbackUrl: string;
};

export type PortfolioVideoManifest = {
  motionEnabled: boolean;
  quality: '2k' | '1080';
  heroPoster: VideoAsset;
  heroVideo: VideoAsset;
  scrollPoster: VideoAsset;
  scrollVideo: VideoAsset;
};

export type PortfolioResolvedVideos = {
  motionEnabled: boolean;
  heroPosterUrl: string;
  heroVideoUrl: string;
  scrollPosterUrl: string;
  scrollVideoUrl: string;
};

declare global {
  interface Window {
    __portfolioVideoResources?: PortfolioResolvedVideos;
  }
}

const HERO_POSTER_LOCAL = '/media/hero/hero-poster.webp';
const HERO_2K_LOCAL = '/media/hero/hero-look-scrub-2k.mp4?v=two-source-no-anchor';
const HERO_1080_LOCAL = '/media/hero/hero-look-scrub-1080.mp4?v=two-source-no-anchor';
const SCROLL_POSTER_LOCAL = '/media/scroll/scroll-work-poster.webp';
const SCROLL_2K_LOCAL = '/media/scroll/scroll-work-2k.mp4?v=scroll-work-v1';
const SCROLL_1080_LOCAL = '/media/scroll/scroll-work-1080.mp4?v=scroll-work-v1';

const cleanUrl = (url?: string) => {
  const value = url?.trim();
  return value || '';
};

const candidates = (...urls: string[]) => Array.from(new Set(urls.filter(Boolean)));

export const isDesktopMotionAllowed = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(min-width: 768px)').matches &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
};

export const shouldUse2KVideo = () => {
  if (typeof window === 'undefined') return false;
  const connection = (navigator as Navigator & { connection?: ConnectionLike }).connection;

  if (connection?.saveData) return false;
  if (connection?.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) return false;

  return window.innerWidth >= 1280 && window.devicePixelRatio <= 2;
};

export const getPortfolioVideoManifest = (): PortfolioVideoManifest => {
  const quality = shouldUse2KVideo() ? '2k' : '1080';
  const hero2K = cleanUrl(import.meta.env.VITE_HERO_LOOK_SCRUB_2K_URL);
  const hero1080 = cleanUrl(import.meta.env.VITE_HERO_LOOK_SCRUB_1080_URL);
  const scroll2K = cleanUrl(import.meta.env.VITE_SCROLL_WORK_VIDEO_2K_URL);
  const scroll1080 = cleanUrl(import.meta.env.VITE_SCROLL_WORK_VIDEO_1080_URL);

  const heroVideo = quality === '2k'
    ? candidates(hero2K, hero1080, HERO_2K_LOCAL, HERO_1080_LOCAL)
    : candidates(hero1080, hero2K, HERO_1080_LOCAL, HERO_2K_LOCAL);
  const scrollVideo = quality === '2k'
    ? candidates(scroll2K, scroll1080, SCROLL_2K_LOCAL, SCROLL_1080_LOCAL)
    : candidates(scroll1080, scroll2K, SCROLL_1080_LOCAL, SCROLL_2K_LOCAL);

  return {
    motionEnabled: isDesktopMotionAllowed(),
    quality,
    heroPoster: {
      candidates: candidates(cleanUrl(import.meta.env.VITE_HERO_POSTER_URL), HERO_POSTER_LOCAL),
      fallbackUrl: HERO_POSTER_LOCAL,
    },
    heroVideo: {
      candidates: heroVideo,
      fallbackUrl: quality === '2k' ? HERO_2K_LOCAL : HERO_1080_LOCAL,
    },
    scrollPoster: {
      candidates: candidates(cleanUrl(import.meta.env.VITE_SCROLL_WORK_POSTER_URL), SCROLL_POSTER_LOCAL),
      fallbackUrl: SCROLL_POSTER_LOCAL,
    },
    scrollVideo: {
      candidates: scrollVideo,
      fallbackUrl: quality === '2k' ? SCROLL_2K_LOCAL : SCROLL_1080_LOCAL,
    },
  };
};

export const getInitialPortfolioVideoUrls = () => {
  if (typeof window !== 'undefined' && window.__portfolioVideoResources) {
    return window.__portfolioVideoResources;
  }

  const manifest = getPortfolioVideoManifest();
  return {
    motionEnabled: manifest.motionEnabled,
    heroPosterUrl: manifest.heroPoster.candidates[0] || manifest.heroPoster.fallbackUrl,
    heroVideoUrl: manifest.motionEnabled ? manifest.heroVideo.candidates[0] || manifest.heroVideo.fallbackUrl : '',
    scrollPosterUrl: manifest.scrollPoster.candidates[0] || manifest.scrollPoster.fallbackUrl,
    scrollVideoUrl: manifest.motionEnabled ? manifest.scrollVideo.candidates[0] || manifest.scrollVideo.fallbackUrl : '',
  };
};

export const getNextCandidateUrl = (asset: VideoAsset, currentUrl: string) => {
  const currentIndex = asset.candidates.indexOf(currentUrl);
  if (currentIndex >= 0 && currentIndex < asset.candidates.length - 1) {
    return asset.candidates[currentIndex + 1];
  }

  if (currentUrl !== asset.fallbackUrl) {
    return asset.fallbackUrl;
  }

  return '';
};

export const preloadImageAsset = (asset: VideoAsset) =>
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

export const preloadVideoAsset = (asset: VideoAsset) =>
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

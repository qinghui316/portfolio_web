/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useState, useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import Cursor from './components/Cursor';
import Loading from './components/Loading';
import NarrativeVideoLayer from './components/NarrativeVideoLayer';
import SectionHero from './components/SectionHero';
import SectionAbout from './components/SectionAbout';
import SectionWhatIDo from './components/SectionWhatIDo';
import SectionExperience from './components/SectionExperience';
import SectionContact from './components/SectionContact';
import { getPortfolioVideoManifest, preloadImageAsset, preloadVideoAsset } from './lib/videoResources';

const SectionProjects = lazy(() => import('./components/SectionProjects'));
const BOOT_TIMEOUT_MS = 10000;
const MIN_LOADING_MS = 1200;

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExitingLoading, setIsExitingLoading] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [heroWarmupReady, setHeroWarmupReady] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootStatus, setBootStatus] = useState('Initializing video system...');
  const [bootTimedOut, setBootTimedOut] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const frameRef = useRef<number | null>(null);
  const loadingStartedAtRef = useRef(Date.now());

  const setProgress = useCallback((progress: number, status?: string) => {
    setBootProgress((current) => Math.max(current, Math.min(100, progress)));
    if (status) setBootStatus(status);
  }, []);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const lenis = new Lenis({
      duration: 1.7,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1.7,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;
    (window as Window & { __portfolioLenis?: Lenis }).__portfolioLenis = lenis;
    lenis.stop();

    function raf(time: number) {
      lenis.raf(time);
      frameRef.current = requestAnimationFrame(raf);
    }
    frameRef.current = requestAnimationFrame(raf);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as Window & { __portfolioLenis?: Lenis }).__portfolioLenis;
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      lenisRef.current?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      lenisRef.current?.start();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  useEffect(() => {
    let cancelled = false;
    const manifest = getPortfolioVideoManifest();

    const preloadAssets = async () => {
      setProgress(8, 'Resolving media sources...');

      if (!manifest.motionEnabled) {
        const heroPosterUrl = await preloadImageAsset(manifest.heroPoster);
        if (cancelled) return;
        window.__portfolioVideoResources = {
          motionEnabled: false,
          heroPosterUrl,
          heroVideoUrl: '',
          scrollPosterUrl: manifest.scrollPoster.fallbackUrl,
          scrollVideoUrl: '',
        };
        setProgress(95, 'Preparing static view...');
        setAssetsReady(true);
        setHeroWarmupReady(true);
        return;
      }

      const heroPosterPromise = preloadImageAsset(manifest.heroPoster);
      const scrollPosterPromise = preloadImageAsset(manifest.scrollPoster);

      setProgress(20, 'Preloading hero video...');
      const heroVideoUrl = await preloadVideoAsset(manifest.heroVideo);
      if (cancelled) return;

      setProgress(55, 'Preloading work video...');
      const scrollVideoUrl = await preloadVideoAsset(manifest.scrollVideo);
      const [heroPosterUrl, scrollPosterUrl] = await Promise.all([heroPosterPromise, scrollPosterPromise]);
      if (cancelled) return;

      window.__portfolioVideoResources = {
        motionEnabled: true,
        heroPosterUrl,
        heroVideoUrl,
        scrollPosterUrl,
        scrollVideoUrl,
      };
      setProgress(75, 'Warming hero interaction...');
      setAssetsReady(true);
    };

    void preloadAssets().catch(() => {
      if (cancelled) return;
      window.__portfolioVideoResources = {
        motionEnabled: manifest.motionEnabled,
        heroPosterUrl: manifest.heroPoster.fallbackUrl,
        heroVideoUrl: manifest.motionEnabled ? manifest.heroVideo.fallbackUrl : '',
        scrollPosterUrl: manifest.scrollPoster.fallbackUrl,
        scrollVideoUrl: manifest.motionEnabled ? manifest.scrollVideo.fallbackUrl : '',
      };
      setProgress(75, 'Using local media fallback...');
      setAssetsReady(true);
    });

    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      setBootTimedOut(true);
      setProgress(98, 'Entering with available media...');
    }, BOOT_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [setProgress]);

  useEffect(() => {
    if (!isLoading || isExitingLoading) return;
    if (!bootTimedOut && (!assetsReady || !heroWarmupReady)) return;

    const elapsed = Date.now() - loadingStartedAtRef.current;
    const waitForMinimum = Math.max(0, MIN_LOADING_MS - elapsed);
    const finishTimer = window.setTimeout(() => {
      setProgress(100, 'Launching...');
      setIsExitingLoading(true);
      window.setTimeout(() => setIsLoading(false), 700);
    }, waitForMinimum);

    return () => window.clearTimeout(finishTimer);
  }, [assetsReady, bootTimedOut, heroWarmupReady, isExitingLoading, isLoading, setProgress]);

  return (
    <div className="bg-canvas min-h-screen text-ink overflow-x-hidden font-sans">
      {isLoading && <Loading progress={bootProgress} status={bootStatus} isExiting={isExitingLoading} />}

      <Cursor />

      <main
        id="main"
        className={`relative group ${isLoading ? 'pointer-events-none select-none' : ''}`}
        inert={isLoading ? '' : undefined}
      >
        <NarrativeVideoLayer />
        <SectionHero
          onHeroWarmupProgress={(progress) => {
            if (!assetsReady) return;
            setProgress(75 + progress * 20, 'Warming hero interaction...');
          }}
          onHeroWarmupComplete={() => {
            setProgress(95, 'Preparing first view...');
            setHeroWarmupReady(true);
          }}
        />
        <SectionAbout />
        <SectionWhatIDo />
        <SectionExperience />
        <Suspense fallback={<div className="min-h-screen bg-surface-dark" />}>
          <SectionProjects />
        </Suspense>
        <SectionContact />
      </main>
    </div>
  );
}

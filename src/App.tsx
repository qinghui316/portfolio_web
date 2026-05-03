/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy, useState, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import Cursor from './components/Cursor';
import Loading from './components/Loading';
import SectionHero from './components/SectionHero';
import SectionAbout from './components/SectionAbout';
import SectionWhatIDo from './components/SectionWhatIDo';
import SectionExperience from './components/SectionExperience';
import SectionContact from './components/SectionContact';

const Character3D = lazy(() => import('./components/Character3D'));
const SectionProjects = lazy(() => import('./components/SectionProjects'));

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const lenisRef = useRef<Lenis | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
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
    };
  }, []);

  useEffect(() => {
    if (!lenisRef.current) return;
    if (isLoading) {
      lenisRef.current.stop();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      lenisRef.current.start();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  return (
    <div className="bg-canvas min-h-screen text-ink overflow-x-hidden font-sans">
      {isLoading && <Loading onComplete={() => setIsLoading(false)} />}
      
      {!isLoading && (
        <>
          <Cursor />
          <Suspense fallback={null}>
            <Character3D />
          </Suspense>
          
          <main id="main" className="relative group">
            <SectionHero />
            <SectionAbout />
            <SectionWhatIDo />
            <SectionExperience />
            <Suspense fallback={<div className="min-h-screen bg-surface-dark" />}>
              <SectionProjects />
            </Suspense>
            <SectionContact />
          </main>
        </>
      )}
    </div>
  );
}

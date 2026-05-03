/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import Cursor from './components/Cursor';
import Loading from './components/Loading';
import Character3D from './components/Character3D';
import SectionHero from './components/SectionHero';
import SectionAbout from './components/SectionAbout';
import SectionWhatIDo from './components/SectionWhatIDo';
import SectionExperience from './components/SectionExperience';
import SectionProjects from './components/SectionProjects';
import SectionContact from './components/SectionContact';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.7,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      wheelMultiplier: 1.7,
      touchMultiplier: 2,
    });

    if (isLoading) {
      lenis.stop();
    } else {
      lenis.start();
    }

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Apply reduced motion preference override
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      lenis.destroy();
    }

    return () => {
      lenis.destroy();
    };
  }, [isLoading]);

  return (
    <div className="bg-canvas min-h-screen text-ink overflow-x-hidden font-sans">
      {isLoading && <Loading onComplete={() => setIsLoading(false)} />}
      
      {!isLoading && (
        <>
          <Cursor />
          <Character3D />
          
          <main id="main" className="relative group">
            <SectionHero />
            <SectionAbout />
            <SectionWhatIDo />
            <SectionExperience />
            <SectionProjects />
            <SectionContact />
          </main>
        </>
      )}
    </div>
  );
}

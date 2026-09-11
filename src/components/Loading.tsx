import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoadingProps {
  progress: number;
  status: string;
  isExiting: boolean;
  onWordmarkComplete: () => void;
}

const wordmarkStrokes = [
  'M108 200 C88 148 90 72 116 36 C139 5 196 13 203 50 C211 92 162 119 116 106',
  'M121 130 C153 126 170 111 181 91 C171 130 180 170 213 169 C245 168 257 131 240 112 C222 94 193 111 197 139 C202 173 250 166 274 134',
  'M270 164 C280 142 288 116 291 101 C296 121 293 144 294 164 C301 128 326 102 346 113 C354 119 348 132 337 134',
  'M337 139 C368 133 392 126 418 118 M382 67 C373 99 363 134 365 158 C367 178 385 174 404 153',
  'M421 160 C438 124 448 79 459 45 C470 13 501 23 495 48 C489 73 460 94 430 106 M417 116 C446 112 474 109 503 107 M456 90 C453 130 454 184 442 219',
  'M501 137 C504 107 544 101 553 126 C563 154 528 174 508 155 C490 139 505 112 530 111 C556 110 568 136 577 145',
  'M575 159 C591 125 599 78 607 43 C613 16 632 17 631 41 C628 82 610 128 601 151 C596 169 608 176 624 160',
  'M626 160 C638 145 646 125 648 108 C650 130 644 154 650 163 C655 171 666 166 678 153 M652 78 C651 74 654 70 659 71',
  'M679 139 C684 108 725 101 735 127 C744 154 710 174 688 156 C670 141 684 112 710 111 C737 110 749 139 764 146',
];

export default function Loading({ progress, status, isExiting, onWordmarkComplete }: LoadingProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onWordmarkComplete);
  const completedRef = useRef(false);
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const progressLabel = String(safeProgress).padStart(2, '0');

  useEffect(() => {
    callbackRef.current = onWordmarkComplete;
  }, [onWordmarkComplete]);

  useLayoutEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const complete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      callbackRef.current();
    };
    const paths = Array.from(loader.querySelectorAll<SVGPathElement>('.portfolio-wordmark-stroke'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const safetyTimer = window.setTimeout(complete, 2200);

    if (reducedMotion) {
      gsap.set(paths, { strokeDashoffset: 0, opacity: 1 });
      complete();
      return () => window.clearTimeout(safetyTimer);
    }

    const context = gsap.context(() => {
      const lengths = paths.map(path => Math.max(1, path.getTotalLength()));
      const maxLength = Math.max(...lengths);
      const timeline = gsap.timeline({ onComplete: complete });
      let startAt = 0.08;

      paths.forEach((path, index) => {
        const length = lengths[index];
        const duration = 0.32 + (length / maxLength) * 0.38;
        const isAccent = path.classList.contains('is-accent');
        const position = isAccent ? Math.max(0, startAt - duration * 0.28) : startAt;

        timeline.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length, opacity: 0 },
          {
            strokeDashoffset: 0,
            opacity: 1,
            duration,
            ease: 'power1.inOut',
          },
          position,
        );

        if (!isAccent) startAt += duration * 0.88;
      });

      timeline.duration(1.8);
    }, loader);

    return () => {
      window.clearTimeout(safetyTimer);
      context.revert();
    };
  }, []);

  return (
    <div
      ref={loaderRef}
      className={`portfolio-loader ${isExiting ? 'is-exiting' : ''}`}
      aria-busy={!isExiting}
      aria-label="Portfolio loading"
    >
      <div className="portfolio-loader-panel is-top" aria-hidden="true">
        <span className="portfolio-loader-panel-face" />
        <span className="portfolio-loader-panel-edge" />
      </div>
      <div className="portfolio-loader-panel is-bottom" aria-hidden="true">
        <span className="portfolio-loader-panel-face" />
        <span className="portfolio-loader-panel-edge" />
      </div>

      <div className="portfolio-loader-wordmark" aria-hidden="true">
        <svg viewBox="0 0 880 260">
          {wordmarkStrokes.map((stroke, index) => (
            <path
              key={stroke}
              className="portfolio-wordmark-stroke"
              d={stroke}
              data-stroke-index={index}
            />
          ))}
          <path
            className="portfolio-wordmark-stroke is-accent"
            d="M760 160 C782 150 807 137 842 132"
            data-stroke-index={wordmarkStrokes.length}
          />
        </svg>
      </div>

      <div
        className="portfolio-loader-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeProgress}
        aria-valuetext={`${status}, ${safeProgress}%`}
      >
        <span className="portfolio-loader-percent" aria-hidden="true">{progressLabel}%</span>
        <span className="portfolio-loader-track" aria-hidden="true">
          <i style={{ transform: `scaleX(${safeProgress / 100})` }} />
        </span>
        <span className="sr-only">{status}</span>
      </div>
    </div>
  );
}

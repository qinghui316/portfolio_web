import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoadingProps {
  onComplete: () => void;
}

export default function Loading({ onComplete }: LoadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Artificial 2-second loading for effect
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete,
        });
      },
    });

    tl.to({}, { duration: 2 });
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-canvas z-[100] flex flex-col justify-center overflow-hidden"
    >
      <div className="flex whitespace-nowrap opacity-20">
        <div className="animate-[marquee_20s_linear_infinite] flex gap-16 font-display text-8xl uppercase tracking-tighter">
          <span>AI PRODUCT MANAGER</span>
          <span>AIGC ENGINEER</span>
          <span>AGENT BUILDER</span>
          <span>MULTIMODAL RETRIEVAL</span>
        </div>
        <div className="animate-[marquee_20s_linear_infinite] flex gap-16 font-display text-8xl uppercase tracking-tighter ml-16">
          <span>AI PRODUCT MANAGER</span>
          <span>AIGC ENGINEER</span>
          <span>AGENT BUILDER</span>
          <span>MULTIMODAL RETRIEVAL</span>
        </div>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 font-mono text-sm uppercase tracking-widest text-muted">
        Initializing...
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';

interface LoadingProps {
  onComplete: () => void;
}

export default function Loading({ onComplete }: LoadingProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setIsExiting(true), 1800);
    const completeTimer = window.setTimeout(onComplete, 2600);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(completeTimer);
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
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 font-mono text-sm uppercase tracking-[0.26em] text-on-dark-soft">
        Initializing...
      </div>
    </div>
  );
}

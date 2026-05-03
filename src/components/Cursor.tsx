import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      gsap.to(cursor, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.1,
        ease: 'power2.out',
      });
    };

    const onMouseEnter = () => {
      gsap.to(cursor, { scale: 0.5, opacity: 0.5, duration: 0.2 });
    };

    const onMouseLeave = () => {
      gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.2 });
    };

    window.addEventListener('mousemove', onMouseMove);

    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, select, textarea');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-8 h-8 rounded-full bg-primary/45 pointer-events-none z-[80] transform -translate-x-1/2 -translate-y-1/2 mix-blend-difference backdrop-blur-sm hidden lg:block"
    />
  );
}

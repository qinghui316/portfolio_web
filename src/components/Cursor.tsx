import { useEffect, useRef } from 'react';
import gsap from 'gsap';

type CursorMode = 'default' | 'interactive' | 'lens-hover' | 'lens-dragging';

export default function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const rotorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorBody = bodyRef.current;
    const cursorRotor = rotorRef.current;
    if (!cursor || !cursorBody || !cursorRotor) return;
    if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let mode: CursorMode = 'default';
    let lastX = 0;
    let pointerDown = false;
    let modeFrame = 0;
    const interactiveSelector = 'a, button, [role="button"], input, select, textarea';
    const context = gsap.context(() => {
      gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    }, cursor);
    const moveX = gsap.quickTo(cursor, 'x', { duration: 0.11, ease: 'power2.out' });
    const moveY = gsap.quickTo(cursor, 'y', { duration: 0.11, ease: 'power2.out' });

    const setMode = (nextMode: CursorMode) => {
      if (mode === nextMode) return;
      mode = nextMode;
      cursor.dataset.mode = nextMode;
      if (nextMode === 'lens-hover') {
        gsap.to(cursorRotor, { rotation: 6, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
      } else if (nextMode !== 'lens-dragging') {
        gsap.to(cursorRotor, { rotation: 0, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
      }
    };

    const resolveMode = (target: EventTarget | null): CursorMode => {
      if (!(target instanceof Element)) return 'default';
      if (target.closest('[data-cursor="lens"]')) return pointerDown ? 'lens-dragging' : 'lens-hover';
      if (target.closest(interactiveSelector)) return 'interactive';
      return 'default';
    };

    const onPointerMove = (event: PointerEvent) => {
      moveX(event.clientX);
      moveY(event.clientY);
      setMode(resolveMode(event.target));

      window.cancelAnimationFrame(modeFrame);
      modeFrame = window.requestAnimationFrame(() => {
        setMode(resolveMode(document.elementFromPoint(event.clientX, event.clientY)));
      });

      if (mode === 'lens-dragging') {
        const velocityRotation = gsap.utils.clamp(-8, 8, (event.clientX - lastX) * 0.64);
        gsap.to(cursorRotor, {
          rotation: velocityRotation,
          duration: 0.12,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
      lastX = event.clientX;
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = true;
      setMode(resolveMode(event.target));
    };

    const onCursorChange = (event: Event) => {
      setMode(resolveMode(event.target));
    };

    const onPointerUp = (event: PointerEvent) => {
      pointerDown = false;
      setMode(resolveMode(event.target));
    };

    const resetCursor = () => {
      pointerDown = false;
      setMode('default');
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('portfolio-cursorchange', onCursorChange);
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', resetCursor, { passive: true });
    window.addEventListener('blur', resetCursor);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('portfolio-cursorchange', onCursorChange);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', resetCursor);
      window.removeEventListener('blur', resetCursor);
      window.cancelAnimationFrame(modeFrame);
      gsap.killTweensOf([cursor, cursorBody, cursorRotor]);
      context.revert();
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="site-cursor"
      data-mode="default"
      aria-hidden="true"
    >
      <span ref={bodyRef} className="site-cursor-body">
        <span ref={rotorRef} className="site-cursor-rotor">
          <i className="site-cursor-arc is-a" />
          <i className="site-cursor-arc is-b" />
        </span>
      </span>
    </div>
  );
}

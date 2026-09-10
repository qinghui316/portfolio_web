import { useRef, useState, type PointerEvent } from 'react';
import { ABOUT_ASSETS as assets } from './about/aboutAssets';

export default function AboutCharacterCard({ load, reduced }: { load: boolean; reduced: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  const [toggled, setToggled] = useState(false), [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);
  const active = ready && !dismissed && (hovered || focused || toggled);
  const clearTilt = () => { stage.current?.style.setProperty('--rx', '0deg'); stage.current?.style.setProperty('--ry', '0deg'); };
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (press.current && Math.hypot(event.clientX - press.current.x, event.clientY - press.current.y) > 8) press.current.moved = true;
    if (reduced || event.pointerType !== 'mouse') return;
    const box = event.currentTarget.getBoundingClientRect();
    stage.current?.style.setProperty('--rx', `${Math.max(-4, Math.min(4, -(event.clientY - box.top - box.height / 2) / box.height * 8))}deg`);
    stage.current?.style.setProperty('--ry', `${Math.max(-4, Math.min(4, (event.clientX - box.left - box.width / 2) / box.width * 8))}deg`);
  };
  return <div className="character-column">
    <div className="portrait-slip" aria-hidden="true"><span className="slip-index">PERSONAL FILE</span><strong>LHY / 001</strong><span className="slip-rule"/><span className="slip-status"><i/> AI ENGINEERING</span></div>
    <button className="character-hit" aria-label="切换人物卡状态" aria-pressed={active}
      onPointerEnter={e => { if (e.pointerType === 'mouse') { setHovered(true); setDismissed(false); } }}
      onPointerLeave={e => { if (e.pointerType === 'mouse') setHovered(false); clearTilt(); }}
      onPointerDown={e => { press.current = { x: e.clientX, y: e.clientY, moved: false }; }}
      onPointerMove={move} onPointerCancel={() => { press.current = null; }}
      onPointerUp={e => {
        if (e.pointerType !== 'mouse' && press.current && !press.current.moved) {
          setDismissed(active); setToggled(!active);
        }
        press.current = null;
      }}
      onFocus={e => { if (!press.current && e.currentTarget.matches(':focus-visible')) { setFocused(true); setDismissed(false); } }}
      onBlur={() => { setFocused(false); setToggled(false); setDismissed(false); clearTilt(); }}
      onClick={e => { if (e.detail === 0) { setDismissed(active); setToggled(!active); } }}
      onKeyDown={e => { if (e.key === 'Escape') { setDismissed(true); setToggled(false); clearTilt(); } }}>
      <div ref={stage} className={`character-card${active ? ' is-active' : ''}`}>
        {load && <><img className="character-image character-default" src={assets.characterDefault} alt="LIU HUIYANG 的二维人物插画" draggable={false}/><img className="character-image character-active" src={assets.characterActive} onLoad={() => setReady(true)} onError={() => setReady(false)} alt="" aria-hidden="true" draggable={false}/></>}
        <div className="character-meta"><strong>LIU HUIYANG</strong><span>PERSONAL ARCHIVE / 001</span></div>
      </div>
    </button>
  </div>;
}

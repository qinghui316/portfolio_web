import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Rotate3D } from 'lucide-react';
import { ABOUT_ASSETS as assets } from './about/aboutAssets';
import { getAboutPreloadState, markAboutInteractiveFailed, markAboutInteractiveReady, prepareAboutInteractive, useAboutPreloadState } from './about/aboutPreload';
const Scene = lazy(() => import('./about/BadgeScene'));

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
type AboutLanyardProps = {
  load: boolean;
  active: boolean;
  running: boolean;
  entryCycle: number;
  reduced: boolean;
};

export default function AboutLanyard({ load, active, running, entryCycle, reduced }: AboutLanyardProps) {
  const [desktop, setDesktop] = useState(() => matchMedia('(min-width:1200px) and (pointer:fine)').matches);
  const preload = useAboutPreloadState();
  const [rear, setRear] = useState(false), [ready, setReady] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [cyclePhysical, setCyclePhysical] = useState(false);
  const area = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const warmup = desktop && !reduced && preload.interactive !== 'idle' && preload.interactive !== 'failed';
  useEffect(() => {
    const q = matchMedia('(min-width:1200px) and (pointer:fine)');
    const update = () => setDesktop(q.matches); q.addEventListener('change', update);
    return () => q.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (area.current) observer.observe(area.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!desktop || reduced || preload.essentials !== 'ready' || preload.interactive !== 'idle') return;
    void prepareAboutInteractive().catch(() => undefined);
  }, [desktop, preload.essentials, preload.interactive, reduced]);
  useEffect(() => {
    setRear(false);
    setArrived(false);
    setCyclePhysical(getAboutPreloadState().interactive === 'ready');
  }, [entryCycle]);
  useEffect(() => {
    if (entryCycle === 0 && preload.interactive === 'ready') setCyclePhysical(true);
  }, [entryCycle, preload.interactive]);
  useEffect(() => {
    if (!active || cyclePhysical) return;
    if (!desktop || reduced) {
      setArrived(true);
      return;
    }
    const timer = window.setTimeout(() => setArrived(true), 1200);
    return () => window.clearTimeout(timer);
  }, [active, cyclePhysical, desktop, reduced]);
  const onReady = useCallback(() => { setReady(true); markAboutInteractiveReady(); }, []);
  const onArrived = useCallback(() => setArrived(true), []);
  const onError = useCallback(() => { setReady(false); setCyclePhysical(false); markAboutInteractiveFailed(); }, []);
  const staticVisible = load && (!desktop || reduced || (active && !cyclePhysical));
  const buttonVisible = load && active && arrived;
  return <div
    ref={area}
    className={`lanyard-column${active ? ' is-active' : ''}${arrived ? ' is-arrived' : ''}`}
    aria-label="LIU HUIYANG 工牌"
    data-renderer={cyclePhysical && ready ? 'physics' : 'static'}
  >
    {load && <img className={`badge-render${staticVisible ? ' is-visible' : ''}${desktop && !cyclePhysical && !reduced ? ' is-fallback' : ''}`} src={rear ? assets.staticBack : assets.staticFront} alt={rear ? '工牌背面：开源项目与公开主页' : 'LIU HUIYANG 工牌正面'} draggable={false}/>}
    {warmup && <div className={`badge-canvas${cyclePhysical && ready && active ? ' is-ready' : ''}`}>
      <SceneBoundary onError={onError}><Suspense fallback={null}><Scene running={cyclePhysical && running && inView} entryCycle={entryCycle} rear={rear} onReady={onReady} onArrived={onArrived} onError={onError}/></Suspense></SceneBoundary>
    </div>}
    <button
      className={`badge-flip${buttonVisible ? ' is-visible' : ''}`}
      type="button"
      title={rear ? '查看工牌正面' : '查看工牌背面'}
      aria-label={rear ? '查看工牌正面' : '查看工牌背面'}
      aria-pressed={rear}
      aria-hidden={!buttonVisible}
      disabled={!buttonVisible}
      tabIndex={buttonVisible ? 0 : -1}
      onClick={() => setRear(value => !value)}
    ><Rotate3D size={20}/></button>
  </div>;
}

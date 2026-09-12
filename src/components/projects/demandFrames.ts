export class DemandFrames {
  private pending: number | null = null;
  private active = false;
  private destroyed = false;
  private lastTime: number | null = null;
  constructor(private tick: (delta: number) => boolean, private request: typeof requestAnimationFrame = callback => requestAnimationFrame(callback), private cancel: typeof cancelAnimationFrame = id => cancelAnimationFrame(id)) {}
  setActive(active: boolean) {
    this.active = active;
    if (active) this.invalidate();
    else { if (this.pending !== null) this.cancel(this.pending); this.pending = null; this.lastTime = null; }
  }
  invalidate = () => {
    if (!this.active || this.destroyed || this.pending !== null) return;
    this.pending = this.request(time => {
      this.pending = null;
      if (!this.active || this.destroyed) return;
      const delta = this.lastTime === null ? 16.667 : Math.max(1, Math.min(32, time - this.lastTime));
      this.lastTime = time;
      if (this.tick(delta)) this.invalidate(); else this.lastTime = null;
    });
  };
  destroy() { this.setActive(false); this.destroyed = true; }
}

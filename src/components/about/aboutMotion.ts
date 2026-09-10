export type Point = { x: number; y: number; z: number };
export const BADGE = Object.freeze({ scale: 2.8, width: 0.7164179087 * 2.8, height: 2.8,
  meshOffset: -0.5229051709 * 2.8, anchorY: (1.212 - 0.5229051709) * 2.8,
  fixedY: 4.65, ropeLength: 1, bandWidthRatio: 0.16, bandThicknessRatio: 0.03, thicknessRatio: 0.022 });
export const BADGE_DROP = Object.freeze({ triggerProgress: 0.7, gravityScale: 0.62,
  restoreGravityAt: 0.9, minSettleTime: 0.85, maxSettleTime: 1.8,
  restTolerance: 0.32, speedThreshold: 0.8, stableFrames: 8 });
export function badgeDropComplete(elapsed: number, stableFrames: number) {
  return (elapsed >= BADGE_DROP.minSettleTime && stableFrames >= BADGE_DROP.stableFrames)
    || elapsed >= BADGE_DROP.maxSettleTime;
}
export function resistRadius(radius: number, start = 0.75, limit = 1) {
  if (radius <= start) return radius;
  const span = limit - start;
  return start + span * (1 - Math.exp(-(radius - start) / span));
}
export function softTarget(x: number, y: number, centerY: number, radiusX: number, radiusY: number): Point {
  const r = Math.hypot(x / radiusX, (y - centerY) / radiusY), factor = r > 0 ? resistRadius(r) / r : 1;
  return { x: x * factor, y: centerY + (y - centerY) * factor, z: 0 };
}
export function springStep(position: number, velocity: number, target: number, dt: number, frequency = 18): [number, number] {
  const offset = position - target, c = velocity + frequency * offset, decay = Math.exp(-frequency * dt);
  return [(offset + c * dt) * decay + target, (velocity - frequency * c * dt) * decay];
}
export function limitReach(target: Point, anchor: Point, fixed: Point, length: number): Point {
  const dx = target.x + anchor.x - fixed.x, dy = target.y + anchor.y - fixed.y, dz = target.z + anchor.z - fixed.z;
  const distance = Math.hypot(dx, dy, dz), factor = distance > 0 ? resistRadius(distance, length * 0.98, length) / distance : 1;
  return { x: fixed.x + dx * factor - anchor.x, y: fixed.y + dy * factor - anchor.y, z: fixed.z + dz * factor - anchor.z };
}
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const aboutReveal = (top: number, height: number) => clamp01((height * 0.85 - top) / (height * 0.25));
export function narrativeAboutVisibility(top: number, bottom: number, height: number) {
  const entry = aboutReveal(top, height), exit = clamp01((height * 0.2 - bottom) / (height * 0.2));
  return 1 - entry * (1 - exit);
}

export type AboutEntryAction = 'wait' | 'enter' | 'settle';
export function getAboutEntryAction(
  top: number,
  bottom: number,
  direction: number,
  desktopMotion: boolean,
  direct: boolean,
  reduced: boolean,
): AboutEntryAction {
  if (direct || reduced || bottom <= 0) return 'settle';
  if (top > 24) return 'wait';
  return desktopMotion && direction > 0 ? 'enter' : 'settle';
}

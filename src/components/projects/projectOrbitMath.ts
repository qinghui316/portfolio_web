export const ORBIT_CONFIG = {
  dragVerticalWeight: 0.35,
  dragStepRatio: 0.24,
  minDragStepPixels: 170,
  inertiaDamping: 4.8,
  maxVelocity: 4,
  magneticVelocityThreshold: 0.32,
  springStrength: 42,
  springDamping: 12,
  activeHysteresis: 0.06,
  tiltRadians: (12 * Math.PI) / 180,
} as const;

export const wrapIndex = (value: number, count: number) => {
  if (count <= 0) return 0;
  return ((value % count) + count) % count;
};

export const getOrbitTargetForIndex = (progress: number, index: number, count: number) => {
  if (count <= 0) return progress;
  const currentSlot = Math.round(progress);
  const currentIndex = wrapIndex(currentSlot, count);
  let offset = wrapIndex(index - currentIndex, count);
  if (offset > count / 2) offset -= count;
  return currentSlot + offset;
};

export const resolveActiveSlot = (
  progress: number,
  activeSlot: number,
  hysteresis = ORBIT_CONFIG.activeHysteresis,
) => {
  let nextSlot = activeSlot;
  const boundary = 0.5 + hysteresis;
  while (progress - nextSlot >= boundary) nextSlot += 1;
  while (progress - nextSlot <= -boundary) nextSlot -= 1;
  return nextSlot;
};

export const getNormalizedOrbitProgress = (progress: number, count: number) => {
  if (count <= 1) return 0;
  const wrapped = wrapIndex(progress, count);
  if (wrapped <= count - 1) return wrapped / (count - 1);
  return count - wrapped;
};

export const getMagneticOrbitTarget = (progress: number, velocity: number) => {
  if (Math.abs(velocity) >= ORBIT_CONFIG.magneticVelocityThreshold) return null;
  const nearestSlot = Math.round(progress);
  return Math.abs(nearestSlot - progress) > 0.0015 ? nearestSlot : null;
};

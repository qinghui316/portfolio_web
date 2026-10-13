export const GALLERY_CONFIG = {
  maxWidth: 1180, stepScreens: .65, releaseScreens: .25,
  maxTilt: 12 * Math.PI / 180, dragThreshold: 7, radius: 120, decay: 800,
};
export const clampProgress = (progress: number, count: number) => Math.max(0, Math.min(count - 1, progress));
export const galleryDistance = (index: number, progress: number) => index - progress;
export const galleryScrollLength = (height: number, count: number) => height * ((count - 1) * GALLERY_CONFIG.stepScreens + GALLERY_CONFIG.releaseScreens);
export const progressFromScroll = (scroll: number, top: number, height: number, count: number) => clampProgress((scroll - top) / (height * GALLERY_CONFIG.stepScreens), count);
export const scrollFromProgress = (progress: number, top: number, height: number, count: number) => top + clampProgress(progress, count) * height * GALLERY_CONFIG.stepScreens;
export function selectedFromProgress(progress: number, previous: number, count: number) {
  if (Math.abs(progress - previous) <= .55) return previous;
  return clampProgress(Math.round(progress), count);
}
export function galleryDimensions(width: number, height: number) {
  const boardWidth = Math.max(1, Math.min(GALLERY_CONFIG.maxWidth, width * (width < 1280 ? .76 : .62), (height - (width < 1280 ? 330 : 210)) * 16 / 9));
  return { boardWidth, boardHeight: boardWidth * 9 / 16, centerY: height * (width < 1280 ? .44 : .54), spacing: width / 2 + boardWidth * .3 };
}
export function galleryPose(distance: number, width: number, viewportWidth: number, height: number) {
  const amount = Math.min(1, Math.abs(distance));
  return {
    x: distance * (viewportWidth / 2 + width * .3),
    y: -Math.pow(amount, 1.6) * Math.min(105, height * .10),
    scale: 1 - amount * .12, rotation: -Math.sign(distance) * amount * GALLERY_CONFIG.maxTilt,
    blur: amount * 5.5, brightness: 1 - amount * .58,
    opacity: Math.max(0, Math.min(1, (1.48 - Math.abs(distance)) / .35)) * (1 - amount * .25),
  };
}

import { useSyncExternalStore } from 'react';
import { ABOUT_ASSETS, ABOUT_ESSENTIAL_ASSETS, ABOUT_INTERACTIVE_IMAGES } from './aboutAssets';

export type PreloadStatus = 'idle' | 'loading' | 'ready' | 'failed';
type AboutPreloadState = {
  essentials: PreloadStatus;
  interactive: PreloadStatus;
};

let state: AboutPreloadState = { essentials: 'idle', interactive: 'idle' };
let essentialsPromise: Promise<void> | null = null;
let interactivePromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const update = (patch: Partial<AboutPreloadState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

const loadImage = (url: string) => new Promise<void>((resolve, reject) => {
  const image = new Image();
  image.decoding = 'async';
  image.onload = async () => {
    try {
      await image.decode();
      resolve();
    } catch (error) {
      reject(error);
    }
  };
  image.onerror = () => reject(new Error(`Unable to preload image: ${url}`));
  image.src = url;
});

const loadBinary = async (url: string) => {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Unable to preload asset: ${url}`);
  await response.arrayBuffer();
};

export const prepareAboutEssentials = () => {
  if (essentialsPromise) return essentialsPromise;
  update({ essentials: 'loading' });
  essentialsPromise = Promise.all(ABOUT_ESSENTIAL_ASSETS.map(loadImage))
    .then(() => update({ essentials: 'ready' }))
    .catch((error) => {
      update({ essentials: 'failed' });
      throw error;
    });
  return essentialsPromise;
};

export const prepareAboutInteractive = () => {
  if (interactivePromise) return interactivePromise;
  update({ interactive: 'loading' });
  interactivePromise = Promise.all([
    import('./BadgeScene').then((module) => module.preloadBadge()),
    ...ABOUT_INTERACTIVE_IMAGES.map(loadImage),
    loadBinary(ABOUT_ASSETS.model),
  ]).then(() => undefined).catch((error) => {
    update({ interactive: 'failed' });
    throw error;
  });
  return interactivePromise;
};

export const markAboutInteractiveReady = () => update({ interactive: 'ready' });
export const markAboutInteractiveFailed = () => update({ interactive: 'failed' });

export const subscribeAboutPreload = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getAboutPreloadState = () => state;
export const useAboutPreloadState = () => useSyncExternalStore(subscribeAboutPreload, getAboutPreloadState, getAboutPreloadState);

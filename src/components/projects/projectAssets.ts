import courseCover from '../../assets/projects/aigc-course.webp';
import eclCover from '../../assets/projects/ecl-harness.webp';
import moonaiCover from '../../assets/projects/moonai.webp';
import atlasUrl from '../../assets/projects/project-atlas.webp';
import embeddingCover from '../../assets/projects/qwen-embedding.webp';
import videoCover from '../../assets/projects/video-fast-clip.webp';
import yaoxiaohuiCover from '../../assets/projects/yaoxiaohui.webp';
import sayweaveCover from '../../assets/projects/sayweave.webp';
import projectManifest from '../../assets/projects/project-manifest.json';
import firstProjectPreview from '../../assets/projects/first-project-preview.webp';
import { useSyncExternalStore } from 'react';

export const projectAssets = {
  firstProjectPreview,
  atlas: atlasUrl,
  covers: {
    sayweave: sayweaveCover,
    moonai: moonaiCover,
    eclHarness: eclCover,
    yaoxiaohui: yaoxiaohuiCover,
    videoFastClip: videoCover,
    qwenEmbedding: embeddingCover,
    aigcCourse: courseCover,
  },
} as const;

let preloadPromise: Promise<void> | null = null;
let started = false;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const useProjectAssetsStarted = () => useSyncExternalStore(subscribe, () => started, () => false);

const decodeImage = (src: string, priority: 'high' | 'low' = 'low') =>
  new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.fetchPriority = priority;
    image.onload = () => { void image.decode().then(resolve, reject); };
    image.onerror = () => reject(new Error(`Unable to preload project image: ${src}`));
    image.src = src;
  });

export const prepareProjectExperience = () => {
  if (preloadPromise) return preloadPromise;
  started = true; listeners.forEach(listener => listener());
  const menu = import('./InfiniteProjectMenu');
  const firstKey = projectManifest[0].coverKey as keyof typeof projectAssets.covers;
  preloadPromise = decodeImage(projectAssets.covers[firstKey], 'high')
    .catch(() => undefined)
    .then(() => Promise.all([
      menu,
      ...projectManifest.slice(1).map(({ coverKey }) => decodeImage(projectAssets.covers[coverKey as keyof typeof projectAssets.covers])),
      decodeImage(projectAssets.atlas),
    ]))
    .then(() => undefined);
  return preloadPromise;
};

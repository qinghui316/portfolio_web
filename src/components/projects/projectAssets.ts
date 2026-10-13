import { useSyncExternalStore } from 'react';
import manifest from '../../assets/projects/project-manifest.json';
import firstPreview from '../../assets/gallery/first-preview.webp';

const files = import.meta.glob('../../assets/gallery/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string,string>;
export const galleryAssets = Object.fromEntries(manifest.map(({id})=>[id, {
  desktop: files[`../../assets/gallery/${id}-1600.webp`],
  mobile: files[`../../assets/gallery/${id}-960.webp`],
}])) as Record<string,{desktop:string;mobile:string}>;
export const firstProjectPreview = firstPreview;
export const useCompactGallery = () => window.matchMedia('(max-width: 899px), (pointer: coarse)').matches;
const requests = new Map<string,{image:HTMLImageElement;promise:Promise<HTMLImageElement>}>();
const settled = new Map<string,'ready'|'failed'>();
const assetListeners = new Set<()=>void>();
let assetRevision=0;
export const useGalleryAssetRevision=()=>useSyncExternalStore(listener=>{assetListeners.add(listener);return()=>{assetListeners.delete(listener);};},()=>assetRevision,()=>0);
export const galleryImageState=(url:string)=>settled.get(url);
function settle(url:string,state:'ready'|'failed') {settled.set(url,state);assetRevision++;assetListeners.forEach(listener=>listener());}
export const loadGalleryImage = (url:string, priority:'high'|'low'='low') => {
  const existing=requests.get(url);
  if(existing) { if(priority==='high') existing.image.fetchPriority='high'; return existing.promise; }
  const image=new Image(); image.decoding='async'; image.fetchPriority=priority;
  const promise=new Promise<HTMLImageElement>((resolve,reject)=>{
    const fail=()=>{settle(url,'failed');reject(new Error(`Gallery image unavailable: ${url}`));};
    image.onload=()=>{ void image.decode().then(()=>{performance.mark(`gallery:decoded:${url.split('/').pop()}`);settle(url,'ready');resolve(image);},fail); };
    image.onerror=fail;
    image.src=url;
  });
  requests.set(url,{image,promise});
  return promise;
};
let started=false;
const listeners=new Set<()=>void>();
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export const useProjectAssetsStarted=()=>useSyncExternalStore(subscribe,()=>started,()=>false);
const warmups=new Map<string,Promise<void>>();
export function prepareProjectExperience(index=0) {
  started=true; listeners.forEach(listener=>listener());
  const size=useCompactGallery()?'mobile':'desktop';
  const current=manifest[index]?.id ?? manifest[0].id;
  const first=loadGalleryImage(galleryAssets[current][size],'high');
  const existing=warmups.get(size);
  if(existing) { void first.catch(()=>undefined); return existing; }
  const warmup=(async()=>{
    await first.catch(()=>undefined);
    const adjacent=[index+1,index-1].filter(i=>i>=0&&i<manifest.length);
    const code=size==='desktop'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches?import('./ProjectGallery'):Promise.resolve();
    await Promise.allSettled([code,...adjacent.map(i=>loadGalleryImage(galleryAssets[manifest[i].id][size]))]);
    for(const [i,item] of manifest.entries()) {
      if(i!==index&&!adjacent.includes(i)) await loadGalleryImage(galleryAssets[item.id][size]).catch(()=>undefined);
    }
  })();
  warmups.set(size,warmup);
  return warmup;
}

import terrain from '../../assets/contact/terrain.webp';
import phoneClosed from '../../assets/contact/phone-closed.webp';
import phoneOpen from '../../assets/contact/phone-open.webp';
import emailClosed from '../../assets/contact/email-closed.webp';
import emailOpen from '../../assets/contact/email-open.webp';

export type ContactAssetState = 'idle' | 'loading' | 'ready' | 'failed';
export const contactAssets = { terrain, phone: { closed: phoneClosed, open: phoneOpen }, email: { closed: emailClosed, open: emailOpen } };
const sources = { terrain, phoneClosed, emailClosed, phone: phoneOpen, email: emailOpen };
type AssetName = keyof typeof sources;
export type ContactStatus = Record<AssetName | 'essentials' | 'interactive' | 'fonts', ContactAssetState>;
let state: ContactStatus = { terrain: 'idle', phoneClosed: 'idle', emailClosed: 'idle', phone: 'idle', email: 'idle', essentials: 'idle', interactive: 'idle', fonts: 'idle' };
let essentials: Promise<void> | undefined;
let interactive: Promise<void> | undefined;
const pending = new Map<AssetName, Promise<void>>();
const listeners = new Set<(next: ContactStatus) => void>();
const images = new Map<AssetName, HTMLImageElement>();
function update(name: keyof ContactStatus, status: ContactAssetState) {
  state = { ...state, [name]: status }; listeners.forEach(listener => listener(state));
}
export const getContactAssetState = () => state;
export function subscribeContactAssetState(listener: (next: ContactStatus) => void) {
  listeners.add(listener); listener(state); return () => { listeners.delete(listener); };
}
function load(name: AssetName, priority: 'high' | 'low') {
  if (pending.has(name)) return pending.get(name)!;
  update(name, 'loading');
  const image = new Image(); image.decoding = 'async'; image.fetchPriority = priority;
  images.set(name, image); image.src = sources[name];
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_,reject) => { timer = setTimeout(() => reject(new Error('Contact asset timeout')), 20000); });
  const task = Promise.race([image.decode(),deadline]).then(() => { update(name, 'ready'); performance.mark(`contact:${name}:decoded`); }).catch(() => { update(name, 'failed'); }).finally(() => clearTimeout(timer));
  pending.set(name, task); return task;
}
export function prepareContactEssentials(priority: 'high' | 'low' = 'low'): Promise<void> {
  if (priority === 'high') for (const name of ['terrain','phoneClosed','emailClosed'] as const) { const image = images.get(name); if(image) image.fetchPriority = 'high'; }
  if (essentials) return essentials;
  update('essentials', 'loading'); performance.mark('contact:essentials:start');
  update('fonts', 'loading');
  const fonts = Promise.all([document.fonts.load('500 30px "Contact Hand"', 'EmailPhone18379022106@163.com'), document.fonts.load('700 42px "Contact Display"', 'EmailPhone18379022106@163.com')])
    .then(() => { update('fonts','ready'); }).catch(() => { update('fonts','failed'); });
  essentials = Promise.all([load('terrain',priority), load('phoneClosed',priority), load('emailClosed',priority), fonts]).then(() => {
    update('essentials', ['terrain','phoneClosed','emailClosed'].every(name => state[name as AssetName] === 'ready') ? 'ready' : 'failed');
    performance.mark('contact:essentials:settled');
  });
  return essentials;
}
export function prepareContactInteractive(): Promise<void> {
  interactive ??= prepareContactEssentials().then(async () => {
    update('interactive','loading'); performance.mark('contact:interactive:start');
    await Promise.all([load('phone','low'),load('email','low')]);
    update('interactive', state.phone === 'ready' && state.email === 'ready' ? 'ready' : 'failed');
    performance.mark('contact:interactive:settled');
  });
  return interactive;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { DemandFrames } from '../src/components/projects/demandFrames';
import { handArrow } from '../src/components/contact/contactLayout';

function harness() {
  let serial=0, draws=0, moving=false;
  const queue = new Map<number, FrameRequestCallback>();
  const deltas: number[] = [];
  const loop = new DemandFrames(delta => { draws++; deltas.push(delta); return moving; }, cb => { queue.set(++serial,cb); return serial; }, id => { queue.delete(id); });
  const step = (time:number) => { const calls=[...queue.values()]; queue.clear(); calls.forEach(cb=>cb(time)); };
  return {loop,queue,deltas,step,draws:()=>draws,move:(value:boolean)=>{moving=value;}};
}
test('offscreen has no frames; visible rest paints only once', () => {
  const h=harness(); h.loop.invalidate(); assert.equal(h.queue.size,0);
  h.loop.setActive(true); h.step(0); assert.equal(h.draws(),1); assert.equal(h.queue.size,0);
});
test('multiple input events wake only one loop', () => {
  const h=harness(); h.loop.setActive(true); h.loop.invalidate(); h.loop.invalidate(); assert.equal(h.queue.size,1);
  h.move(true); h.step(1); assert.equal(h.queue.size,1); h.move(false); h.step(17); assert.equal(h.queue.size,0);
});
test('pause and resume do not integrate the background interval', () => {
  const h=harness(); h.loop.setActive(true); h.move(true); h.step(0); h.loop.setActive(false); assert.equal(h.queue.size,0);
  h.loop.setActive(true); h.step(600000); assert.ok(h.deltas.at(-1)!<17); h.loop.destroy(); assert.equal(h.queue.size,0); h.loop.invalidate(); assert.equal(h.queue.size,0);
});
test('contact arrows retain exact text and device endpoints', () => {
  const path=handArrow({x:16,y:20},{x:120,y:90},1);
  assert.ok(path.startsWith('M16,20 C')); assert.ok(path.includes('120,90 M'));
  assert.ok(!path.includes('NaN'));
});

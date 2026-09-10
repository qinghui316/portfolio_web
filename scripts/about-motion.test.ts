import test from 'node:test';
import assert from 'node:assert/strict';
import { BADGE_DROP, badgeDropComplete, resistRadius, softTarget, springStep, limitReach } from '../src/components/about/aboutMotion.ts';

test('free region and transition preserve position and first derivative', () => {
  assert.equal(resistRadius(0.5), 0.5);
  const h = 1e-6;
  assert.ok(Math.abs((resistRadius(0.75 + h) - 0.75) / h - 1) < 1e-4);
  assert.ok(resistRadius(100) <= 1);
});
test('elliptical resistance is bounded, symmetric and monotonic', () => {
  let previous = 0;
  for (let i = 0; i < 1000; i++) {
    const x = i / 100;
    const p = softTarget(x, 0, 0, 0.43, 0.96);
    assert.ok(p.x >= previous - 1e-12 && p.x <= 0.43 + 1e-12);
    assert.equal(p.x, -softTarget(-x, 0, 0, 0.43, 0.96).x);
    previous = p.x;
  }
});
test('analytical spring remains stable and time-step independent', () => {
  const simulate = (fps: number) => {
    let p = 0, v = 0;
    for (let i = 0; i < fps; i++) [p, v] = springStep(p, v, 1, 1/fps);
    return p;
  };
  assert.ok(Math.abs(simulate(15) - simulate(120)) < 1e-12);
  assert.ok(simulate(15) > 0.999 && simulate(15) <= 1);
});
test('pulling down or sideways cannot exceed total rope reach', () => {
  const anchor={x:0,y:1.93,z:0},fixed={x:0,y:4.65,z:0};
  for(const target of [{x:100,y:-100,z:0},{x:0,y:-1,z:0},{x:-3,y:0,z:2}]) {
    const p=limitReach(target,anchor,fixed,3);
    assert.ok(Math.hypot(p.x,p.y+anchor.y-fixed.y,p.z)<=3+1e-12);
  }
});
test('badge arrival requires stable motion or the safety timeout', () => {
  assert.equal(badgeDropComplete(BADGE_DROP.minSettleTime - 0.01, BADGE_DROP.stableFrames), false);
  assert.equal(badgeDropComplete(BADGE_DROP.minSettleTime, BADGE_DROP.stableFrames - 1), false);
  assert.equal(badgeDropComplete(BADGE_DROP.minSettleTime, BADGE_DROP.stableFrames), true);
  assert.equal(badgeDropComplete(BADGE_DROP.maxSettleTime, 0), true);
});


test('entry and video visibility follow the complete book bounds', async () => {
  const { aboutReveal, narrativeAboutVisibility, getAboutEntryAction } = await import('../src/components/about/aboutMotion.ts');
  assert.equal(aboutReveal(850,1000),0);
  assert.equal(aboutReveal(600,1000),1);
  assert.equal(aboutReveal(725,1000),0.5);
  assert.equal(narrativeAboutVisibility(600,1600,1000),0);
  assert.equal(narrativeAboutVisibility(-800,200,1000),0);
  assert.equal(narrativeAboutVisibility(-900,100,1000),0.5);
  assert.equal(narrativeAboutVisibility(-1000,0,1000),1);
  assert.equal(getAboutEntryAction(300,1300,1,true,false,false),'wait');
  assert.equal(getAboutEntryAction(24,1024,1,true,false,false),'enter');
  assert.equal(getAboutEntryAction(24,1024,-1,true,false,false),'settle');
  assert.equal(getAboutEntryAction(24,1024,1,false,false,false),'settle');
  assert.equal(getAboutEntryAction(300,1300,0,true,true,false),'settle');
  assert.equal(getAboutEntryAction(300,1300,0,true,false,true),'settle');
  assert.equal(getAboutEntryAction(-1200,-200,0,true,false,false),'settle');
});

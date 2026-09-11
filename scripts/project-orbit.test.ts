import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getNormalizedOrbitProgress,
  getMagneticOrbitTarget,
  getOrbitTargetForIndex,
  resolveActiveSlot,
  wrapIndex,
} from '../src/components/projects/projectOrbitMath';

test('project indices wrap in a stable data order', () => {
  assert.equal(wrapIndex(6, 6), 0);
  assert.equal(wrapIndex(-1, 6), 5);
  assert.equal(wrapIndex(8, 6), 2);
});

test('explicit selection uses the shortest continuous orbit target', () => {
  assert.equal(getOrbitTargetForIndex(0.2, 5, 6), -1);
  assert.equal(getOrbitTargetForIndex(5.8, 0, 6), 6);
  assert.equal(getOrbitTargetForIndex(2.1, 4, 6), 4);
});

test('active slot changes only after crossing the hysteresis boundary', () => {
  assert.equal(resolveActiveSlot(0.55, 0), 0);
  assert.equal(resolveActiveSlot(0.57, 0), 1);
  assert.equal(resolveActiveSlot(0.45, 1), 1);
  assert.equal(resolveActiveSlot(0.43, 1), 0);
});

test('long drags traverse every intermediate slot in order', () => {
  assert.equal(resolveActiveSlot(3.2, 0), 3);
  assert.equal(resolveActiveSlot(-2.2, 0), -2);
});

test('continuous progress maps to the linear project indicator', () => {
  assert.equal(getNormalizedOrbitProgress(0, 6), 0);
  assert.equal(getNormalizedOrbitProgress(2.5, 6), 0.5);
  assert.equal(getNormalizedOrbitProgress(6, 6), 0);
  assert.equal(getNormalizedOrbitProgress(5.5, 6), 0.5);
  assert.equal(getNormalizedOrbitProgress(-0.5, 6), 0.5);
});

test('magnetic settling does not re-arm after reaching an exact slot', () => {
  assert.equal(getMagneticOrbitTarget(2, 0), null);
  assert.equal(getMagneticOrbitTarget(2.12, 0.1), 2);
  assert.equal(getMagneticOrbitTarget(2.12, 0.5), null);
});

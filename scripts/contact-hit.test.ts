import assert from 'node:assert/strict';
import test from 'node:test';
import { deviceHitPath, inContactCorridor, segmentDistance } from '../src/components/contact/contactHit';

function contains(path: string,x:number,y:number) {
  return path.split(' Z').filter(Boolean).some(part=>{
    const points=[...part.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(match=>[Number(match[1]),Number(match[2])]);
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++) {
      const a=points[i],b=points[j];
      if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
    }
    return inside;
  });
}
test('fixed phone union includes the previously missed open door',()=>{
  const path=deviceHitPath('phone',396,594);
  for(const x of [.75,.82,.94]) assert.ok(contains(path,x*396,.62*594));
  assert.equal(contains(path,.85*396,.15*594),false);
});
test('email union includes lid and body without covering the whole sky',()=>{
  const path=deviceHitPath('email',313,313);
  assert.ok(contains(path,.6*313,.43*313));
  assert.ok(contains(path,.15*313,.75*313));
  assert.equal(contains(path,.8*313,.1*313),false);
});
test('padding is in CSS pixels and works on desktop and mobile',()=>{
  for(const height of [360,594,713]) {
    const width=height*2/3;
    assert.ok(contains(deviceHitPath('phone',width,height),.978*width+2,.62*height));
    assert.equal(contains(deviceHitPath('phone',width,height),.978*width+9,.62*height),false);
  }
});
test('corridor is narrow, covers both endpoints and has finite geometry',()=>{
  const start={x:100,y:100},end={x:210,y:200};
  assert.ok(inContactCorridor(start,start,end,1));
  assert.ok(inContactCorridor(end,start,end,1));
  assert.ok(inContactCorridor({x:112,y:98},start,end,1));
  assert.equal(inContactCorridor({x:110,y:180},start,end,1),false);
  assert.equal(segmentDistance({x:3,y:4},{x:0,y:0},{x:0,y:0}),5);
});

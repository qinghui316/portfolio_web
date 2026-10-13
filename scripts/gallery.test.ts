import test from 'node:test';
import assert from 'node:assert/strict';
import { clampProgress, galleryDistance, galleryPose, galleryDimensions, galleryScrollLength, galleryWheelProgress, GalleryWheelGesture, progressFromScroll, scrollFromProgress, selectedFromProgress } from '../src/components/projects/galleryMath';
import sharp from 'sharp';
import { stat,readFile } from 'node:fs/promises';

test('finite gallery never duplicates first or last and limits the arc',()=>{
  assert.equal(galleryDistance(0,6),-6);
  assert.equal(clampProgress(-3,7),0);
  assert.equal(clampProgress(9,7),6);
  for(let i=-20;i<20;i++)assert.ok(Math.abs(galleryPose(i,700,1440,900).rotation)<=12*Math.PI/180);
  assert.equal(galleryPose(0,700,1440,900).blur,0);
  assert.equal(galleryPose(2,700,1440,900).opacity,0);
});
test('scroll, click and drag share an invertible progress coordinate',()=>{
  for(const height of [768,900,1080])for(const p of [0,.33,1,2.55,4.9,6]){
    const y=scrollFromProgress(p,3000,height,7);
    assert.ok(Math.abs(progressFromScroll(y,3000,height,7)-p)<1e-10);
  }
  assert.equal(progressFromScroll(-100,3000,900,7),0);
  assert.equal(progressFromScroll(100000,3000,900,7),6);
  assert.ok(Math.abs(galleryScrollLength(1000,7)-4150)<1e-8);
});
test('selection hysteresis tolerates boundary noise and fast page scroll',()=>{
  assert.equal(selectedFromProgress(.54,0,7),0);
  assert.equal(selectedFromProgress(.56,0,7),1);
  assert.equal(selectedFromProgress(.46,1,7),1);
  assert.equal(selectedFromProgress(.44,1,7),0);
  assert.equal(selectedFromProgress(5.8,0,7),6);
});

test('wheel travel matches reference pixels across viewports and input units',()=>{
  for(const [width,height] of [[1920,1080],[1440,900],[1024,768]]){
    const spacing=galleryDimensions(width,height).spacing;
    assert.ok(Math.abs(galleryWheelProgress(0,120,0,width,height)*spacing-120)<1e-10);
    assert.equal(galleryWheelProgress(0,3,1,width,height),galleryWheelProgress(0,48,0,width,height));
    assert.equal(galleryWheelProgress(0,1,2,width,height),galleryWheelProgress(0,height,0,width,height));
    assert.equal(galleryWheelProgress(-120,20,0,width,height),-galleryWheelProgress(0,120,0,width,height));
    assert.ok(galleryWheelProgress(0,120,0,width,height)<120*1.7/(height*.65));
    assert.equal(Math.round(2+galleryWheelProgress(0,spacing*.65,0,width,height)),3);
  }
});

test('slow wheel detents accumulate even if the first detent has snapped back',()=>{
  for(const direction of [1,-1]) for(const interval of [45,220,350]){
    const gesture=new GalleryWheelGesture();
    let current=2000;
    for(let i=0;i<5;i++){
      const input=gesture.input(direction*120,current,i*interval,10000);
      if(i>0)assert.ok(input.delay>=Math.min(500,interval*1.5));
      // Reproduce the worst case: every partial detent snaps back immediately.
      current=gesture.snap(0,10000,1000)!;
    }
    assert.equal(gesture.snap(0,10000,1000),2000+direction*1000);
  }
});

test('reversing in flight responds immediately from visible position in both directions',()=>{
  for(const direction of [1,-1]){
    const gesture=new GalleryWheelGesture();
    gesture.input(direction*600,2000,0,10000);
    const visible=2000+direction*100;
    assert.equal(gesture.input(-direction*120,visible,60,10000).target,visible-direction*120);
  }
});

test('boundary crossing keeps the same gain without clamping to the last project',()=>{
  const gesture=new GalleryWheelGesture();
  assert.equal(gesture.input(120,5940,0,10000).target,6060);
  assert.equal(gesture.snap(0,6000,1000),null);
  assert.equal(gesture.input(120,5970,100,10000).target,6180);
  assert.equal(gesture.snap(0,6000,1000),null);
  const fresh=gesture.input(120,6200,1000,10000);
  assert.equal(fresh.target,6320);
  assert.equal(fresh.delay,140);
  gesture.cancel();assert.equal(gesture.owns(1001),false);
});

test('new same-direction input cannot move against a snap already in progress',()=>{
  const forward=new GalleryWheelGesture();forward.input(650,2000,0,10000);forward.snap(0,10000,1000);
  assert.ok(forward.input(120,2850,200,10000).target>3000);
  const reverse=new GalleryWheelGesture();reverse.input(-650,2000,0,10000);reverse.snap(0,10000,1000);
  assert.ok(reverse.input(-120,1150,200,10000).target<1000);
});
test('poster and side copy have fixed measurable boundaries',()=>{
  for(const [width,height] of [[1920,1080],[1440,900],[1024,768]]){
    const size=galleryDimensions(width,height);
    assert.ok(size.boardWidth<=1180);
    assert.equal(size.boardHeight,size.boardWidth*9/16);
    assert.ok(size.centerY-size.boardHeight/2>80);
    if(width>=1280)assert.ok((width-size.boardWidth)/2-64>=190);
  }
});
test('desktop/mobile boards retain 16:9, fit budgets and inline preview stays small',async()=>{
  const manifest=JSON.parse(await readFile('src/assets/projects/project-manifest.json','utf8')) as {id:string}[];
  let total=0;
  for(const {id} of manifest){
    for(const [suffix,width,height] of [['1600',1600,900],['960',960,540]] as const){
      const file=`src/assets/gallery/${id}-${suffix}.webp`,metadata=await sharp(file).metadata(),size=(await stat(file)).size;
      assert.equal(metadata.width,width);assert.equal(metadata.height,height);assert.ok(size<400_000);
      if(suffix==='1600')total+=size;
    }
  }
  assert.ok(total<2_800_000);assert.ok((await stat('src/assets/gallery/first-preview.webp')).size<4096);
});

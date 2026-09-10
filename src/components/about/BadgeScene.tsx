import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer, useGLTF, useTexture } from '@react-three/drei';
import { Physics, RigidBody, BallCollider, CuboidCollider, useRopeJoint, useSphericalJoint, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { BADGE, BADGE_DROP, badgeDropComplete, softTarget, springStep, limitReach } from './aboutMotion';
import { ABOUT_ASSETS as assets } from './aboutAssets';

const STEPS = 64;
const X = new THREE.Vector3(1, 0, 0);
const REST = BADGE.fixedY - 3 * BADGE.ropeLength - BADGE.anchorY;


type SceneProps = {
  running: boolean;
  rear: boolean;
  entryCycle: number;
  onReady: () => void;
  onArrived: () => void;
  onError: () => void;
};
type DragState = { plane: THREE.Plane; offset: THREE.Vector3; position: THREE.Vector3; velocity: THREE.Vector3; samples: {time:number;point:THREE.Vector3}[]; capture: {target:Element;id:number} };
export function preloadBadge() { useGLTF.preload(assets.model); useTexture.preload([assets.front, assets.back, assets.band]); }

function ribbonGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((STEPS + 1) * 4 * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((STEPS + 1) * 4 * 2), 2).setUsage(THREE.DynamicDrawUsage));
  const indices = [];
  for (let i = 0; i < STEPS; i++) for (let j = 0; j < 4; j++) {
    const a = i * 4 + j, b = i * 4 + (j + 1) % 4, c = a + 4, d = b + 4;
    indices.push(a, b, c, b, d, c);
  }
  geometry.setIndex(indices);
  return geometry;
}

function Assembly({ running, rear, entryCycle, onReady, onArrived }: SceneProps) {
  const fixed = useRef<RapierRigidBody>(null!), a = useRef<RapierRigidBody>(null!), b = useRef<RapierRigidBody>(null!), c = useRef<RapierRigidBody>(null!), card = useRef<RapierRigidBody>(null!);
  const ribbon = useRef<THREE.Mesh>(null);
  const signalled = useRef(false), frames = useRef(0), flipping = useRef(false), lastSide = useRef(rear);
  const initialRotation = useRef<[number,number,number]>([0,rear?Math.PI:0,0]);
  const drag = useRef<DragState | null>(null);
  const releaseVelocity = useRef<THREE.Vector3 | null>(null);
  const drop = useRef({ elapsed: 0, stableFrames: 0, arrived: false, gravityRestored: false });
  const [held, setHeld] = useState(false);
  const [hover, setHover] = useState(false);
  const { nodes } = useGLTF(assets.model) as unknown as {nodes: Record<'card'|'clip'|'clamp', THREE.Mesh>};
  const [front, back, fabric] = useTexture([assets.front, assets.back, assets.band]);
  const geometry = useMemo(() => {
    const g = nodes.card.geometry.clone().toNonIndexed();
    g.computeBoundingBox();
    const center = (g.boundingBox!.min.z + g.boundingBox!.max.z) / 2;
    const thickness = g.boundingBox!.max.z - g.boundingBox!.min.z;
    const target = (g.boundingBox!.max.x - g.boundingBox!.min.x) * BADGE.thicknessRatio;
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, center + (pos.getZ(i) - center) * target / thickness);
    g.computeVertexNormals();
    g.clearGroups();
    const p = new THREE.Vector3(), q = new THREE.Vector3(), r = new THREE.Vector3();
    const faces = [], edges = [];
    for (let i = 0; i < pos.count; i += 3) {
      p.fromBufferAttribute(pos, i); q.fromBufferAttribute(pos, i + 1); r.fromBufferAttribute(pos, i + 2);
      q.sub(p).cross(r.sub(p)).normalize();
      (Math.abs(q.z) > 0.75 ? faces : edges).push(i, i + 1, i + 2);
    }
    g.setIndex([...faces, ...edges]);
    g.addGroup(0, faces.length, 0);
    g.addGroup(faces.length, edges.length, 1);
    g.computeBoundingBox();
    return g;
  }, [nodes.card.geometry]);
  const map = useMemo(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 4096;
    const ctx = cv.getContext('2d'); if (!ctx) throw new Error('Canvas texture unavailable'); ctx.fillStyle = '#d4d7d5'; ctx.fillRect(0, 0, 4096, 4096);
    // Preserve each complete generated face while exposing the existing shell.
    for(const [image,x,height] of [[front.image,0,4096*.755],[back.image,2048,4096*.757]] as [CanvasImageSource,number,number][]) {
      const left=x+2048*.05,top=height*.075,w=2048*.9,h=height*.9;
      ctx.save();
      ctx.beginPath();ctx.roundRect(left-7,top-7,w+14,h+14,70);
      ctx.fillStyle='#767f7c';ctx.fill();
      ctx.beginPath();ctx.roundRect(left,top,w,h,64);ctx.clip();
      ctx.drawImage(image,left,top,w,h);
      ctx.restore();
      ctx.beginPath();ctx.roundRect(x+12,12,2024,height-24,80);
      ctx.strokeStyle='#f8faf9';ctx.lineWidth=10;ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(cv); texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 16;
    return texture;
  }, [front, back]);
  const bandMap = useMemo(() => {
    const texture = fabric.clone(); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 16; texture.needsUpdate = true;
    return texture;
  }, [fabric]);
  const weave = useMemo(() => {
    const size = 128, data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      data[i] = 128 + Math.round(12 * Math.sin((x + y) * Math.PI / 4));
      data[i + 1] = 128 + Math.round(12 * Math.cos((x - y) * Math.PI / 4));
      data[i + 2] = 254; data[i + 3] = 255;
    }
    const texture = new THREE.DataTexture(data, size, size); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.needsUpdate = true;
    return texture;
  }, []);
  const strip = useMemo(ribbonGeometry, []);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(Array.from({ length: 4 }, () => new THREE.Vector3()), false, 'centripetal'), []);
  const scratch = useMemo(() => ({point: new THREE.Vector3(), tangent: new THREE.Vector3(), previous: new THREE.Vector3(), width: new THREE.Vector3(), normal: new THREE.Vector3(), end: new THREE.Vector3(), quat: new THREE.Quaternion(), transport: new THREE.Quaternion(), frames: Array.from({length:STEPS+1},()=>new THREE.Vector3()), tangents:Array.from({length:STEPS+1},()=>new THREE.Vector3()), points:Array.from({length:STEPS+1},()=>new THREE.Vector3())}), []);
  const segment = { colliders: false as const, linearDamping: 2.7, angularDamping: 3.3, canSleep: true };
  useRopeJoint(fixed, a, [[0,0,0],[0,0,0],1]);
  useRopeJoint(a, b, [[0,0,0],[0,0,0],1]);
  useRopeJoint(b, c, [[0,0,0],[0,0,0],1]);
  useSphericalJoint(c, card, [[0,0,0],[0,BADGE.anchorY,0]]);
  const stop = () => {
    if (!drag.current) return;
    const samples = drag.current.samples;
    if (samples.length > 1) {
      const first = samples[0], last = samples[samples.length - 1], dt = (last.time - first.time) / 1000;
      const velocity = new THREE.Vector3().subVectors(last.point, first.point).divideScalar(Math.max(dt, 1/120));
      velocity.clampLength(0, BADGE.width * 2);
      releaseVelocity.current = velocity;
    }
    const capture = drag.current.capture;
    drag.current = null; setHeld(false);
    if (capture?.target.hasPointerCapture?.(capture.id)) capture.target.releasePointerCapture(capture.id);
  };
  useEffect(() => {
    window.addEventListener('blur', stop); window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop);
    return () => { window.removeEventListener('blur', stop); window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); };
  }, []);
  useEffect(() => { document.body.style.cursor = held ? 'grabbing' : hover ? 'grab' : ''; return () => { document.body.style.cursor = ''; }; }, [held, hover]);
  useEffect(() => () => { geometry.dispose(); map.dispose(); bandMap.dispose(); weave.dispose(); strip.dispose(); }, [geometry, map, bandMap, weave, strip]);
  useEffect(() => { if (!running) stop(); }, [running]);
  useEffect(() => { if (lastSide.current !== rear) { stop(); flipping.current = true; lastSide.current = rear; } }, [rear]);
  useEffect(() => () => { const capture=drag.current?.capture; if(capture?.target.hasPointerCapture?.(capture.id)) capture.target.releasePointerCapture(capture.id); }, []);
  useEffect(() => {
    if (!a.current || !b.current || !c.current || !card.current) return;
    stop();
    releaseVelocity.current = null;
    flipping.current = false;
    lastSide.current = false;
    const staged = [
      { x: 0.02, y: BADGE.fixedY - 0.18, z: 0 },
      { x: -0.03, y: BADGE.fixedY - 0.38, z: 0 },
      { x: 0.05, y: BADGE.fixedY - 0.62, z: 0 },
      { x: 0.1, y: BADGE.fixedY - 0.62 - BADGE.anchorY, z: 0 },
    ];
    const identity = { x: 0, y: 0, z: 0, w: 1 };
    const cardRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.08));
    [a.current, b.current, c.current, card.current].forEach((body, index) => {
      body.setTranslation(staged[index], true);
      body.setRotation(index === 3 ? cardRotation : identity, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: index === 3 ? 0.12 : 0 }, true);
      body.resetForces(true);
      body.resetTorques(true);
      body.setGravityScale(BADGE_DROP.gravityScale, true);
    });
    drop.current = { elapsed: 0, stableFrames: 0, arrived: false, gravityRestored: false };
  }, [entryCycle]);
  useFrame((state, delta) => {
    if (!running) return;
    if (!signalled.current && ++frames.current > 3) { signalled.current = true; onReady(); }
    if (!card.current || !fixed.current) return;
    const s = scratch, dt = Math.min(delta, 0.1), body = card.current;
    const dropState = drop.current;
    if (!dropState.arrived) {
      dropState.elapsed += dt;
      if (!dropState.gravityRestored && dropState.elapsed >= BADGE_DROP.restoreGravityAt) {
        [a, b, c, card].forEach(ref => ref.current.setGravityScale(1, true));
        dropState.gravityRestored = true;
      }
      const position = body.translation(), velocity = body.linvel();
      const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
      const stable = Math.abs(position.y - REST) < BADGE_DROP.restTolerance && speed < BADGE_DROP.speedThreshold;
      dropState.stableFrames = stable ? dropState.stableFrames + 1 : 0;
      if (badgeDropComplete(dropState.elapsed, dropState.stableFrames)) {
        dropState.arrived = true;
        [a, b, c, card].forEach(ref => ref.current.setGravityScale(1, true));
        onArrived();
      }
    }
    if (!held && releaseVelocity.current) { body.setLinvel(releaseVelocity.current, true); releaseVelocity.current = null; }
    if (drag.current) {
      state.raycaster.setFromCamera(state.pointer, state.camera);
      const hit = state.raycaster.ray.intersectPlane(drag.current.plane, s.point);
      if (hit) {
        s.point.sub(drag.current.offset);
        const bounded = softTarget(s.point.x, s.point.y, REST + 0.55, 0.43, 0.96);
        s.quat.copy(body.rotation());
        const anchor = s.end.set(0,BADGE.anchorY,0).applyQuaternion(s.quat);
        const target = limitReach(bounded,anchor,fixed.current.translation(),3*BADGE.ropeLength);
        const current = drag.current.position, velocity = drag.current.velocity;
        for (const axis of ['x','y','z'] as const) [current[axis], velocity[axis]] = springStep(current[axis], velocity[axis], target[axis], dt);
        body.setNextKinematicTranslation(current);
        [a,b,c,card].forEach(ref=>ref.current.wakeUp());
        const now = performance.now();
        drag.current.samples.push({time:now,point:current.clone()});
        while (drag.current.samples.length > 2 && drag.current.samples[0].time < now - 80) drag.current.samples.shift();
      }
    } else {
      const pos = body.translation(), velocity = body.linvel();
      const excess = Math.max(0, Math.abs(pos.x) - 0.36);
      if (excess > 0) body.applyImpulse({x:(-Math.sign(pos.x)*excess*excess*24 - velocity.x*excess*3)*dt,y:0,z:0},true);
      const rotation = body.rotation(), angular = body.angvel();
      const desired = rear ? Math.PI : 0;
      s.quat.copy(rotation); const yaw = new THREE.Euler().setFromQuaternion(s.quat,'YXZ').y;
      const error = Math.atan2(Math.sin(yaw-desired),Math.cos(yaw-desired));
      if (flipping.current) {
        body.setAngvel({x:angular.x,y:THREE.MathUtils.clamp(-error*5,-3.2,3.2),z:angular.z},true);
        if(Math.abs(error)<0.012) { flipping.current=false; body.setAngvel({x:angular.x,y:0,z:angular.z},true); }
      } else body.applyTorqueImpulse({x:0,y:-error*0.05*dt,z:0},true);
    }
    s.quat.copy(body.rotation());
    s.end.set(0,BADGE.anchorY,0).applyQuaternion(s.quat).add(body.translation());
    curve.points[0].copy(fixed.current.translation()); curve.points[1].copy(a.current.translation()); curve.points[2].copy(b.current.translation());
    // The spherical joint and strap endpoint coincide. Including both creates a
    // near-zero spline segment whose tangent flips with solver rounding noise.
    // Seat the fabric behind the ring crossbar, with physical depth clearance.
    curve.points[3].set(0,BADGE.anchorY+0.025,-0.115).applyQuaternion(s.quat).add(body.translation());
    curve.updateArcLengths();
    s.width.copy(X); s.previous.copy(curve.getTangentAt(0));
    for(let i=0;i<=STEPS;i++) {
      const t=i/STEPS; curve.getPointAt(t,s.points[i]); curve.getTangentAt(t,s.tangents[i]);
      s.transport.setFromUnitVectors(s.previous,s.tangents[i]); s.width.applyQuaternion(s.transport);
      s.width.addScaledVector(s.tangents[i],-s.width.dot(s.tangents[i])).normalize();
      s.frames[i].copy(s.width); s.previous.copy(s.tangents[i]);
    }
    const endWidth=X.clone().applyQuaternion(s.quat); const tangent=s.tangents[STEPS];
    endWidth.addScaledVector(tangent,-endWidth.dot(tangent)).normalize();
    // A rectangular ribbon has equivalent width directions. Choose the nearest
    // frame so a reverse-facing badge does not introduce a spurious half-twist.
    if(endWidth.dot(s.frames[STEPS])<0)endWidth.negate();
    const twist=Math.atan2(s.normal.crossVectors(s.frames[STEPS],endWidth).dot(tangent),s.frames[STEPS].dot(endWidth));
    let length=0;
    for(let i=0;i<=STEPS;i++) {
      const t=i/STEPS;
      if(i)length+=s.points[i].distanceTo(s.points[i-1]);
      s.width.copy(s.frames[i]).applyAxisAngle(s.tangents[i],twist*t*t);
      s.normal.crossVectors(s.tangents[i],s.width).normalize();
      const bandWidth=BADGE.width*BADGE.bandWidthRatio;
      const taper=1-0.18*Math.pow(t,10), w=bandWidth*taper/2, h=bandWidth*BADGE.bandThicknessRatio/2;
      for(let j=0;j<4;j++) {
        const sx=j===0||j===3?-1:1, sy=j<2?1:-1;
        s.point.copy(s.points[i]).addScaledVector(s.width,sx*w).addScaledVector(s.normal,sy*h);
        strip.attributes.position.setXYZ(i*4+j,s.point.x,s.point.y,s.point.z);
        const fabricImage = fabric.image as HTMLImageElement;
        strip.attributes.uv.setXY(i*4+j,sx<0?0:1,length/(bandWidth*(fabricImage.height/fabricImage.width)));
      }
    }
    strip.attributes.position.needsUpdate=true; strip.attributes.uv.needsUpdate=true; strip.computeVertexNormals(); strip.computeBoundingSphere();
  });
  return <>
    <RigidBody ref={fixed} type="fixed" position={[0,BADGE.fixedY,0]} colliders={false}/>
    <RigidBody ref={a} {...segment} position={[0,BADGE.fixedY-1,0]}><BallCollider args={[0.04]} mass={0.08}/></RigidBody>
    <RigidBody ref={b} {...segment} position={[0,BADGE.fixedY-2,0]}><BallCollider args={[0.04]} mass={0.08}/></RigidBody>
    <RigidBody ref={c} {...segment} position={[0,BADGE.fixedY-3,0]}><BallCollider args={[0.04]} mass={0.08}/></RigidBody>
    <RigidBody ref={card} {...segment} position={[0,REST,0]} rotation={initialRotation.current} type={held?'kinematicPosition':'dynamic'}>
      <CuboidCollider mass={0.45} args={[BADGE.width/2,BADGE.height/2,BADGE.width*BADGE.thicknessRatio/2]} position={[0,0,0.0033856*BADGE.scale]}/>
      <group scale={BADGE.scale} position={[0,BADGE.meshOffset,0]}>
        <mesh castShadow geometry={geometry} onPointerOver={()=>setHover(true)} onPointerOut={()=>setHover(false)} onPointerDown={(event: ThreeEvent<PointerEvent>)=>{
          if(event.pointerType !== 'mouse' || flipping.current || !drop.current.arrived) return;
          event.stopPropagation(); (event.target as Element).setPointerCapture(event.pointerId);
          const current=new THREE.Vector3().copy(card.current.translation());
          drag.current={plane:new THREE.Plane(new THREE.Vector3(0,0,1),-event.point.z),offset:event.point.clone().sub(current),position:current,velocity:new THREE.Vector3(),samples:[],capture:{target:event.target as Element,id:event.pointerId}};
          setHeld(true);
        }} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}>
          <meshPhysicalMaterial attach="material-0" map={map} roughness={0.32} metalness={0} clearcoat={0.65} clearcoatRoughness={0.2}/>
          <meshPhysicalMaterial attach="material-1" color="#8f9995" roughness={0.24} metalness={0.12} clearcoat={0.8} clearcoatRoughness={0.18}/>
        </mesh>
        <mesh castShadow geometry={nodes.clip.geometry}><meshStandardMaterial color="#697170" metalness={0.95} roughness={0.27}/></mesh>
        <mesh castShadow geometry={nodes.clamp.geometry}><meshStandardMaterial color="#697170" metalness={0.95} roughness={0.27}/></mesh>
      </group>
    </RigidBody>
    <mesh castShadow ref={ribbon} geometry={strip} frustumCulled={false}><meshStandardMaterial map={bandMap} normalMap={weave} normalScale={[0.3,0.3]} roughness={0.85} metalness={0} side={THREE.DoubleSide}/></mesh>
    <mesh receiveShadow position={[0,0,-0.075]}><planeGeometry args={[12,16]}/><shadowMaterial transparent opacity={0.12} depthWrite={false}/></mesh>
  </>;
}

function ContextGuard({ onError }: { onError: () => void }) {
  const gl = useThree(state => state.gl);
  const camera = useThree(state => state.camera) as THREE.PerspectiveCamera;
  const size = useThree(state => state.size);
  useEffect(() => {
    const referenceAspect = 0.37 / 1.12 * 16 / 9;
    camera.clearViewOffset();
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(13)) * referenceAspect / (size.width / size.height)));
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', onError);
    return () => canvas.removeEventListener('webglcontextlost', onError);
  }, [gl, onError]);
  return null;
}
export default function BadgeScene(props: SceneProps) {
  return <Canvas shadows={{type:THREE.PCFShadowMap}} camera={{position:[1.64,0.2,11.7],fov:26}}
    onCreated={({camera})=>{camera.lookAt(0,0.2,0);}}
    frameloop={props.running?'always':'never'} dpr={[1,2]} gl={{alpha:true,antialias:true}}>
    <ContextGuard onError={props.onError}/>
    <ambientLight intensity={0.9}/>
    <directionalLight castShadow color="white" intensity={2.6} position={[-3,5,8]} shadow-mapSize={[2048,2048]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={6} shadow-camera-bottom={-4} shadow-normalBias={0.02} shadow-bias={-0.0001} shadow-radius={4}/>
    <directionalLight color="white" intensity={1.5} position={[4,3,-6]}/>
    <Suspense fallback={null}>
      <Physics gravity={[0,-30,0]} paused={!props.running} timeStep={1/60} numSolverIterations={12}><Assembly {...props}/></Physics>
      <Environment resolution={256}>
        <Lightformer color="white" intensity={3} position={[-4,4,6]} rotation={[0,0.5,0]} scale={[2,5,1]}/>
        <Lightformer color="white" intensity={2.5} position={[5,1,3]} rotation={[0,-0.7,0]} scale={[0.5,6,1]}/>
        <Lightformer color="white" intensity={0.7} position={[0,0,8]} scale={[6,5,1]}/>
        <Lightformer color="white" intensity={2} position={[0,4,-4]} rotation={[0,Math.PI,0]} scale={[4,4,1]}/>
      </Environment>
    </Suspense>
  </Canvas>;
}

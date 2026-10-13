import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DemandFrames } from './demandFrames';
import { particleSeeds } from './particleField';
import { clampProgress, galleryDimensions, galleryPose, GALLERY_CONFIG } from './galleryMath';
import { loadGalleryImage } from './projectAssets';

type Item = { id: string; title: string; image: string };
type Props = {
  items: Item[]; progress: number; activeIndex: number; exit: number;
  onProgress: (value: number, immediate: boolean) => void;
  onReady: (ready: boolean) => void; onError: () => void;
};
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment = `
uniform sampler2D artwork; uniform float loaded; uniform float brightness; uniform float blur;
uniform float alpha; uniform vec2 size; uniform vec2 viewport; varying vec2 vUv;
void main(){
  vec2 d=abs((vUv-.5)*size)-(size*.5-vec2(8.));
  float dist=length(max(d,0.))+min(max(d.x,d.y),0.)-8.; if(dist>0.)discard;
  vec4 c=vec4(.065,.07,.058,1.);
  if(loaded>.5){
    if(blur<.05)c=texture2D(artwork,vUv);
    else {
      vec2 b=vec2(blur)/size;
      c=texture2D(artwork,vUv)*.2;
      c+=texture2D(artwork,vUv+vec2(b.x,0.))*.12;
      c+=texture2D(artwork,vUv-vec2(b.x,0.))*.12;
      c+=texture2D(artwork,vUv+vec2(0.,b.y))*.12;
      c+=texture2D(artwork,vUv-vec2(0.,b.y))*.12;
      c+=texture2D(artwork,vUv+b)*.08;
      c+=texture2D(artwork,vUv-b)*.08;
      c+=texture2D(artwork,vUv+vec2(b.x,-b.y))*.08;
      c+=texture2D(artwork,vUv+vec2(-b.x,b.y))*.08;
    }
  }
  float edge=smoothstep(0.,.07,min(gl_FragCoord.x/viewport.x,1.-gl_FragCoord.x/viewport.x));
  gl_FragColor=vec4(c.rgb*brightness,c.a*alpha*edge);
  #include <colorspace_fragment>
}`;

export default function ProjectGallery(props: Props) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef(props); latest.current = props;
  const api = useRef<{ invalidate: () => void } | null>(null);
  useEffect(() => { api.current?.invalidate(); }, [props.progress, props.exit, props.activeIndex]);
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    let disposed = false, visible = false, ready = false, width = 1, height = 1;
    let dragging = false, pointerId: number | null = null, startX = 0, startY = 0, startProgress = 0, travel = 0, pressed = -1;
    let samples: { p: number; t: number }[] = [];
    let lastPointerAt = 0, energy = 0, energyAt = 0, decayStart = 0;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { latest.current.onError(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x10110f, 0);
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true'); host.prepend(canvas);
    const scene = new THREE.Scene();
    // Exact projection keeps the rendered image and HTML safety margins aligned.
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
    camera.position.z = 1000;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(-10000, -10000), direction = new THREE.Vector2(1, 0);
    const textures: THREE.Texture[] = [];
    const geometry = new THREE.PlaneGeometry(1, 1);
    const meshes = props.items.map((_, index) => {
      const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, uniforms: {
        artwork: { value: null }, loaded: { value: 0 }, brightness: { value: 1 }, blur: { value: 0 }, alpha: { value: 1 },
        size: { value: new THREE.Vector2(1, 1) }, viewport: { value: new THREE.Vector2(1, 1) },
      } });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.index = index; scene.add(mesh); return mesh;
    });
    const seed = particleSeeds(120), positions = new Float32Array(360);
    for (let i = 0; i < 120; i++) positions.set([seed[i * 4], seed[i * 4 + 1], seed[i * 4 + 2]], i * 3);
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: {
      view: { value: new THREE.Vector2(1, 1) }, mouse: { value: pointer }, direction: { value: direction }, energy: { value: 0 }, fade: { value: 1 }, dpr: { value: renderer.getPixelRatio() },
    }, vertexShader: `uniform vec2 view;uniform vec2 mouse;uniform vec2 direction;uniform float energy;uniform float fade;uniform float dpr;varying float alpha;
      void main(){vec2 p=(position.xy-.5)*view;float f=pow(1.-smoothstep(0.,120.,distance(p,mouse)),2.)*energy;float depth=(position.z+1.)/3.;p+=direction*f*depth*12.;
      float quiet=mix(.25,1.,smoothstep(.17,.30,abs(position.y-.48)));alpha=(.06+depth*.10+f*.16)*smoothstep(0.,.14,position.y)*fade*quiet;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,-100.,1.);gl_PointSize=(1.+depth)*dpr;}`,
      fragmentShader: `varying float alpha;void main(){if(length(gl_PointCoord-.5)>.5)discard;gl_FragColor=vec4(.78,.77,.72,alpha);}`,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial); particles.frustumCulled = false; scene.add(particles);
    function cursor(hit: boolean) {
      const value = hit ? 'lens' : '';
      if (canvas.dataset.cursor !== value) { canvas.dataset.cursor = value; canvas.dispatchEvent(new Event('portfolio-cursorchange', { bubbles: true })); }
    }
    function positionItems() {
      const { boardWidth, boardHeight, centerY } = galleryDimensions(width, height);
      const { progress, exit } = latest.current;
      const center = Math.round(progress);
      meshes.forEach((mesh, index) => {
        const distance = index - progress, pose = galleryPose(distance, boardWidth, width, height);
        mesh.visible = Math.abs(index - center) <= 1 && pose.opacity > 0;
        mesh.position.set(pose.x, height / 2 - centerY + pose.y, -Math.abs(distance));
        mesh.rotation.z = pose.rotation;
        mesh.scale.set(boardWidth * pose.scale, boardHeight * pose.scale, 1);
        mesh.renderOrder = 10 - Math.abs(distance);
        const uniforms = mesh.material.uniforms;
        uniforms.size.value.set(boardWidth, boardHeight); uniforms.blur.value = pose.blur;
        uniforms.brightness.value = pose.brightness; uniforms.alpha.value = pose.opacity * (1 - exit * Math.min(1, Math.abs(distance)));
        uniforms.viewport.value.set(width * renderer.getPixelRatio(), height * renderer.getPixelRatio());
      });
      particleMaterial.uniforms.fade.value = 1 - exit; scene.updateMatrixWorld(true);
      host.dataset.visibleCards = String(meshes.filter(mesh => mesh.visible).length);
    }
    function layout() {
      width = host.clientWidth; height = host.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2;
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      particleMaterial.uniforms.view.value.set(width, height); positionItems(); frames.invalidate();
    }
    function pick(event: PointerEvent) {
      const rect = host.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / width * 2 - 1, 1 - (event.clientY - rect.top) / height * 2), camera);
      return raycaster.intersectObjects(meshes.filter(mesh => mesh.visible), false)[0]?.object.userData.index ?? -1;
    }
    function stopCapture() {
      dragging = false; cursor(false);
      if (pointerId !== null && canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
      pointerId = null;
    }
    function active() {
      const enabled = visible && !document.hidden;
      frames.setActive(enabled);
      if (!enabled) { stopCapture(); energy = 0; decayStart = 0; lastPointerAt = 0; particleMaterial.uniforms.energy.value = 0; }
    }
    const frames = new DemandFrames(() => {
      if (disposed) return false;
      energy = decayStart * Math.pow(Math.max(0, 1 - (performance.now() - energyAt) / GALLERY_CONFIG.decay), 2);
      if (energy < .0001) energy = 0;
      particleMaterial.uniforms.energy.value = energy * (dragging ? .35 : 1);
      positionItems(); renderer.render(scene, camera);
      host.dataset.draws = String(Number(host.dataset.draws ?? 0) + 1); host.dataset.progress = latest.current.progress.toFixed(4);
      if (!ready && meshes[latest.current.activeIndex].material.uniforms.loaded.value) { ready = true; latest.current.onReady(true); }
      return energy > 0;
    });
    api.current = { invalidate: frames.invalidate };
    function down(event: PointerEvent) {
      if (event.button !== 0 || !ready) return;
      const hit = pick(event); if (hit < 0) return;
      pressed = hit; dragging = true; pointerId = event.pointerId;
      startX = event.clientX; startY = event.clientY; startProgress = latest.current.progress; travel = 0;
      samples = [{ p: startProgress, t: performance.now() }];
      // Stop in-flight smooth navigation before taking over its current scroll position.
      latest.current.onProgress(startProgress, true); canvas.setPointerCapture(event.pointerId); cursor(true);
    }
    function move(event: PointerEvent) {
      const rect = host.getBoundingClientRect(), now = performance.now();
      const next = new THREE.Vector2(event.clientX - rect.left - width / 2, height / 2 - (event.clientY - rect.top));
      const movement = next.clone().sub(pointer);
      if (lastPointerAt && movement.length() < 300) { direction.copy(movement).normalize(); decayStart = Math.min(1, movement.length() / Math.max(8, now - lastPointerAt) / 1.8); energyAt = now; }
      pointer.copy(next); lastPointerAt = now;
      if (dragging && pointerId === event.pointerId) {
        travel = Math.max(travel, Math.hypot(event.clientX - startX, event.clientY - startY));
        const progress = clampProgress(startProgress - (event.clientX - startX) / galleryDimensions(width, height).spacing, props.items.length);
        samples.push({ p: progress, t: now }); samples = samples.filter(sample => now - sample.t <= 100);
        latest.current.onProgress(progress, true); cursor(true);
      } else cursor(pick(event) >= 0);
      frames.invalidate();
    }
    function up(event: PointerEvent) {
      if (!dragging || pointerId !== event.pointerId) return;
      const click = travel < GALLERY_CONFIG.dragThreshold, hit = pick(event), now = performance.now();
      const last = samples.at(-1), first = samples.find(sample => now - sample.t < 100);
      const velocity = first && last ? Math.max(-3, Math.min(3, (last.p - first.p) / Math.max(.016, (now - first.t) / 1000))) : 0;
      stopCapture();
      if (click && hit === pressed) {
        if (hit !== latest.current.activeIndex || Math.abs(latest.current.progress - hit) >= .08) latest.current.onProgress(hit, false);
      } else if (!click) latest.current.onProgress(Math.round((last?.p ?? latest.current.progress) + velocity * .2), false);
      cursor(hit >= 0); frames.invalidate();
    }
    function cancel() { stopCapture(); frames.invalidate(); }
    function leave() { if (!dragging) cursor(false); lastPointerAt = 0; decayStart = energy; energyAt = performance.now(); frames.invalidate(); }
    function lost() { if (dragging) cancel(); }
    function contextLost(event: Event) { event.preventDefault(); frames.setActive(false); latest.current.onError(); }
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', cancel); canvas.addEventListener('lostpointercapture', lost); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', active); window.addEventListener('blur', cancel);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; active(); }); observer.observe(host);
    const resize = new ResizeObserver(layout); resize.observe(host); layout();
    const order = [props.activeIndex, props.activeIndex + 1, props.activeIndex - 1, ...props.items.map((_, index) => index)];
    void (async () => {
      for (const index of [...new Set(order)].filter(index => index >= 0 && index < props.items.length)) {
        if (disposed) break;
        try {
          const image = await loadGalleryImage(props.items[index].image, index === props.activeIndex ? 'high' : 'low'); if (disposed) break;
          const texture = new THREE.Texture(image); texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); texture.needsUpdate = true; textures.push(texture);
          meshes[index].material.uniforms.artwork.value = texture; meshes[index].material.uniforms.loaded.value = 1; frames.invalidate();
        } catch { if (!disposed && index === latest.current.activeIndex) latest.current.onError(); }
      }
    })();
    return () => {
      disposed = true; api.current = null; stopCapture(); frames.destroy(); resize.disconnect(); observer.disconnect();
      document.removeEventListener('visibilitychange', active); window.removeEventListener('blur', cancel);
      geometry.dispose(); meshes.forEach(mesh => mesh.material.dispose()); textures.forEach(texture => texture.dispose());
      particleGeometry.dispose(); particleMaterial.dispose(); renderer.dispose(); canvas.remove();
    };
  }, [props.items]);
  return <div ref={root} className="gallery-webgl" data-draws="0" />;
}

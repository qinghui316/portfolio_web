import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type Rig = {
  root: THREE.Group;
  head: THREE.Group;
  spine: THREE.Group;
  desk: THREE.Group;
  screen: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  panels: THREE.Mesh[];
  coralLight: THREE.PointLight;
  tealLight: THREE.PointLight;
  screenMaterial: THREE.MeshStandardMaterial;
  panelMaterial: THREE.MeshStandardMaterial;
};

type DisposableObject = THREE.Object3D & {
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
};

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function createMaterial(color: number, roughness = 0.65, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    envMapIntensity: 0.55,
  });
}

function add(mesh: THREE.Object3D, parent: THREE.Object3D, position?: [number, number, number], rotation?: [number, number, number]) {
  if (position) mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function createCornerLine(length: number, mat: THREE.Material, vertical = false) {
  const geo = vertical ? new THREE.BoxGeometry(0.025, length, 0.025) : new THREE.BoxGeometry(length, 0.025, 0.025);
  return new THREE.Mesh(geo, mat);
}

function createAIOperatorRig(scene: THREE.Scene): Rig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  const spine = new THREE.Group();
  const desk = new THREE.Group();
  const screen = new THREE.Group();
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();

  const ivory = createMaterial(0xf3eee4, 0.72, 0.08);
  const stone = createMaterial(0xd8d0c3, 0.68, 0.08);
  const cream = createMaterial(0xefe9de, 0.78, 0.03);
  const dark = createMaterial(0x252320, 0.58, 0.12);
  const darkSoft = createMaterial(0x181715, 0.62, 0.08);
  const coral = createMaterial(0xcc785c, 0.5, 0.08);
  const lineMat = createMaterial(0xe8e0d2, 0.55, 0.06);

  const screenMaterial = new THREE.MeshStandardMaterial({
    color: 0x252320,
    emissive: 0xcc785c,
    emissiveIntensity: 0.05,
    roughness: 0.38,
    metalness: 0.22,
  });

  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc785c,
    emissive: 0xcc785c,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
    roughness: 0.35,
    metalness: 0.15,
  });

  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x0f0e0d,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });

  // Character: intentionally abstract and ceramic, avoiding cheap realistic facial details.
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(1.35, 2.25, 20, 36), cream);
  torso.scale.set(1.25, 1, 0.58);
  add(torso, spine, [0, -1.35, 0]);

  const chestBand = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.045, 8, 80, Math.PI), lineMat);
  chestBand.scale.set(1.08, 0.5, 0.3);
  add(chestBand, spine, [0, -0.78, 0.52], [0, 0, Math.PI]);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 0.72, 36), ivory);
  add(neck, spine, [0, 0.25, 0]);

  const headShell = new THREE.Mesh(new THREE.SphereGeometry(1.02, 64, 64), ivory);
  headShell.scale.set(0.92, 1.08, 0.88);
  add(headShell, head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.18, 0.09), darkSoft);
  add(visor, head, [0, 0.12, 0.86], [0.05, 0, 0]);

  const faceLine = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.035, 0.035), coral);
  add(faceLine, head, [0, -0.34, 0.91]);

  const leftEar = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 12, 36), stone);
  add(leftEar, head, [-0.88, 0, 0.05], [Math.PI / 2, 0, 0]);
  const rightEar = leftEar.clone();
  add(rightEar, head, [0.88, 0, 0.05], [Math.PI / 2, 0, 0]);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.025, 8, 96), coral);
  halo.scale.set(1, 1, 0.1);
  add(halo, head, [0, 0.04, -0.02], [Math.PI / 2, 0, 0]);

  add(head, spine, [0, 1.02, 0.05]);
  add(spine, body);

  const shoulderGeo = new THREE.CapsuleGeometry(0.3, 1.95, 16, 28);
  const leftShoulder = new THREE.Mesh(shoulderGeo, cream);
  leftShoulder.scale.set(1, 1, 0.8);
  add(leftShoulder, spine, [-1.35, -0.7, 0], [0, 0, 0.78]);
  const rightShoulder = leftShoulder.clone();
  add(rightShoulder, spine, [1.35, -0.7, 0], [0, 0, -0.78]);

  const armGeo = new THREE.CapsuleGeometry(0.18, 1.55, 14, 26);
  const leftUpper = new THREE.Mesh(armGeo, stone);
  add(leftUpper, leftArm, [-0.52, -0.45, 0], [0, 0.18, -0.95]);
  const leftForearm = new THREE.Mesh(armGeo, ivory);
  add(leftForearm, leftArm, [-0.95, -1.1, 0.42], [1.22, 0.04, -1.35]);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), ivory);
  add(leftHand, leftArm, [-1.25, -1.67, 0.75]);

  const rightUpper = new THREE.Mesh(armGeo, stone);
  add(rightUpper, rightArm, [0.52, -0.45, 0], [0, -0.18, 0.95]);
  const rightForearm = new THREE.Mesh(armGeo, ivory);
  add(rightForearm, rightArm, [0.95, -1.1, 0.42], [1.22, -0.04, 1.35]);
  const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), ivory);
  add(rightHand, rightArm, [1.25, -1.67, 0.75]);

  add(leftArm, body, [-0.35, -0.15, 0.1]);
  add(rightArm, body, [0.35, -0.15, 0.1]);
  add(body, root);

  // Workstation and AI product chrome.
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 1.3), dark);
  add(deskTop, desk, [0, -3.15, 0.75]);
  const deskGlow = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.025, 1.2), coral);
  add(deskGlow, desk, [0, -3.06, 0.75]);

  const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.48, 0.08), darkSoft);
  add(screenFrame, screen, [1.86, -1.96, 0.26], [-0.22, -0.52, 0.03]);
  const screenGlass = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.18, 0.09), screenMaterial);
  add(screenGlass, screen, [1.84, -1.95, 0.34], [-0.22, -0.52, 0.03]);

  const codeLines = [0.24, 0, -0.24].map((y, index) => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(1.35 - index * 0.22, 0.035, 0.025), coral);
    add(line, screen, [1.68, -1.95 + y, 0.43], [-0.22, -0.52, 0.03]);
    return line;
  });
  codeLines.forEach((line, index) => {
    line.material = panelMaterial.clone();
    (line.material as THREE.MeshStandardMaterial).opacity = 0.18 + index * 0.08;
    (line.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.18;
  });

  add(screen, desk);
  add(desk, root);

  const panels: THREE.Mesh[] = [];
  const panelPositions: Array<[number, number, number, number]> = [
    [-2.75, -0.42, 0.9, 0.3],
    [2.85, 0.44, 1.2, -0.35],
    [-2.25, 1.04, 0.7, 0.45],
  ];
  panelPositions.forEach(([x, y, z, ry]) => {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.82, 0.035), panelMaterial);
    add(panel, root, [x, y, z], [0.08, ry, 0]);
    panels.push(panel);

    const c1 = createCornerLine(0.22, lineMat);
    add(c1, panel, [-0.6, 0.32, 0.03]);
    const c2 = createCornerLine(0.22, lineMat, true);
    add(c2, panel, [-0.72, 0.22, 0.03]);
    const c3 = createCornerLine(0.22, lineMat);
    add(c3, panel, [0.6, -0.32, 0.03]);
    const c4 = createCornerLine(0.22, lineMat, true);
    add(c4, panel, [0.72, -0.22, 0.03]);
  });

  const floorShadow = new THREE.Mesh(new THREE.CircleGeometry(3.4, 96), shadowMat);
  floorShadow.scale.set(1.45, 0.45, 1);
  add(floorShadow, root, [0, -3.34, 0.25], [-Math.PI / 2, 0, 0]);

  root.position.set(0, -0.48, 0);
  root.scale.setScalar(1.12);
  scene.add(root);

  const coralLight = new THREE.PointLight(0xcc785c, 2.2, 11, 1.7);
  coralLight.position.set(-3.5, 1.2, 3.5);
  scene.add(coralLight);

  const tealLight = new THREE.PointLight(0x5db8a6, 0.45, 9, 2.1);
  tealLight.position.set(3.5, -0.6, 2.6);
  scene.add(tealLight);

  return {
    root,
    head,
    spine,
    desk,
    screen,
    leftArm,
    rightArm,
    panels,
    coralLight,
    tealLight,
    screenMaterial,
    panelMaterial,
  };
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const disposable = object as DisposableObject;
    disposable.geometry?.dispose();
    if (Array.isArray(disposable.material)) {
      disposable.material.forEach((material) => material.dispose());
    } else {
      disposable.material?.dispose();
    }
  });
}

export default function Character3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    if (reducedMotion()) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 1000);
    camera.position.set(0, 0.05, 11.6);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    scene.add(new THREE.HemisphereLight(0xfaf9f5, 0x181715, 1.5));
    const keyLight = new THREE.DirectionalLight(0xfaf9f5, 2.1);
    keyLight.position.set(4.6, 5.2, 4.8);
    scene.add(keyLight);

    const rig = createAIOperatorRig(scene);
    const modelElement = containerRef.current.querySelector('.character-model');

    let mouseX = 0;
    let mouseY = 0;
    let targetHeadX = 0;
    let targetHeadY = 0;
    let scrollPastHero = false;
    let rafId = 0;
    let rendering = true;

    const resize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      ScrollTrigger.refresh();
    };

    const onMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const startRender = () => {
      if (rendering) return;
      rendering = true;
      render();
    };

    const stopRender = () => {
      rendering = false;
      cancelAnimationFrame(rafId);
    };

    const render = () => {
      if (!rendering) return;

      if (window.scrollY < 220 && !scrollPastHero) {
        targetHeadY = THREE.MathUtils.clamp(mouseX * Math.PI / 7, -Math.PI / 7, Math.PI / 7);
        targetHeadX = THREE.MathUtils.clamp(-mouseY * 0.22, -0.16, 0.18);
      } else {
        targetHeadY = -0.18;
        targetHeadX = -0.08;
      }

      rig.head.rotation.y = THREE.MathUtils.lerp(rig.head.rotation.y, targetHeadY, 0.08);
      rig.head.rotation.x = THREE.MathUtils.lerp(rig.head.rotation.x, targetHeadX, 0.08);
      rig.spine.rotation.x = THREE.MathUtils.lerp(rig.spine.rotation.x, scrollPastHero ? 0.08 : 0, 0.06);

      rig.panels.forEach((panel, index) => {
        panel.position.y += Math.sin(performance.now() * 0.0012 + index) * 0.0008;
      });

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', resize);
    resize();

    gsap.set(modelElement, { xPercent: -50, yPercent: 0, opacity: 1 });
    gsap.set(rig.root.rotation, { x: 0, y: 0, z: 0 });
    gsap.set(rig.panels.map((panel) => panel.material), { opacity: 0 });
    gsap.set('.character-rim', { opacity: 0.42, scale: 1.08 });

    const ctx = gsap.context(() => {
      gsap.from(rig.root.scale, {
        x: 1.18,
        y: 1.18,
        z: 1.18,
        duration: 1.2,
        ease: 'power3.out',
      });

      gsap.from(rig.root.position, {
        y: -0.82,
        duration: 1.2,
        ease: 'power3.out',
      });

      const heroTimeline = gsap.timeline({
        scrollTrigger: {
          id: 'character-hero',
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            scrollPastHero = self.progress > 0.16;
          },
        },
      });

      heroTimeline
        .to(modelElement, { xPercent: -75, duration: 1, ease: 'none' }, 0)
        .to(rig.root.rotation, { y: 0.7, duration: 1, ease: 'none' }, 0)
        .to(camera.position, { z: 10.2, y: 0.28, duration: 1, ease: 'none' }, 0)
        .to(rig.coralLight, { intensity: 3.1, duration: 1, ease: 'none' }, 0)
        .to('.character-rim', { opacity: 0.55, scale: 1.26, duration: 1, ease: 'none' }, 0)
        .to('.hero-copy', { opacity: 0, yPercent: 38, scale: 0.96, duration: 0.8, ease: 'none' }, 0)
        .fromTo('.about-copy', { opacity: 0, yPercent: -14 }, { opacity: 1, yPercent: 0, duration: 0.45, ease: 'none' }, 0.48);

      const aboutTimeline = gsap.timeline({
        scrollTrigger: {
          id: 'character-about',
          trigger: '.about-section',
          start: 'center 55%',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      aboutTimeline
        .to(modelElement, { xPercent: -63, duration: 1, ease: 'none' }, 0)
        .to(camera.position, { z: 10.8, y: 1.04, duration: 1, ease: 'none' }, 0)
        .to(rig.root.rotation, { y: 0.92, x: 0.1, duration: 1, ease: 'none' }, 0)
        .to(rig.leftArm.rotation, { x: -0.24, z: -0.28, duration: 1, ease: 'none' }, 0)
        .to(rig.rightArm.rotation, { x: -0.22, z: 0.28, duration: 1, ease: 'none' }, 0)
        .to(rig.desk.position, { y: 0.34, z: 0.18, duration: 1, ease: 'none' }, 0)
        .to(rig.screenMaterial, { emissiveIntensity: 0.9, duration: 0.42, ease: 'none' }, 0.14)
        .to(rig.panelMaterial, { opacity: 0.36, emissiveIntensity: 0.55, duration: 0.5, ease: 'none' }, 0.24)
        .to(rig.tealLight, { intensity: 0.9, duration: 1, ease: 'none' }, 0.18);

      const whatTimeline = gsap.timeline({
        scrollTrigger: {
          id: 'character-what',
          trigger: '.what-i-do-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
          onEnterBack: startRender,
          onLeave: stopRender,
        },
      });

      whatTimeline
        .to(modelElement, { yPercent: -105, xPercent: -62, duration: 1, ease: 'none' }, 0)
        .to(rig.root.rotation, { y: 0.82, x: -0.04, duration: 1, ease: 'none' }, 0)
        .to(camera.position, { z: 9.6, y: 0.62, duration: 1, ease: 'none' }, 0)
        .to('.character-rim', { opacity: 0, scale: 0.9, duration: 0.85, ease: 'none' }, 0.18);
    });

    render();

    return () => {
      ctx.revert();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
      disposeObject(scene);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="character-container" ref={containerRef}>
      <div className="character-model">
        <div className="character-rim" />
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

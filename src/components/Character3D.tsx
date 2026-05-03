import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Character3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    // No background, alpha true
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 14);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const character = new THREE.Group();
    
    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ 
      color: 0xffd3b6, // Light warm skin Tone
      roughness: 0.4,
      metalness: 0.1
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x1f1e1b, // JetBlack
      roughness: 0.9,
    });

    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xefe9de, // Light cream shirt
      roughness: 0.8,
    });

    const screenLightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xcc785c,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0,
    });

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.y = 1.2;

    // Face
    const faceGeo = new THREE.SphereGeometry(1.1, 64, 64);
    const face = new THREE.Mesh(faceGeo, skinMat);
    face.scale.set(1, 1.1, 0.95);

    // Hair - Base
    const hairGeo = new THREE.SphereGeometry(1.15, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.1;
    hair.rotation.x = -0.15;

    // Ears
    const earGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-1.1, 0, 0);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(1.1, 0, 0);

    // Eyes
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
    
    const eyeGeo = new THREE.SphereGeometry(0.18, 16, 16);
    
    // Left Eye
    const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    leftEye.position.set(-0.45, 0.1, 1.0);
    
    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    rightEye.position.set(0.45, 0.1, 1.0);

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.12);
    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0, 0, 0.12);

    leftEye.add(leftPupil);
    rightEye.add(rightPupil);

    // Eyelids (half closed/relaxed look)
    const eyelidGeo = new THREE.SphereGeometry(0.19, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const leftLid = new THREE.Mesh(eyelidGeo, skinMat);
    leftLid.rotation.x = 0.3;
    const rightLid = new THREE.Mesh(eyelidGeo, skinMat);
    rightLid.rotation.x = 0.3;
    leftEye.add(leftLid);
    rightEye.add(rightLid);

    // Eyebrows
    const browGeo = new THREE.CapsuleGeometry(0.06, 0.35, 8, 8);
    const leftBrow = new THREE.Mesh(browGeo, hairMat);
    leftBrow.position.set(-0.45, 0.4, 1.05);
    leftBrow.rotation.z = Math.PI / 2 + 0.1;

    const rightBrow = new THREE.Mesh(browGeo, hairMat);
    rightBrow.position.set(0.45, 0.4, 1.05);
    rightBrow.rotation.z = Math.PI / 2 - 0.1;

    // Nose
    const noseGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.position.set(0, -0.2, 1.08);
    nose.scale.y = 1.2;
    nose.scale.z = 1.2;

    // Mouth
    const mouthGeo = new THREE.CapsuleGeometry(0.015, 0.2, 8, 8);
    const mouthMat = new THREE.MeshStandardMaterial({ color: 0x8a5a54 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.5, 1.02);
    mouth.rotation.z = Math.PI / 2;

    headGroup.add(face, hair, leftEar, rightEar, leftEye, rightEye, leftBrow, rightBrow, nose, mouth);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.5, 32);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = -0.2;

    // Body (Shirt)
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 2.5, 32), shirtMat);
    spine.position.y = -1.5;

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(1.0, 32, 32);
    const leftShoulder = new THREE.Mesh(shoulderGeo, shirtMat);
    leftShoulder.position.set(-1.6, -0.5, 0);
    const rightShoulder = new THREE.Mesh(shoulderGeo, shirtMat);
    rightShoulder.position.set(1.6, -0.5, 0);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.8, 2.5, 16, 16);
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(-2.2, -1.8, 0);
    leftArm.rotation.z = 0.2;
    
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(2.2, -1.8, 0);
    rightArm.rotation.z = -0.2;

    // Floating panels (AI product chrome - hidden initially)
    const panelGeo = new THREE.BoxGeometry(2, 1.5, 0.1);
    const panel = new THREE.Mesh(panelGeo, screenLightMaterial);
    panel.position.set(3, 1, 1);
    panel.rotation.y = -0.3;
    
    const panel2 = new THREE.Mesh(panelGeo, screenLightMaterial);
    panel2.position.set(-3, 0, 1);
    panel2.rotation.y = 0.3;

    character.add(spine);
    character.add(leftShoulder, rightShoulder);
    character.add(leftArm, rightArm);
    character.add(neck);
    character.add(headGroup);
    character.add(panel);
    character.add(panel2);

    // Move character down so base meets bottom
    character.position.y = -1;
    
    scene.add(character);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 10, 8);
    scene.add(mainLight);

    const warmLight = new THREE.DirectionalLight(0xcc785c, 1); // Coral rim light
    warmLight.position.set(-5, 5, -5);
    scene.add(warmLight);
    
    const fillLight = new THREE.DirectionalLight(0x5db8a6, 0.5); // Teal fill
    fillLight.position.set(5, 0, -5);
    scene.add(fillLight);

    // Mouse tracking for head movement
    let mouseX = 0;
    let mouseY = 0;
    
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Render loop
    let rafId: number;
    let isRendering = true;

    const render = () => {
      if (!isRendering) return;

      // Mouse following lerp
      headGroup.rotation.y = THREE.MathUtils.lerp(
        headGroup.rotation.y,
        THREE.MathUtils.clamp(mouseX * Math.PI / 6, -Math.PI / 6, Math.PI / 6),
        0.1
      );
      headGroup.rotation.x = THREE.MathUtils.lerp(
        headGroup.rotation.x,
        THREE.MathUtils.clamp(-mouseY * 0.5, -0.1, 0.2), // Avoid looking back into head
        0.1
      );
      
      // Pupil following
      leftPupil.position.x = THREE.MathUtils.lerp(leftPupil.position.x, mouseX * 0.04, 0.1);
      leftPupil.position.y = THREE.MathUtils.lerp(leftPupil.position.y, mouseY * 0.04, 0.1);
      rightPupil.position.x = THREE.MathUtils.lerp(rightPupil.position.x, mouseX * 0.04, 0.1);
      rightPupil.position.y = THREE.MathUtils.lerp(rightPupil.position.y, mouseY * 0.04, 0.1);

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(render);
    };
    render();

    // Reset rotation before applying GSAP
    character.rotation.set(0, 0, 0);

    // State 2: Hero Exit to About
    const heroTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      }
    });

    heroTimeline
      .to(character.rotation, { y: 0.5, duration: 1 }, 0)
      .to(camera.position, { z: 12, duration: 1 }, 0)
      .to(".character-model", { xPercent: -75, duration: 1 }, 0)
      .to(".hero-copy", { opacity: 0, scale: 0.95, duration: 0.8 }, 0);

    // State 3: About Technical Reveal -> What I Do
    const aboutTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".about-section",
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true
      }
    });

    aboutTimeline
      .to(".character-model", { xPercent: -50, duration: 5 }, 0)
      .to(camera.position, { z: 14, y: 3, duration: 5 }, 0)
      .to(character.rotation, { y: 0.8, x: 0.1, duration: 3 }, 0)
      // Bring arms up like typing
      .to(leftArm.rotation, { z: 0.8, x: -0.5, duration: 3 }, 0)
      .to(rightArm.rotation, { z: -0.8, x: -0.5, duration: 3 }, 0)
      // Reveal AI chrome panels
      .to(screenLightMaterial, { opacity: 0.6, emissiveIntensity: 0.8, duration: 1 }, 2);

    // State 4: Experience Transition
    const whatTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".what-i-do-section",
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
        onLeave: () => { isRendering = false; }, // Pause outside view
        onEnterBack: () => { 
          isRendering = true; 
          render(); 
        }
      }
    });

    whatTimeline
      .to(camera.position, { z: 12, duration: 1 }, 0)
      .to(character.rotation, { y: 0.6, x: 0.1, duration: 1 }, 0)
      .to(".character-model", { xPercent: -25, duration: 1 }, 0)
      .to(panel.rotation, { y: -0.4, duration: 1}, 0)
      .to(panel.position, { x: 3.5, y: 1.5, z: 3, duration: 1}, 0)
      // Fade out on leave into Experience section
      .to(".character-model", { opacity: 0, duration: 0.8 }, 0.5)
      .to(character.position, { y: -5, duration: 1 }, 0.5);

    // Handle Resize
    const onResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      // Clean up Three.js
      faceGeo.dispose();
      hairGeo.dispose();
      earGeo.dispose();
      eyeGeo.dispose();
      pupilGeo.dispose();
      eyelidGeo.dispose();
      browGeo.dispose();
      noseGeo.dispose();
      mouthGeo.dispose();
      neckGeo.dispose();
      armGeo.dispose();
      panelGeo.dispose();
      scene.children.forEach((c) => {
        if (c instanceof THREE.Mesh) c.geometry?.dispose();
      });
      skinMat.dispose();
      hairMat.dispose();
      shirtMat.dispose();
      eyeWhiteMat.dispose();
      pupilMat.dispose();
      mouthMat.dispose();
      screenLightMaterial.dispose();
      renderer.dispose();
      
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div className="character-container" ref={containerRef}>
      <div className="character-model">
        {/* Removed rim glow as it looked weird for now */}
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

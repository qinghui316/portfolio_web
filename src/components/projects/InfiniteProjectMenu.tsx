import { type FC, useEffect, useRef } from 'react';
import { mat4, vec2, vec3 } from 'gl-matrix';
import {
  getNormalizedOrbitProgress,
  getMagneticOrbitTarget,
  getOrbitTargetForIndex,
  ORBIT_CONFIG,
  resolveActiveSlot,
  wrapIndex,
} from './projectOrbitMath';
import './InfiniteProjectMenu.css';

const backgroundVertShaderSource = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
    vec2 position = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    vUv = position * 0.5;
    gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
`;

const backgroundFragShaderSource = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uPointerEnergy;
uniform float uOrbitEnergy;
in vec2 vUv;
out vec4 outColor;
void main() {
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 base = (vUv - 0.5) * aspect;
    vec2 p = base;
    vec2 mouse = (uMouse - 0.5) * aspect;
    float response = uPointerEnergy * mix(1.0, 0.35, uOrbitEnergy);
    for (float i = 1.0; i <= 5.0; i += 1.0) {
        p.x += 0.021 / i * cos(i * 2.15 * p.y + response * uMouse.x * 3.14159);
        p.y += 0.017 / i * sin(i * 1.82 * p.x + response * uMouse.y * 3.14159);
    }
    vec2 delta = p - mouse;
    float distanceToPointer = length(delta);
    float localField = exp(-distanceToPointer * 7.5) * response;
    float ripple = sin(distanceToPointer * 28.0 - response * 2.8) * 0.010 * localField;
    p += normalize(delta + vec2(0.0001)) * ripple;
    float baseFolds = sin(base.x * 7.3 + sin(base.y * 5.2) * 0.72);
    float activeFolds = sin(p.x * 8.5 + sin(p.y * 6.1) * 1.2 + localField * 2.4);
    float ridge = mix(pow(1.0 - abs(baseFolds), 7.0), pow(1.0 - abs(activeFolds), 6.0), localField);
    float wake = exp(-distanceToPointer * 4.8) * response;
    float diagonalFold = pow(max(0.0, 1.0 - abs(delta.x * 0.78 + delta.y * 0.52) * 10.5), 4.0) * wake;
    float broadReflection = 0.5 + 0.5 * sin(base.x * 2.1 - base.y * 2.7);
    float vignette = smoothstep(0.94, 0.18, length((vUv - 0.5) * vec2(1.0, 1.18)));
    vec3 color = vec3(0.052, 0.052, 0.049);
    color += vec3(0.048, 0.046, 0.042) * broadReflection * 0.22;
    color += vec3(0.91, 0.88, 0.80) * ridge * (0.007 + localField * 0.082);
    color += vec3(0.80, 0.34, 0.22) * ridge * (0.009 + localField * 0.118);
    color += vec3(0.16, 0.48, 0.44) * localField * ridge * 0.022;
    color += vec3(0.88, 0.85, 0.78) * diagonalFold * 0.092;
    color += vec3(0.80, 0.34, 0.22) * diagonalFold * 0.128;
    color *= 0.80 + vignette * 0.20;
    outColor = vec4(color, 0.9);
}
`;

const discVertShaderSource = `#version 300 es

uniform mat4 uWorldMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec3 uCameraPosition;

in vec3 aModelPosition;
in vec3 aModelNormal;
in vec2 aModelUvs;
in mat4 aInstanceMatrix;

out vec2 vUvs;
out float vAlpha;
out float vFacing;
out vec3 vNormal;
flat out int vInstanceId;

#define PI 3.141593

void main() {
    mat4 instanceWorld = uWorldMatrix * aInstanceMatrix;
    vec4 worldPosition = instanceWorld * vec4(aModelPosition, 1.);

    vec3 centerPos = (uWorldMatrix * aInstanceMatrix * vec4(0., 0., 0., 1.)).xyz;
    float radius = length(centerPos.xyz);

    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vFacing = normalize(centerPos.xyz).z;
    vAlpha = smoothstep(0.15, 1., vFacing) * .88 + .12;
    vNormal = normalize(mat3(instanceWorld) * aModelNormal);
    vUvs = aModelUvs;
    vInstanceId = gl_InstanceID;
}
`;

const discFragShaderSource = `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform int uItemCount;
uniform int uAtlasSize;
uniform int uActiveItemIndex;
uniform float uFrames;

out vec4 outColor;

in vec2 vUvs;
in float vAlpha;
in float vFacing;
in vec3 vNormal;
flat in int vInstanceId;

void main() {
    if (vFacing < 0.28) discard;

    int itemIndex = vInstanceId % uItemCount;
    int cellsPerRow = uAtlasSize;
    int cellX = itemIndex % cellsPerRow;
    int cellY = itemIndex / cellsPerRow;
    vec2 cellSize = vec2(1.0) / vec2(float(cellsPerRow));
    vec2 cellOffset = vec2(float(cellX), float(cellY)) * cellSize;

    ivec2 texSize = textureSize(uTex, 0);
    float imageAspect = float(texSize.x) / float(texSize.y);
    float containerAspect = 1.0;
    float scale = max(imageAspect / containerAspect,
                     containerAspect / imageAspect);

    vec2 lensPosition = vUvs * 2.0 - 1.0;
    float radiusSquared = min(dot(lensPosition, lensPosition), 1.0);
    float dome = sqrt(max(0.0, 1.0 - radiusSquared));
    vec2 refraction = lensPosition * (1.0 - dome) * 0.018;
    vec2 st = vec2(vUvs.x, 1.0 - vUvs.y) + vec2(refraction.x, -refraction.y);
    st = (st - 0.5) * scale + 0.5;

    st = clamp(st, 0.0, 1.0);

    st = st * cellSize + cellOffset;

    vec4 artwork = texture(uTex, st);
    float isSelected = itemIndex == uActiveItemIndex ? 1.0 : 0.0;
    float focus = smoothstep(0.45, 0.96, vFacing) * (0.56 + isSelected * 0.44);
    float luminance = dot(artwork.rgb, vec3(0.299, 0.587, 0.114));
    vec3 color = mix(vec3(luminance), artwork.rgb, 0.28 + focus * 0.72);
    color *= 0.52 + focus * 0.48;

    vec3 normal = normalize(vNormal);
    vec3 keyLight = normalize(vec3(-0.46, 0.64, 0.78));
    float specular = pow(max(dot(normal, keyLight), 0.0), 30.0);
    float movingGlint = pow(max(dot(normal, normalize(vec3(sin(uFrames * 0.008) * 0.28 - 0.2, 0.72, 0.86))), 0.0), 48.0);
    float fresnel = pow(1.0 - dome, 2.6);
    float innerShade = smoothstep(0.58, 1.0, radiusSquared) * 0.16;
    float isEdge = 1.0 - smoothstep(0.18, 0.62, abs(vNormal.z));
    float sweepOffset = -0.42 + sin(uFrames * 0.004) * 0.035;
    float glassSweep = pow(max(0.0, 1.0 - abs(dot(lensPosition, normalize(vec2(0.78, 0.62))) - sweepOffset) * 5.5), 4.0);
    glassSweep *= smoothstep(1.0, 0.18, radiusSquared);

    color *= 1.0 - innerShade;
    color += vec3(0.95, 0.96, 0.93) * (specular * 0.25 + movingGlint * 0.16 + glassSweep * 0.12) * (0.45 + focus * 0.55);
    color += vec3(0.96, 0.95, 0.91) * fresnel * 0.14;
    color += vec3(0.80, 0.34, 0.20) * fresnel * 0.20;
    color += vec3(0.18, 0.55, 0.50) * fresnel * 0.055 * isSelected;
    color = mix(color, vec3(0.12, 0.13, 0.13) + specular * 0.28, isEdge * 0.78);

    float facingVisibility = smoothstep(0.28, 0.48, vFacing);
    outColor = vec4(color, artwork.a * vAlpha * facingVisibility);
}
`;

class Face {
  public a: number;
  public b: number;
  public c: number;

  constructor(a: number, b: number, c: number) {
    this.a = a;
    this.b = b;
    this.c = c;
  }
}

class Vertex {
  public position: vec3;
  public normal: vec3;
  public uv: vec2;

  constructor(x: number, y: number, z: number) {
    this.position = vec3.fromValues(x, y, z);
    this.normal = vec3.create();
    this.uv = vec2.create();
  }
}

class Geometry {
  public vertices: Vertex[];
  public faces: Face[];

  constructor() {
    this.vertices = [];
    this.faces = [];
  }

  public addVertex(...args: number[]): this {
    for (let i = 0; i < args.length; i += 3) {
      this.vertices.push(new Vertex(args[i], args[i + 1], args[i + 2]));
    }
    return this;
  }

  public addFace(...args: number[]): this {
    for (let i = 0; i < args.length; i += 3) {
      this.faces.push(new Face(args[i], args[i + 1], args[i + 2]));
    }
    return this;
  }

  public get lastVertex(): Vertex {
    return this.vertices[this.vertices.length - 1];
  }

  public get data(): {
    vertices: Float32Array;
    indices: Uint16Array;
    normals: Float32Array;
    uvs: Float32Array;
  } {
    return {
      vertices: this.vertexData,
      indices: this.indexData,
      normals: this.normalData,
      uvs: this.uvData
    };
  }

  public get vertexData(): Float32Array {
    return new Float32Array(this.vertices.flatMap(v => Array.from(v.position)));
  }

  public get normalData(): Float32Array {
    return new Float32Array(this.vertices.flatMap(v => Array.from(v.normal)));
  }

  public get uvData(): Float32Array {
    return new Float32Array(this.vertices.flatMap(v => Array.from(v.uv)));
  }

  public get indexData(): Uint16Array {
    return new Uint16Array(this.faces.flatMap(f => [f.a, f.b, f.c]));
  }

}

class LensGeometry extends Geometry {
  constructor(radialSteps = 10, angularSteps = 64, radius = 1, domeHeight = 0.08, edgeDepth = 0.05) {
    super();
    const safeRadialSteps = Math.max(2, radialSteps);
    const safeAngularSteps = Math.max(16, angularSteps);

    this.addVertex(0, 0, domeHeight);
    this.lastVertex.uv[0] = 0.5;
    this.lastVertex.uv[1] = 0.5;
    vec3.set(this.lastVertex.normal, 0, 0, 1);

    for (let ring = 1; ring <= safeRadialSteps; ring += 1) {
      const ringRatio = ring / safeRadialSteps;
      const z = domeHeight * (1 - ringRatio * ringRatio);
      for (let segment = 0; segment < safeAngularSteps; segment += 1) {
        const angle = (segment / safeAngularSteps) * Math.PI * 2;
        const x = Math.cos(angle) * ringRatio;
        const y = Math.sin(angle) * ringRatio;
        this.addVertex(radius * x, radius * y, z);
        this.lastVertex.uv[0] = x * 0.5 + 0.5;
        this.lastVertex.uv[1] = y * 0.5 + 0.5;
        vec3.normalize(this.lastVertex.normal, vec3.fromValues(2 * domeHeight * x, 2 * domeHeight * y, 1));

        const current = 1 + (ring - 1) * safeAngularSteps + segment;
        const next = 1 + (ring - 1) * safeAngularSteps + ((segment + 1) % safeAngularSteps);
        if (ring === 1) {
          this.addFace(0, current, next);
        } else {
          const previous = current - safeAngularSteps;
          const previousNext = next - safeAngularSteps;
          this.addFace(previous, current, next, previous, next, previousNext);
        }
      }
    }

    const frontEdgeStart = 1 + (safeRadialSteps - 1) * safeAngularSteps;
    const sideStart = this.vertices.length;
    for (let segment = 0; segment < safeAngularSteps; segment += 1) {
      const angle = (segment / safeAngularSteps) * Math.PI * 2;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      for (const z of [0, -edgeDepth]) {
        this.addVertex(radius * x, radius * y, z);
        this.lastVertex.uv[0] = x * 0.5 + 0.5;
        this.lastVertex.uv[1] = y * 0.5 + 0.5;
        vec3.set(this.lastVertex.normal, x, y, 0);
      }
    }

    for (let segment = 0; segment < safeAngularSteps; segment += 1) {
      const nextSegment = (segment + 1) % safeAngularSteps;
      const front = sideStart + segment * 2;
      const back = front + 1;
      const nextFront = sideStart + nextSegment * 2;
      const nextBack = nextFront + 1;
      this.addFace(front, back, nextBack, front, nextBack, nextFront);

      const capFront = frontEdgeStart + segment;
      const capNext = frontEdgeStart + nextSegment;
      this.addFace(capFront, front, nextFront, capFront, nextFront, capNext);
    }
  }
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (success) {
    return shader;
  }

  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createProgram(
  gl: WebGL2RenderingContext,
  shaderSources: [string, string],
  transformFeedbackVaryings?: string[] | null,
  attribLocations?: Record<string, number>
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, ndx) => {
    const shader = createShader(gl, type, shaderSources[ndx]);
    if (shader) {
      gl.attachShader(program, shader);
    }
  });

  if (transformFeedbackVaryings) {
    gl.transformFeedbackVaryings(program, transformFeedbackVaryings, gl.SEPARATE_ATTRIBS);
  }

  if (attribLocations) {
    for (const attrib in attribLocations) {
      if (Object.prototype.hasOwnProperty.call(attribLocations, attrib)) {
        gl.bindAttribLocation(program, attribLocations[attrib], attrib);
      }
    }
  }

  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);

  if (success) {
    return program;
  }

  console.error(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}

function makeVertexArray(
  gl: WebGL2RenderingContext,
  bufLocNumElmPairs: Array<[WebGLBuffer, number, number]>,
  indices?: Uint16Array
): WebGLVertexArrayObject | null {
  const va = gl.createVertexArray();
  if (!va) return null;

  gl.bindVertexArray(va);

  for (const [buffer, loc, numElem] of bufLocNumElmPairs) {
    if (loc === -1) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, numElem, gl.FLOAT, false, 0, 0);
  }

  if (indices) {
    const indexBuffer = gl.createBuffer();
    if (indexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }
  }

  gl.bindVertexArray(null);
  return va;
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
  const dpr = Math.min(1.75, window.devicePixelRatio || 1);
  const displayWidth = Math.round(canvas.clientWidth * dpr);
  const displayHeight = Math.round(canvas.clientHeight * dpr);
  const needResize = canvas.width !== displayWidth || canvas.height !== displayHeight;
  if (needResize) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  return needResize;
}

function makeBuffer(gl: WebGL2RenderingContext, sizeOrData: number | ArrayBufferView, usage: number): WebGLBuffer {
  const buf = gl.createBuffer();
  if (!buf) {
    throw new Error('Failed to create WebGL buffer.');
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);

  if (typeof sizeOrData === 'number') {
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
  } else {
    gl.bufferData(gl.ARRAY_BUFFER, sizeOrData, usage);
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  return buf;
}

function createAndSetupTexture(
  gl: WebGL2RenderingContext,
  minFilter: number,
  magFilter: number,
  wrapS: number,
  wrapT: number
): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Failed to create WebGL texture.');
  }
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
  return texture;
}

type PointerSample = { progress: number; time: number };

class OrbitControl {
  public isPointerDown = false;
  public progress: number;
  public velocity = 0;
  public targetProgress: number | null = null;
  public pointerUv = vec2.fromValues(0.5, 0.5);
  public pointerEnergy = 0;

  private previousPointer = vec2.create();
  private previousAmbientPointer = vec2.create();
  private previousAmbientTime = 0;
  private samples: PointerSample[] = [];
  private activePointerId: number | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private interactionSurface: HTMLElement,
    initialProgress: number,
    private canStartDrag: (event: PointerEvent) => boolean,
  ) {
    this.progress = initialProgress;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerCancel);
    canvas.addEventListener('lostpointercapture', this.handlePointerCancel);
    canvas.addEventListener('pointermove', this.handleDragPointerMove);
    interactionSurface.addEventListener('pointermove', this.handleAmbientPointerMove, { passive: true, capture: true });
    interactionSurface.addEventListener('pointerleave', this.handlePointerLeave);
    window.addEventListener('blur', this.handleWindowBlur);
    canvas.style.touchAction = 'pan-y';
  }

  public destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('lostpointercapture', this.handlePointerCancel);
    this.canvas.removeEventListener('pointermove', this.handleDragPointerMove);
    this.interactionSurface.removeEventListener('pointermove', this.handleAmbientPointerMove, true);
    this.interactionSurface.removeEventListener('pointerleave', this.handlePointerLeave);
    window.removeEventListener('blur', this.handleWindowBlur);
  }

  public focusItem(index: number, count: number): void {
    this.targetProgress = getOrbitTargetForIndex(this.progress, index, count);
    this.velocity = 0;
  }

  public update(deltaTime: number): void {
    const dt = Math.min(0.033, Math.max(0.001, deltaTime / 1000));
    this.pointerEnergy += (0 - this.pointerEnergy) * Math.min(1, dt * 3.4);
    if (this.pointerEnergy < 0.0025) this.pointerEnergy = 0;
    if (this.isPointerDown) return;

    if (this.targetProgress == null) {
      this.progress += this.velocity * dt;
      this.velocity *= Math.exp(-ORBIT_CONFIG.inertiaDamping * dt);
      const magneticTarget = getMagneticOrbitTarget(this.progress, this.velocity);
      if (magneticTarget != null) {
        this.targetProgress = magneticTarget;
      } else if (Math.abs(this.velocity) < ORBIT_CONFIG.magneticVelocityThreshold) {
        this.progress = Math.round(this.progress);
        this.velocity = 0;
      }
      return;
    }

    const distance = this.targetProgress - this.progress;
    const acceleration = distance * ORBIT_CONFIG.springStrength - this.velocity * ORBIT_CONFIG.springDamping;
    this.velocity += acceleration * dt;
    this.progress += this.velocity * dt;
    if (Math.abs(distance) < 0.0015 && Math.abs(this.velocity) < 0.008) {
      this.progress = this.targetProgress;
      this.targetProgress = null;
      this.velocity = 0;
    }
  }

  private updatePointerFeedback(event: PointerEvent): void {
    const rect = this.interactionSurface.getBoundingClientRect();
    const now = performance.now();
    if (this.previousAmbientTime > 0) {
      const distance = Math.hypot(
        event.clientX - this.previousAmbientPointer[0],
        event.clientY - this.previousAmbientPointer[1],
      );
      const elapsed = Math.max(8, now - this.previousAmbientTime);
      const speed = distance / elapsed;
      this.pointerEnergy = Math.max(this.pointerEnergy, Math.min(1, Math.max(0.12, speed * 0.9)));
    }
    vec2.set(this.previousAmbientPointer, event.clientX, event.clientY);
    this.previousAmbientTime = now;
    vec2.set(
      this.pointerUv,
      Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width))),
      Math.max(0, Math.min(1, 1 - (event.clientY - rect.top) / Math.max(1, rect.height))),
    );
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || !this.canStartDrag(event)) return;
    this.isPointerDown = true;
    this.activePointerId = event.pointerId;
    this.targetProgress = null;
    this.velocity = 0;
    vec2.set(this.previousPointer, event.clientX, event.clientY);
    this.samples = [{ progress: this.progress, time: performance.now() }];
    this.updatePointerFeedback(event);
    this.canvas.setPointerCapture?.(event.pointerId);
  };

  private readonly handleAmbientPointerMove = (event: PointerEvent) => {
    this.updatePointerFeedback(event);
  };

  private readonly handleDragPointerMove = (event: PointerEvent) => {
    if (!this.isPointerDown || event.pointerId !== this.activePointerId) return;

    const deltaX = event.clientX - this.previousPointer[0];
    const deltaY = event.clientY - this.previousPointer[1];
    const pixelsPerStep = Math.max(
      ORBIT_CONFIG.minDragStepPixels,
      Math.min(this.canvas.clientWidth, this.canvas.clientHeight) * ORBIT_CONFIG.dragStepRatio,
    );
    this.progress += (-deltaX - deltaY * ORBIT_CONFIG.dragVerticalWeight) / pixelsPerStep;
    vec2.set(this.previousPointer, event.clientX, event.clientY);

    const now = performance.now();
    this.samples.push({ progress: this.progress, time: now });
    this.samples = this.samples.filter(sample => now - sample.time <= 80);
  };

  private readonly handlePointerUp = (event: PointerEvent) => {
    if (!this.isPointerDown || event.pointerId !== this.activePointerId) return;
    const now = performance.now();
    const first = this.samples.find(sample => now - sample.time <= 80) ?? this.samples[0];
    const elapsed = first ? Math.max(16, now - first.time) / 1000 : 0;
    const measuredVelocity = first && elapsed > 0 ? (this.progress - first.progress) / elapsed : 0;
    this.velocity = Math.max(-ORBIT_CONFIG.maxVelocity, Math.min(ORBIT_CONFIG.maxVelocity, measuredVelocity));
    this.isPointerDown = false;
    this.activePointerId = null;
    this.samples = [];
  };

  private readonly handlePointerCancel = () => {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;
    this.activePointerId = null;
    this.samples = [];
    this.velocity = 0;
    this.targetProgress = Math.round(this.progress);
  };

  private readonly handlePointerLeave = () => {
    this.previousAmbientTime = 0;
    if (!this.isPointerDown) this.pointerEnergy *= 0.4;
  };

  private readonly handleWindowBlur = () => this.handlePointerCancel();
}
export interface InfiniteMenuItem {
  id: string;
  image: string;
  title: string;
  description: string;
}

type MovementChangeCallback = (isMoving: boolean) => void;
type ActiveItemCallback = (index: number) => void;
type ProgressCallback = (progress: number) => void;
type InitCallback = (instance: InfiniteGridMenu) => void;

interface Camera {
  matrix: mat4;
  near: number;
  far: number;
  fov: number;
  aspect: number;
  position: vec3;
  up: vec3;
  matrices: {
    view: mat4;
    projection: mat4;
    inversProjection: mat4;
  };
}

class InfiniteGridMenu {
  private gl: WebGL2RenderingContext | null = null;
  private backgroundProgram: WebGLProgram | null = null;
  private backgroundVAO: WebGLVertexArrayObject | null = null;
  private discProgram: WebGLProgram | null = null;
  private discVAO: WebGLVertexArrayObject | null = null;
  private discBuffers!: {
    vertices: Float32Array;
    indices: Uint16Array;
    normals: Float32Array;
    uvs: Float32Array;
  };
  private discGeo!: LensGeometry;
  private worldMatrix = mat4.create();
  private tex: WebGLTexture | null = null;
  private control!: OrbitControl;
  private animationFrame = 0;
  private destroyed = false;
  private running = false;
  private activeItemIndex = -1;
  private activeSlot = 0;

  private backgroundLocations!: {
    uResolution: WebGLUniformLocation | null;
    uMouse: WebGLUniformLocation | null;
    uPointerEnergy: WebGLUniformLocation | null;
    uOrbitEnergy: WebGLUniformLocation | null;
  };

  private discLocations!: {
    aModelPosition: number;
    aModelNormal: number;
    aModelUvs: number;
    aInstanceMatrix: number;
    uWorldMatrix: WebGLUniformLocation | null;
    uViewMatrix: WebGLUniformLocation | null;
    uProjectionMatrix: WebGLUniformLocation | null;
    uCameraPosition: WebGLUniformLocation | null;
    uTex: WebGLUniformLocation | null;
    uFrames: WebGLUniformLocation | null;
    uItemCount: WebGLUniformLocation | null;
    uAtlasSize: WebGLUniformLocation | null;
    uActiveItemIndex: WebGLUniformLocation | null;
  };

  private viewportSize = vec2.create();
  private drawBufferSize = vec2.create();

  private discInstances!: {
    matricesArray: Float32Array;
    matrices: Float32Array[];
    buffer: WebGLBuffer | null;
  };

  private instancePositions: vec3[] = [];
  private lensNormal = vec3.create();
  private lensTarget = vec3.create();
  private cameraDirection = vec3.create();
  private DISC_INSTANCE_COUNT = 0;
  private atlasSize = 1;

  private _time = 0;
  private _deltaTime = 0;
  private _deltaFrames = 0;
  private _frames = 0;

  private movementActive = false;

  private TARGET_FRAME_DURATION = 1000 / 60;
  private ORBIT_RADIUS = 2;
  private VIEW_HALF_HEIGHT = 1.9;

  public camera: Camera = {
    matrix: mat4.create(),
    near: 0.1,
    far: 40,
    fov: Math.PI / 4,
    aspect: 1,
    position: vec3.fromValues(0, 0, 3),
    up: vec3.fromValues(0, 1, 0),
    matrices: {
      view: mat4.create(),
      projection: mat4.create(),
      inversProjection: mat4.create()
    }
  };

  constructor(
    private canvas: HTMLCanvasElement,
    private items: InfiniteMenuItem[],
    private onActiveItemChange: ActiveItemCallback,
    private onMovementChange: MovementChangeCallback,
    private atlasUrl: string,
    private atlasColumns: number,
    private onTextureReady: (ready: boolean) => void,
    private initialItemIndex: number,
    private onProgressChange: ProgressCallback,
    private restCameraDistance: number,
    private dragCameraDistance: number,
    private lensScale: number,
    onInit?: InitCallback,
  ) {
    this.activeItemIndex = initialItemIndex;
    this.activeSlot = initialItemIndex;
    this.camera.position[2] = restCameraDistance;
    this.init(onInit);
  }

  public resize(): void {
    const needsResize = resizeCanvasToDisplaySize(this.canvas);
    if (!this.gl) return;
    if (needsResize) {
      this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }
    this.updateProjectionMatrix();
  }

  public run(time = 0): void {
    if (this.destroyed || !this.running) return;
    this._deltaTime = Math.min(32, time - this._time);
    this._time = time;
    this._deltaFrames = this._deltaTime / this.TARGET_FRAME_DURATION;
    this._frames += this._deltaFrames;

    this.animate(this._deltaTime);
    this.render();

    this.animationFrame = requestAnimationFrame(t => this.run(t));
  }

  public setRunning(running: boolean): void {
    if (this.destroyed || this.running === running) return;
    this.running = running;
    if (running) {
      this._time = performance.now();
      this.animationFrame = requestAnimationFrame(time => this.run(time));
    } else {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  public destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.animationFrame);
    this.control?.destroy();
    this.onMovementChange(false);
    if (this.gl) {
      this.gl.deleteTexture(this.tex);
      this.gl.deleteVertexArray(this.backgroundVAO);
      this.gl.deleteVertexArray(this.discVAO);
      this.gl.deleteBuffer(this.discInstances?.buffer ?? null);
      this.gl.deleteProgram(this.backgroundProgram);
      this.gl.deleteProgram(this.discProgram);
    }
  }

  public focusItem(itemIndex: number): void {
    if (!this.control || !this.items.length) return;
    const normalizedIndex = wrapIndex(itemIndex, this.items.length);
    this.activeItemIndex = normalizedIndex;
    this.activeSlot = Math.round(getOrbitTargetForIndex(this.control.progress, normalizedIndex, this.items.length));
    this.control.focusItem(normalizedIndex, this.items.length);
  }

  public pickLens(clientX: number, clientY: number): number | null {
    if (!this.discInstances?.matrices?.length) return null;
    const rect = this.canvas.getBoundingClientRect();
    const pointerX = clientX - rect.left;
    const pointerY = clientY - rect.top;
    let bestIndex: number | null = null;
    let bestCameraDistance = Number.POSITIVE_INFINITY;

    const projectPoint = (point: vec3) => {
      const projected = vec3.clone(point);
      vec3.transformMat4(projected, projected, this.camera.matrices.view);
      vec3.transformMat4(projected, projected, this.camera.matrices.projection);
      return {
        x: (projected[0] * 0.5 + 0.5) * rect.width,
        y: (1 - (projected[1] * 0.5 + 0.5)) * rect.height,
        z: projected[2],
      };
    };

    this.discInstances.matrices.forEach((matrix, index) => {
      const instanceMatrix = matrix as unknown as mat4;
      const centerWorld = vec3.transformMat4(vec3.create(), vec3.create(), instanceMatrix);
      const radius = vec3.length(centerWorld);
      if (radius <= 0 || centerWorld[2] / radius < 0.28) return;

      const xWorld = vec3.transformMat4(vec3.create(), vec3.fromValues(1, 0, 0), instanceMatrix);
      const yWorld = vec3.transformMat4(vec3.create(), vec3.fromValues(0, 1, 0), instanceMatrix);
      const center = projectPoint(centerWorld);
      if (center.z < -1 || center.z > 1) return;
      const xEdge = projectPoint(xWorld);
      const yEdge = projectPoint(yWorld);
      const axisX = [xEdge.x - center.x, xEdge.y - center.y] as const;
      const axisY = [yEdge.x - center.x, yEdge.y - center.y] as const;
      const determinant = axisX[0] * axisY[1] - axisX[1] * axisY[0];
      if (Math.abs(determinant) < 0.001) return;

      const deltaX = pointerX - center.x;
      const deltaY = pointerY - center.y;
      const localX = (deltaX * axisY[1] - deltaY * axisY[0]) / determinant;
      const localY = (axisX[0] * deltaY - axisX[1] * deltaX) / determinant;
      if (localX * localX + localY * localY > 1.04 * 1.04) return;

      const cameraDistance = vec3.distance(this.camera.position, centerWorld);
      if (cameraDistance < bestCameraDistance) {
        bestCameraDistance = cameraDistance;
        bestIndex = index % this.items.length;
      }
    });

    return bestIndex;
  }

  private init(onInit?: InitCallback): void {
    const gl = this.canvas.getContext('webgl2', {
      antialias: true,
      alpha: true
    });
    if (!gl) {
      throw new Error('No WebGL 2 context!');
    }
    this.gl = gl;

    vec2.set(this.viewportSize, this.canvas.clientWidth, this.canvas.clientHeight);
    vec2.clone(this.drawBufferSize);

    this.backgroundProgram = createProgram(gl, [backgroundVertShaderSource, backgroundFragShaderSource]);
    this.backgroundVAO = gl.createVertexArray();
    this.backgroundLocations = {
      uResolution: gl.getUniformLocation(this.backgroundProgram!, 'uResolution'),
      uMouse: gl.getUniformLocation(this.backgroundProgram!, 'uMouse'),
      uPointerEnergy: gl.getUniformLocation(this.backgroundProgram!, 'uPointerEnergy'),
      uOrbitEnergy: gl.getUniformLocation(this.backgroundProgram!, 'uOrbitEnergy'),
    };

    this.discProgram = createProgram(gl, [discVertShaderSource, discFragShaderSource], null, {
      aModelPosition: 0,
      aModelNormal: 1,
      aModelUvs: 2,
      aInstanceMatrix: 3
    });

    this.discLocations = {
      aModelPosition: gl.getAttribLocation(this.discProgram!, 'aModelPosition'),
      aModelNormal: gl.getAttribLocation(this.discProgram!, 'aModelNormal'),
      aModelUvs: gl.getAttribLocation(this.discProgram!, 'aModelUvs'),
      aInstanceMatrix: gl.getAttribLocation(this.discProgram!, 'aInstanceMatrix'),
      uWorldMatrix: gl.getUniformLocation(this.discProgram!, 'uWorldMatrix'),
      uViewMatrix: gl.getUniformLocation(this.discProgram!, 'uViewMatrix'),
      uProjectionMatrix: gl.getUniformLocation(this.discProgram!, 'uProjectionMatrix'),
      uCameraPosition: gl.getUniformLocation(this.discProgram!, 'uCameraPosition'),
      uTex: gl.getUniformLocation(this.discProgram!, 'uTex'),
      uFrames: gl.getUniformLocation(this.discProgram!, 'uFrames'),
      uItemCount: gl.getUniformLocation(this.discProgram!, 'uItemCount'),
      uAtlasSize: gl.getUniformLocation(this.discProgram!, 'uAtlasSize'),
      uActiveItemIndex: gl.getUniformLocation(this.discProgram!, 'uActiveItemIndex')
    };

    const balancedQuality = window.devicePixelRatio > 1.75 || window.innerHeight < 760;
    this.discGeo = new LensGeometry(balancedQuality ? 7 : 10, balancedQuality ? 48 : 64);
    this.discBuffers = this.discGeo.data;
    this.discVAO = makeVertexArray(
      gl,
      [
        [makeBuffer(gl, this.discBuffers.vertices, gl.STATIC_DRAW), this.discLocations.aModelPosition, 3],
        [makeBuffer(gl, this.discBuffers.normals, gl.STATIC_DRAW), this.discLocations.aModelNormal, 3],
        [makeBuffer(gl, this.discBuffers.uvs, gl.STATIC_DRAW), this.discLocations.aModelUvs, 2]
      ],
      this.discBuffers.indices
    );

    this.instancePositions = this.items.map(() => vec3.create());
    this.DISC_INSTANCE_COUNT = this.items.length;
    this.initDiscInstances(this.DISC_INSTANCE_COUNT);
    this.initTexture();

    const interactionSurface = this.canvas.closest<HTMLElement>('.projects-section') ?? this.canvas;
    this.control = new OrbitControl(
      this.canvas,
      interactionSurface,
      this.initialItemIndex,
      event => this.pickLens(event.clientX, event.clientY) != null,
    );

    this.updateCameraMatrix();
    this.updateProjectionMatrix();

    this.resize();

    if (onInit) {
      onInit(this);
    }
  }

  private initTexture(): void {
    if (!this.gl) return;
    const gl = this.gl;
    this.tex = createAndSetupTexture(gl, gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);

    this.atlasSize = this.atlasColumns;
    const image = new Image();
    image.onload = () => {
      if (this.destroyed) return;
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      this.onTextureReady(true);
    };
    image.onerror = () => this.onTextureReady(false);
    image.src = this.atlasUrl;
  }

  private initDiscInstances(count: number): void {
    if (!this.gl || !this.discVAO) return;
    const gl = this.gl;

    const matricesArray = new Float32Array(count * 16);
    const matrices: Float32Array[] = [];
    for (let i = 0; i < count; ++i) {
      const instanceMatrixArray = new Float32Array(matricesArray.buffer, i * 16 * 4, 16);
      mat4.identity(instanceMatrixArray as unknown as mat4);
      matrices.push(instanceMatrixArray);
    }

    this.discInstances = {
      matricesArray,
      matrices,
      buffer: gl.createBuffer()
    };

    gl.bindVertexArray(this.discVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.discInstances.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.discInstances.matricesArray.byteLength, gl.DYNAMIC_DRAW);

    const mat4AttribSlotCount = 4;
    const bytesPerMatrix = 16 * 4;
    for (let j = 0; j < mat4AttribSlotCount; ++j) {
      const loc = this.discLocations.aInstanceMatrix + j;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, bytesPerMatrix, j * 4 * 4);
      gl.vertexAttribDivisor(loc, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  private animate(deltaTime: number): void {
    if (!this.gl) return;
    this.control.update(deltaTime);
    this.onControlUpdate(deltaTime);

    const step = (Math.PI * 2) / this.items.length;
    this.instancePositions.forEach((position, index) => {
      const angle = (index - this.control.progress) * step;
      const orbitX = Math.sin(angle) * this.ORBIT_RADIUS;
      const orbitZ = Math.cos(angle) * this.ORBIT_RADIUS;
      const orbitY = orbitX * Math.sin(ORBIT_CONFIG.tiltRadians);
      vec3.set(position, orbitX, orbitY, orbitZ);

      const depth = (orbitZ / this.ORBIT_RADIUS + 1) * 0.5;
      const finalScale = this.lensScale * (0.34 + depth * depth * 0.66);
      vec3.normalize(this.lensNormal, position);
      vec3.subtract(this.cameraDirection, this.camera.position, position);
      vec3.normalize(this.cameraDirection, this.cameraDirection);
      vec3.lerp(this.lensNormal, this.lensNormal, this.cameraDirection, 0.35);
      vec3.normalize(this.lensNormal, this.lensNormal);
      vec3.subtract(this.lensTarget, position, this.lensNormal);
      const matrix = mat4.targetTo(mat4.create(), position, this.lensTarget, [0, 1, 0]);
      mat4.scale(matrix, matrix, [finalScale, finalScale, finalScale]);
      mat4.copy(this.discInstances.matrices[index], matrix);
    });

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.discInstances.buffer);
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.discInstances.matricesArray);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
  }

  private render(): void {
    if (!this.gl || !this.discProgram || !this.backgroundProgram) return;
    const gl = this.gl;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.backgroundProgram);
    gl.uniform2f(this.backgroundLocations.uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform2f(this.backgroundLocations.uMouse, this.control.pointerUv[0], this.control.pointerUv[1]);
    gl.uniform1f(this.backgroundLocations.uPointerEnergy, this.control.pointerEnergy);
    gl.uniform1f(this.backgroundLocations.uOrbitEnergy, this.control.isPointerDown ? 1 : 0);
    gl.bindVertexArray(this.backgroundVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(this.discProgram);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(this.discLocations.uWorldMatrix, false, this.worldMatrix);
    gl.uniformMatrix4fv(this.discLocations.uViewMatrix, false, this.camera.matrices.view);
    gl.uniformMatrix4fv(this.discLocations.uProjectionMatrix, false, this.camera.matrices.projection);
    gl.uniform3f(
      this.discLocations.uCameraPosition,
      this.camera.position[0],
      this.camera.position[1],
      this.camera.position[2],
    );
    gl.uniform1i(this.discLocations.uItemCount, this.items.length);
    gl.uniform1i(this.discLocations.uAtlasSize, this.atlasSize);
    gl.uniform1i(this.discLocations.uActiveItemIndex, Math.max(0, this.activeItemIndex));
    gl.uniform1f(this.discLocations.uFrames, this._frames);
    gl.uniform1i(this.discLocations.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    gl.bindVertexArray(this.discVAO);
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      this.discBuffers.indices.length,
      gl.UNSIGNED_SHORT,
      0,
      this.DISC_INSTANCE_COUNT,
    );
    gl.bindVertexArray(null);
  }
  private updateCameraMatrix(): void {
    mat4.targetTo(this.camera.matrix, this.camera.position, [0, 0, 0], this.camera.up);
    mat4.invert(this.camera.matrices.view, this.camera.matrix);
  }

  private updateProjectionMatrix(): void {
    if (!this.gl) return;
    const canvasEl = this.gl.canvas as HTMLCanvasElement;
    this.camera.aspect = canvasEl.clientWidth / canvasEl.clientHeight;
    const height = this.VIEW_HALF_HEIGHT;
    const distance = this.camera.position[2];
    if (this.camera.aspect > 1) {
      this.camera.fov = 2 * Math.atan(height / distance);
    } else {
      this.camera.fov = 2 * Math.atan(height / this.camera.aspect / distance);
    }
    mat4.perspective(
      this.camera.matrices.projection,
      this.camera.fov,
      this.camera.aspect,
      this.camera.near,
      this.camera.far
    );
    mat4.invert(this.camera.matrices.inversProjection, this.camera.matrices.projection);
  }

  private onControlUpdate(deltaTime: number): void {
    const timeScale = deltaTime / this.TARGET_FRAME_DURATION + 0.0001;
    const velocityPullback = Math.min(1, Math.abs(this.control.velocity) * 0.34);
    const pointerPullback = this.control.isPointerDown ? 0.34 : 0;
    const pullback = Math.max(pointerPullback, velocityPullback);
    const cameraTargetZ = this.restCameraDistance + (this.dragCameraDistance - this.restCameraDistance) * pullback;
    const isMoving =
      this.control.isPointerDown ||
      Math.abs(this.control.velocity) > 0.012 ||
      this.control.targetProgress != null;

    if (isMoving !== this.movementActive) {
      this.movementActive = isMoving;
      this.onMovementChange(isMoving);
    }

    const nextActiveSlot = resolveActiveSlot(this.control.progress, this.activeSlot);
    if (nextActiveSlot !== this.activeSlot) {
      this.activeSlot = nextActiveSlot;
      const nextIndex = wrapIndex(nextActiveSlot, this.items.length);
      if (nextIndex !== this.activeItemIndex) {
        this.activeItemIndex = nextIndex;
        this.onActiveItemChange(nextIndex);
      }
    }

    const damping = this.control.isPointerDown ? 7 : 5;
    this.camera.position[2] +=
      (cameraTargetZ - this.camera.position[2]) * Math.min(1, (0.18 / damping) * timeScale);
    this.onProgressChange(getNormalizedOrbitProgress(this.control.progress, this.items.length));
    this.updateCameraMatrix();
  }
}

interface InfiniteProjectMenuProps {
  items: InfiniteMenuItem[];
  atlasUrl: string;
  activeIndex: number;
  onActiveChange: (index: number) => void;
  onActivate: (index: number) => void;
  onReady?: (ready: boolean) => void;
  onMovementChange?: (moving: boolean) => void;
  onProgressChange?: (progress: number) => void;
  restCameraDistance?: number;
  dragCameraDistance?: number;
  lensScale?: number;
}

const InfiniteProjectMenu: FC<InfiniteProjectMenuProps> = ({
  items,
  atlasUrl,
  activeIndex,
  onActiveChange,
  onActivate,
  onReady,
  onMovementChange = () => undefined,
  onProgressChange = () => undefined,
  restCameraDistance = 3.8,
  dragCameraDistance = 4.8,
  lensScale = 0.47,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sketchRef = useRef<InfiniteGridMenu | null>(null);
  const pointerStart = useRef<[number, number] | null>(null);
  const hoverFrame = useRef(0);
  const activeIndexRef = useRef(activeIndex);
  const callbacksRef = useRef({ onActiveChange, onActivate, onReady, onMovementChange, onProgressChange });

  useEffect(() => {
    callbacksRef.current = { onActiveChange, onActivate, onReady, onMovementChange, onProgressChange };
  }, [onActiveChange, onActivate, onMovementChange, onProgressChange, onReady]);

  useEffect(() => {
    if (activeIndexRef.current === activeIndex) return;
    activeIndexRef.current = activeIndex;
    sketchRef.current?.focusItem(activeIndex);
  }, [activeIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !items.length) return;

    let sketch: InfiniteGridMenu | null = null;
    try {
      sketch = new InfiniteGridMenu(
        canvas,
        items,
        index => {
          activeIndexRef.current = index;
          callbacksRef.current.onActiveChange(index);
        },
        moving => {
          canvas.classList.toggle('is-moving', moving);
          callbacksRef.current.onMovementChange(moving);
        },
        atlasUrl,
        3,
        ready => callbacksRef.current.onReady?.(ready),
        activeIndexRef.current,
        progress => callbacksRef.current.onProgressChange(progress),
        restCameraDistance,
        dragCameraDistance,
        lensScale,
        undefined,
      );
      sketchRef.current = sketch;
      sketch.focusItem(activeIndexRef.current);
    } catch {
      callbacksRef.current.onReady?.(false);
    }

    const handleResize = () => {
      sketch?.resize();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const observer = new IntersectionObserver(
      entries => sketch?.setRunning(entries[0]?.isIntersecting ?? false),
      { rootMargin: '100% 0px' },
    );
    observer.observe(canvas);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      window.cancelAnimationFrame(hoverFrame.current);
      canvas.dataset.cursor = 'default';
      sketch?.destroy();
      sketchRef.current = null;
    };
  }, [atlasUrl, dragCameraDistance, items, lensScale, restCameraDistance]);

  const focusRelative = (offset: number) => {
    if (!items.length) return;
    const nextIndex = (activeIndexRef.current + offset + items.length) % items.length;
    activeIndexRef.current = nextIndex;
    sketchRef.current?.focusItem(nextIndex);
    callbacksRef.current.onActiveChange(nextIndex);
  };

  const cancelPointerInteraction = () => {
    pointerStart.current = null;
    if (canvasRef.current) canvasRef.current.dataset.cursor = 'default';
  };

  const updateLensCursor = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (pointerStart.current) {
      canvas.dataset.cursor = 'lens';
      return;
    }

    window.cancelAnimationFrame(hoverFrame.current);
    hoverFrame.current = window.requestAnimationFrame(() => {
      canvas.dataset.cursor = sketchRef.current?.pickLens(clientX, clientY) != null ? 'lens' : 'default';
      canvas.dispatchEvent(new Event('portfolio-cursorchange', { bubbles: true }));
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="infinite-project-menu"
      data-cursor="default"
      aria-label="项目星图。拖拽沿固定轨道连续浏览，方向键切换，回车打开当前项目。"
      role="application"
      tabIndex={0}
      onPointerDown={event => {
        if (sketchRef.current?.pickLens(event.clientX, event.clientY) == null) {
          pointerStart.current = null;
          event.currentTarget.dataset.cursor = 'default';
          return;
        }
        pointerStart.current = [event.clientX, event.clientY];
        event.currentTarget.dataset.cursor = 'lens';
      }}
      onPointerMove={event => updateLensCursor(event.clientX, event.clientY)}
      onPointerUp={event => {
        const start = pointerStart.current;
        pointerStart.current = null;
        event.currentTarget.dataset.cursor = sketchRef.current?.pickLens(event.clientX, event.clientY) != null ? 'lens' : 'default';
        if (!start) return;
        const deltaX = event.clientX - start[0];
        const deltaY = event.clientY - start[1];
        if (Math.hypot(deltaX, deltaY) > 7) return;
        const pickedIndex = sketchRef.current?.pickLens(event.clientX, event.clientY);
        if (pickedIndex == null) return;
        if (pickedIndex === activeIndexRef.current) callbacksRef.current.onActivate(pickedIndex);
        else {
          activeIndexRef.current = pickedIndex;
          sketchRef.current?.focusItem(pickedIndex);
          callbacksRef.current.onActiveChange(pickedIndex);
        }
      }}
      onPointerCancel={cancelPointerInteraction}
      onLostPointerCapture={() => {
        if (pointerStart.current) cancelPointerInteraction();
      }}
      onPointerLeave={event => {
        if (event.buttons === 0) event.currentTarget.dataset.cursor = 'default';
      }}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          focusRelative(-1);
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          focusRelative(1);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          callbacksRef.current.onActivate(activeIndexRef.current);
        }
      }}
    />
  );
};

export default InfiniteProjectMenu;

export const PARTICLE_CONFIG = { count: 180, radius: 120, displacement: 12, trail: 18, decayMs: 800 };

export function particleSeeds(count = PARTICLE_CONFIG.count): Float32Array {
  let seed = 73921;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const layer = i % 10 < 6 ? 0 : i % 10 < 9 ? 1 : 2;
    data.set([random(), random(), layer, random()], i * 4);
  }
  return data;
}

const vertex = `#version 300 es
precision highp float;
layout(location=0) in vec4 seed;
uniform vec2 viewport;
uniform vec2 pointer;
uniform vec2 direction;
uniform float energy;
uniform vec4 safeAreas[3];
out vec2 local;
out float halfLength;
out float thickness;
out vec4 tint;
void main(){
  vec2 p = seed.xy * viewport;
  float influence = pow(1.0-smoothstep(0.0, ${PARTICLE_CONFIG.radius}.0, distance(p,pointer*viewport)),2.0)*energy;
  float depth = (seed.z+1.0)/3.0;
  vec2 axis = normalize(mix(vec2(.93,.36),direction, influence)+vec2(.00001));
  p += direction * influence * depth * ${PARTICLE_CONFIG.displacement}.0;
  float quiet = 1.0;
  for(int i=0;i<3;i++){
    vec2 outside = max(max(safeAreas[i].xy-p,p-safeAreas[i].zw),vec2(0));
    quiet *= mix(.14,1.0,smoothstep(0.0,48.0,length(outside)));
  }
  float bottom = smoothstep(0.0,.14,seed.y);
  float center = mix(.4,1.0,smoothstep(.12,.34,length(seed.xy-vec2(.5))));
  float alpha = mix(.12,.32,depth) * quiet * bottom * center;
  alpha += influence*.22*quiet*bottom;
  vec3 color = seed.w>.965 ? vec3(.36,.66,.61) : vec3(.80,.79,.73);
  color = mix(color,vec3(.80,.47,.36),influence*step(.6,seed.w));
  thickness = mix(.55,1.05,depth);
  halfLength = min(${PARTICLE_CONFIG.trail}.0*.5, thickness+step(1.5,seed.z)*1.1+influence*depth*7.0);
  vec2 corners[6] = vec2[6](vec2(-1,-1),vec2(1,-1),vec2(-1,1),vec2(-1,1),vec2(1,-1),vec2(1,1));
  local = corners[gl_VertexID]*vec2(halfLength+1.0,thickness+1.0);
  vec2 offset = axis*local.x+vec2(-axis.y,axis.x)*local.y;
  gl_Position = vec4((p+offset)/viewport*2.0-1.0,0,1);
  tint = vec4(color,alpha);
}`;
const fragment = `#version 300 es
precision highp float;
in vec2 local;
in float halfLength;
in float thickness;
in vec4 tint;
out vec4 color;
void main(){
  float d = length(vec2(max(abs(local.x)-max(0.0,halfLength-thickness),0.0),local.y));
  float coverage = 1.0-smoothstep(max(0.0,thickness-.5),thickness+.5,d);
  float alpha = tint.a*coverage;
  color = vec4(tint.rgb*alpha,alpha);
}`;

export class ParticleField {
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private buffer: WebGLBuffer;
  private locations: Record<string, WebGLUniformLocation | null> = {};
  private safeAreas = new Float32Array(12).fill(-1000);
  private observer: ResizeObserver;
  private width = 1;
  private height = 1;

  constructor(private gl: WebGL2RenderingContext, private canvas: HTMLCanvasElement) {
    const program = gl.createProgram()!;
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]] as const) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { const message = gl.getShaderInfoLog(shader); gl.deleteShader(shader); gl.deleteProgram(program); throw new Error(message ?? 'Particle shader failed'); }
      gl.attachShader(program, shader); gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); throw new Error('Particle program failed'); }
    this.program = program;
    this.vao = gl.createVertexArray()!;
    this.buffer = gl.createBuffer()!;
    gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, particleSeeds(), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0); gl.vertexAttribDivisor(0, 1);
    gl.bindVertexArray(null);
    for (const key of ['viewport','pointer','direction','energy','safeAreas']) this.locations[key] = gl.getUniformLocation(program,key === 'safeAreas' ? 'safeAreas[0]' : key);
    this.observer = new ResizeObserver(() => this.measure());
    this.observer.observe(canvas);
    canvas.closest('section')?.querySelectorAll('.project-title-panel,.project-detail-panel,.projects-heading').forEach(el => this.observer.observe(el));
    this.measure();
  }
  private measure() {
    const bounds = this.canvas.getBoundingClientRect();
    this.width = Math.max(1,bounds.width); this.height = Math.max(1,bounds.height);
    this.canvas.closest('section')?.querySelectorAll('.project-title-panel,.project-detail-panel,.projects-heading').forEach((el,i) => {
      if(i>2) return;
      const r = el.getBoundingClientRect();
      this.safeAreas.set([r.left-bounds.left,bounds.bottom-r.bottom,r.right-bounds.left,bounds.bottom-r.top],i*4);
    });
  }
  draw(pointer: ArrayLike<number>, direction: ArrayLike<number>, energy: number) {
    const gl = this.gl;
    gl.useProgram(this.program); gl.bindVertexArray(this.vao);
    gl.uniform2f(this.locations.viewport,this.width,this.height);
    gl.uniform2f(this.locations.pointer,pointer[0],pointer[1]);
    gl.uniform2f(this.locations.direction,direction[0],direction[1]);
    gl.uniform1f(this.locations.energy,energy);
    gl.uniform4fv(this.locations.safeAreas,this.safeAreas);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArraysInstanced(gl.TRIANGLES,0,6,PARTICLE_CONFIG.count);
    gl.disable(gl.BLEND);
  }
  destroy() { this.observer.disconnect(); this.gl.deleteBuffer(this.buffer); this.gl.deleteVertexArray(this.vao); this.gl.deleteProgram(this.program); }
}

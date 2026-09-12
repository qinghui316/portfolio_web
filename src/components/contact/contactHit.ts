import type { ContactTarget } from './contactState';
import type { Point } from './contactLayout';

type Polygon = readonly (readonly [number, number])[];
const rect = (left: number, top: number, right: number, bottom: number): Polygon => [[left,top],[right,top],[right,bottom],[left,bottom]];

// Fixed outlines in sprite coordinates: body + open panel, antennas and dish.
const silhouettes: Record<ContactTarget, readonly Polygon[]> = {
  phone: [
    [[.075,.39],[.18,.34],[.30,.305],[.61,.345],[.685,.385],[.72,.445],[.87,.407],[.94,.418],[.977,.443],[.978,.85],[.78,.86],[.785,.945],[.70,.945],[.69,.915],[.49,.915],[.48,.963],[.404,.963],[.39,.926],[.075,.918],[.073,.945],[.005,.943],[.005,.90],[.022,.846],[.07,.844]],
    rect(.295,.007,.355,.34), rect(.242,.047,.29,.34), rect(.497,.144,.535,.375), rect(.55,.26,.595,.37),
    [[.134,.255],[.138,.223],[.17,.18],[.205,.158],[.24,.162],[.265,.19],[.27,.235],[.253,.279],[.22,.31],[.176,.314],[.143,.292]],
  ],
  email: [
    [[.08,.64],[.18,.576],[.267,.576],[.305,.41],[.327,.326],[.878,.373],[.91,.414],[.89,.566],[.84,.625],[.903,.673],[.92,.715],[.92,.89],[.88,.911],[.88,.937],[.80,.937],[.795,.915],[.26,.927],[.245,.943],[.145,.943],[.13,.906],[.08,.87]],
    rect(.198,.244,.228,.605), rect(.227,.424,.254,.605),
  ],
};

function paddedPolygon(points: Point[], padding: number): Point[] {
  return points.map((point,index) => {
    const before=points[(index+points.length-1)%points.length], after=points[(index+1)%points.length];
    const normal = (a: Point,b: Point) => { const length=Math.hypot(b.x-a.x,b.y-a.y)||1; return {x:(b.y-a.y)/length,y:-(b.x-a.x)/length}; };
    const a=normal(before,point), b=normal(point,after);
    const scale=Math.min(padding*3,padding/Math.max(.1,1+a.x*b.x+a.y*b.y));
    return {x:point.x+(a.x+b.x)*scale,y:point.y+(a.y+b.y)*scale};
  });
}

export function deviceHitPath(target: ContactTarget, width: number, height: number, padding = 4): string {
  return silhouettes[target].map(polygon => {
    const points = paddedPolygon(polygon.map(([x,y])=>({x:x*width,y:y*height})),padding);
    return points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')+' Z';
  }).join(' ');
}

export function segmentDistance(point: Point, start: Point, end: Point): number {
  const dx=end.x-start.x, dy=end.y-start.y, length=dx*dx+dy*dy;
  const t=length ? Math.max(0,Math.min(1,((point.x-start.x)*dx+(point.y-start.y)*dy)/length)) : 0;
  return Math.hypot(point.x-start.x-t*dx,point.y-start.y-t*dy);
}

export function inContactCorridor(point: Point, start: Point, end: Point, direction: number, radius = 16): boolean {
  const c1={x:start.x+28*direction,y:start.y-8}, c2={x:end.x-22*direction,y:end.y-28};
  let previous=start;
  for(let step=1;step<=24;step++) {
    const t=step/24,u=1-t;
    const next={x:u*u*u*start.x+3*u*u*t*c1.x+3*u*t*t*c2.x+t*t*t*end.x,y:u*u*u*start.y+3*u*u*t*c1.y+3*u*t*t*c2.y+t*t*t*end.y};
    if(segmentDistance(point,previous,next)<=radius) return true;
    previous=next;
  }
  return false;
}

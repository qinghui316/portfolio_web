export type Point = { x: number; y: number };
export function handArrow(start: Point, end: Point, direction: number) {
  const c1 = { x: start.x + 28 * direction, y: start.y - 8 };
  const c2 = { x: end.x - 22 * direction, y: end.y - 28 };
  const angle = Math.atan2(end.y - c2.y, end.x - c2.x);
  const tip = (side: number) => ({ x: end.x - 12 * Math.cos(angle) + side * 5 * Math.sin(angle), y: end.y - 12 * Math.sin(angle) - side * 5 * Math.cos(angle) });
  const a = tip(1), b = tip(-1);
  return `M${start.x},${start.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y} M${a.x},${a.y} L${end.x},${end.y} L${b.x},${b.y}`;
}

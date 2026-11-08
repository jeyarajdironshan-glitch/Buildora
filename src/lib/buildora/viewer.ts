import type { Plan, Room } from "./types";

export interface WallEdge { x: number; z: number; length: number; axis: "x" | "z"; floor: number; exterior: boolean }

/** Split collinear room edges before deduplication, including unequal shared edges. */
export function wallEdges(plan: Plan): WallEdge[] {
  const lines = new Map<string, { axis: "x" | "z"; at: number; floor: number; spans: [number, number][] }>();
  for (const r of plan.rooms) {
    if (r.type === "balcony" || r.w <= 0 || r.h <= 0) continue;
    for (const [axis, at, start, end] of [["x", r.y, r.x, r.x + r.w], ["x", r.y + r.h, r.x, r.x + r.w], ["z", r.x, r.y, r.y + r.h], ["z", r.x + r.w, r.y, r.y + r.h]] as ["x" | "z", number, number, number][]) {
      const key = `${r.floor}:${axis}:${at.toFixed(3)}`;
      const line = lines.get(key) ?? { axis, at, floor: r.floor, spans: [] };
      line.spans.push([start, end]); lines.set(key, line);
    }
  }
  const out: WallEdge[] = [];
  for (const line of lines.values()) {
    const points = [...new Set(line.spans.flat())].sort((a, b) => a - b);
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1], mid = (a + b) / 2;
      const count = line.spans.filter(([s, e]) => mid > s && mid < e).length;
      if (!count) continue;
      out.push({ x: line.axis === "x" ? mid : line.at, z: line.axis === "z" ? mid : line.at, length: b - a, axis: line.axis, floor: line.floor, exterior: count === 1 });
    }
  }
  return out;
}

/** Preserve edited floors; only newly added storeys copy the existing upper/ground layout. */
export function resizePlanFloors(plan: Plan, count: number): Plan {
  const floors = Math.max(1, Math.min(3, Math.round(count)));
  const rooms: Room[] = plan.rooms.filter((r) => r.floor < floors);
  const source = plan.rooms.filter((r) => r.floor === (plan.floors > 1 ? 1 : 0));
  for (let floor = plan.floors; floor < floors; floor++) {
    rooms.push(...source.map((r) => ({ ...r, id: `${r.id}-storey-${floor}`, floor })));
  }
  return { ...plan, floors, rooms };
}
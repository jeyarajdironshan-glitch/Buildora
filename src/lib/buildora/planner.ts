import type { Land, Plan, Requirements, Room } from "./types";

/** Room catalogue: target areas (m²) and zone used by the layout engine. */
export const ROOM_CATALOG: Record<string, { label: string; area: number; zone: "public" | "service" | "private" }> = {
  living: { label: "Living Room", area: 22, zone: "public" },
  dining: { label: "Dining", area: 13, zone: "public" },
  kitchen: { label: "Kitchen", area: 11, zone: "service" },
  bedroom: { label: "Bedroom", area: 13, zone: "private" },
  bathroom: { label: "Bathroom", area: 4.5, zone: "service" },
  parking: { label: "Parking", area: 16, zone: "public" },
  guest: { label: "Guest Room", area: 12, zone: "private" },
  study: { label: "Study", area: 9, zone: "private" },
  store: { label: "Store", area: 4, zone: "service" },
  master: { label: "Master Bedroom", area: 18, zone: "private" },
  attached_bath: { label: "Attached Bath", area: 5, zone: "service" },
  family: { label: "Family Area", area: 16, zone: "public" },
  balcony: { label: "Balcony", area: 7, zone: "public" },
  prayer: { label: "Prayer Room", area: 6, zone: "private" },
  laundry: { label: "Laundry", area: 5, zone: "service" },
};

export const SETBACK = { road: 3, side: 1, rear: 1.5 };
const CORE = 2.6; // staircase + hall strip width (m)

interface Rect { x: number; y: number; w: number; h: number }
interface Item { type: string; name: string; area: number; zone: string }

export function buildableRect(land: Land): Rect {
  let w = land.width;
  let l = land.length;
  if (land.shape === "l-shaped" && land.cutWidth && land.cutLength) {
    // use the larger full rectangle that avoids the cut-out
    const a1 = (land.width - land.cutWidth) * land.length;
    const a2 = land.width * (land.length - land.cutLength);
    if (a1 >= a2) w = land.width - land.cutWidth; else l = land.length - land.cutLength;
  }
  const front = land.roadSide === "front" ? SETBACK.road : SETBACK.rear;
  const rear = land.roadSide === "rear" ? SETBACK.road : SETBACK.rear;
  const left = land.roadSide === "left" ? SETBACK.road : SETBACK.side;
  const right = land.roadSide === "right" ? SETBACK.road : SETBACK.side;
  return { x: left, y: front, w: Math.max(0, w - left - right), h: Math.max(0, l - front - rear) };
}

function items(counts: Record<string, number>, floor: number, req: Requirements): Item[] {
  const out: Item[] = [];
  for (const [type, n] of Object.entries(counts)) {
    if (type === "staircase") continue;
    const c = ROOM_CATALOG[type];
    if (!c) continue;
    for (let i = 0; i < n; i++) {
      let area = c.area;
      if (type === "kitchen" && req.openKitchen) area += 2;
      out.push({ type, name: n > 1 ? `${c.label} ${i + 1}` : c.label, area, zone: c.zone });
    }
  }
  if (floor > 0 && out.length === 0) out.push({ type: "family", name: "Family Area", area: 16, zone: "public" });
  return out;
}

/** Ordered binary-split treemap: fills rect exactly, no overlaps. */
function treemap(list: Item[], r: Rect, out: Omit<Room, "id" | "floor">[]) {
  if (list.length === 0) return;
  if (list.length === 1) { out.push({ type: list[0].type, name: list[0].name, ...r }); return; }
  const total = list.reduce((s, i) => s + i.area, 0);
  let acc = 0, k = 0;
  while (k < list.length - 1 && acc + list[k].area <= total / 2) { acc += list[k].area; k++; }
  if (k === 0) { acc = list[0].area; k = 1; }
  const f = acc / total;
  const [a, b] = [list.slice(0, k), list.slice(k)];
  if (r.w >= r.h) {
    treemap(a, { ...r, w: r.w * f }, out);
    treemap(b, { ...r, x: r.x + r.w * f, w: r.w * (1 - f) }, out);
  } else {
    treemap(a, { ...r, h: r.h * f }, out);
    treemap(b, { ...r, y: r.y + r.h * f, h: r.h * (1 - f) }, out);
  }
}

const zoneOrder = (order: string[]) => (a: Item, b: Item) => order.indexOf(a.zone) - order.indexOf(b.zone) || b.area - a.area;

interface Variant {
  name: string;
  description: string;
  coreAxis: "x" | "y"; // core strip runs across width (y position) or along length (x position)
  corePos: number; // 0..1 position of the core
  order: string[];
  compact: number; // footprint fill factor preference
}

const VARIANTS: Variant[] = [
  { name: "Linear Flow", description: "Public spaces face the road, bedrooms sit quietly at the rear. A central hall links both zones.", coreAxis: "y", corePos: 0.45, order: ["public", "service", "private"], compact: 1 },
  { name: "Side Zoning", description: "Living and bedrooms split left and right of a staircase spine for strong privacy.", coreAxis: "x", corePos: 0.5, order: ["public", "service", "private"], compact: 1 },
  { name: "Garden Court", description: "A compact footprint leaves generous garden space with cross-ventilation through every room.", coreAxis: "y", corePos: 0.55, order: ["private", "service", "public"], compact: 0.82 },
  { name: "Service Front", description: "Kitchen and utilities buffer the road side; quiet living opens to the rear garden.", coreAxis: "x", corePos: 0.35, order: ["service", "public", "private"], compact: 0.92 },
];

const r1 = (n: number) => Math.round(n * 10) / 10;

export function generatePlans(land: Land, req: Requirements): Plan[] {
  const b = buildableRect(land);
  const floors = Math.max(1, Math.min(3, req.floors));
  const groundItems = items(req.ground, 0, req);
  const upperItems = floors > 1 ? items(req.upper, 1, req) : [];
  const need = Math.max(
    groundItems.reduce((s, i) => s + i.area, 0),
    upperItems.reduce((s, i) => s + i.area, 0),
  ) * 1.1 + CORE * 8;

  return VARIANTS.map((v, vi) => {
    // size footprint to the requirement, never past the buildable area
    const maxA = b.w * b.h * v.compact * (req.garden ? 0.85 : 1);
    const target = Math.min(need, maxA);
    const scale = Math.sqrt(target / (b.w * b.h));
    const fw = r1(Math.min(b.w, Math.max(6, b.w * scale)));
    const fh = r1(Math.min(b.h, Math.max(6, target / fw)));
    const fp = { x: r1(b.x + (b.w - fw) / 2), y: r1(b.y), w: fw, h: fh };

    const core: Rect = v.coreAxis === "y"
      ? { x: fp.x, y: fp.y + (fp.h - CORE) * v.corePos, w: fp.w, h: CORE }
      : { x: fp.x + (fp.w - CORE) * v.corePos, y: fp.y, w: CORE, h: fp.h };
    const sideA: Rect = v.coreAxis === "y" ? { x: fp.x, y: fp.y, w: fp.w, h: core.y - fp.y } : { x: fp.x, y: fp.y, w: core.x - fp.x, h: fp.h };
    const sideB: Rect = v.coreAxis === "y"
      ? { x: fp.x, y: core.y + CORE, w: fp.w, h: fp.y + fp.h - core.y - CORE }
      : { x: core.x + CORE, y: fp.y, w: fp.x + fp.w - core.x - CORE, h: fp.h };

    const rooms: Room[] = [];
    const place = (list: Item[], floor: number) => {
      const sorted = [...list].sort(zoneOrder(v.order));
      const total = sorted.reduce((s, i) => s + i.area, 0);
      const aShare = (sideA.w * sideA.h) / (sideA.w * sideA.h + sideB.w * sideB.h);
      let acc = 0, k = 0;
      while (k < sorted.length && acc + sorted[k].area <= total * aShare + 0.01) { acc += sorted[k].area; k++; }
      if (k === 0 && sorted.length > 1) k = 1;
      if (k === sorted.length && sorted.length > 1) k = sorted.length - 1;
      const out: Omit<Room, "id" | "floor">[] = [];
      treemap(sorted.slice(0, k), sideA, out);
      treemap(sorted.slice(k), sideB, out);
      out.push({ type: "staircase", name: floor === 0 ? "Stairs & Hall" : "Stairs & Landing", ...core });
      out.forEach((o, i) => rooms.push({ ...o, x: r1(o.x), y: r1(o.y), w: r1(o.w), h: r1(o.h), floor, id: `f${floor}-${vi}-${i}` }));
    };
    place(groundItems, 0);
    for (let f = 1; f < floors; f++) place(upperItems, f);

    return { id: `plan-${vi + 1}`, name: v.name, description: v.description, floors, footprint: fp, rooms };
  });
}

export function overlaps(a: Room, b: Room) {
  return a.floor === b.floor && a.x < b.x + b.w - 0.01 && b.x < a.x + a.w - 0.01 && a.y < b.y + b.h - 0.01 && b.y < a.y + a.h - 0.01;
}

export function planWarnings(plan: Plan, land: Land): string[] {
  const w: string[] = [];
  const b = buildableRect(land);
  for (const r of plan.rooms) {
    if (r.x < b.x - 0.05 || r.y < b.y - 0.05 || r.x + r.w > b.x + b.w + 0.05 || r.y + r.h > b.y + b.h + 0.05)
      w.push(`${r.name} (floor ${r.floor}) crosses the setback line.`);
    if (r.type !== "staircase" && (r.w < 1.8 || r.h < 1.8)) w.push(`${r.name} is narrower than 1.8 m.`);
  }
  for (let i = 0; i < plan.rooms.length; i++)
    for (let j = i + 1; j < plan.rooms.length; j++)
      if (overlaps(plan.rooms[i], plan.rooms[j])) w.push(`${plan.rooms[i].name} overlaps ${plan.rooms[j].name}.`);
  return w;
}

export function landWarnings(land: Land): string[] {
  const w: string[] = [];
  if (!(land.width > 0) || !(land.length > 0)) w.push("Enter land width and length.");
  if (land.width < 6) w.push("Land is narrower than 6 m – very limited building width after setbacks.");
  if (!land.location) w.push("Land location is missing.");
  if (land.terrain !== "flat" && !land.soil) w.push("Soil information is recommended for sloped land.");
  if (land.slope > 15) w.push("Slope above 15% may need retaining walls (not included in estimates).");
  if (land.roadWidth < 3) w.push("Road narrower than 3 m may restrict building approval and truck access.");
  return w;
}

import type { Finishes, Plan } from "./types";

export type CostKey = "concrete" | "steel" | "masonry" | "plaster" | "paint" | "floor" | "roof_pitched" | "roof_flat" | "doors" | "windows" | "bath" | "kitchen" | "electrical" | "plumbing";

/**
 * Sample Sri Lankan unit rates (LKR). These are editable reference figures,
 * not live market prices.
 */
export const RATES = {
  concrete_m3: 42000, // grade 25 incl. formwork & steel allowance
  steel_kg: 330,
  brick_m3: 26000, // cement block / brick masonry
  plaster_m2: 1500,
  paint_m2: 650,
  floor_tile_m2: 6500,
  roof_m2: 9500,
  door: 65000,
  window: 48000,
  bath_fitout: 380000,
  kitchen_fitout: 750000,
  electrical_m2: 3200,
  plumbing_m2: 2200,
  labour_factor: 0.32, // labour as share of materials
  contingency: 0.08,
};

export const REGIONAL: Record<string, number> = {
  Colombo: 1.1, Gampaha: 1.05, Kalutara: 1.02, Kandy: 1.04, Galle: 1.03, "Nuwara Eliya": 1.12, Jaffna: 1.08,
};
const LEVEL = { standard: 1, premium: 1.3, luxury: 1.7 };
const WALL_H = 3;
const EXT_T = 0.225;
const INT_T = 0.115;

export interface CostLine { key?: CostKey; item: string; qty: number; unit: string; rate: number; amount: number }
export interface Estimate { lines: CostLine[]; subtotal: number; labour: number; contingency: number; total: number; area: number; perSqft: number; regional: number }

export function estimate(plan: Plan, finishes: Finishes, district: string): Estimate {
  const fp = plan.footprint;
  const floorArea = plan.rooms.reduce((s, r) => s + r.w * r.h, 0);
  const extPerimeter = 2 * (fp.w + fp.h) * plan.floors;
  const roomPerim = plan.rooms.reduce((s, r) => s + 2 * (r.w + r.h), 0);
  const intWall = Math.max(0, (roomPerim - extPerimeter) / 2);
  const baths = plan.rooms.filter((r) => r.type === "bathroom" || r.type === "attached_bath").length;
  const kitchens = plan.rooms.filter((r) => r.type === "kitchen").length;
  const doors = plan.rooms.filter((r) => r.type !== "balcony").length + 1;
  const windows = Math.round(extPerimeter / 3.2);
  const lvl = LEVEL[finishes.level];
  const reg = REGIONAL[district] ?? 1;

  const foundationConc = extPerimeter / plan.floors * 0.9 * 0.6 + fp.w * fp.h * 0.1;
  const slabConc = fp.w * fp.h * 0.125 * (plan.floors - 1) + (finishes.roofType === "flat" ? fp.w * fp.h * 0.125 : 0);
  const columnConc = Math.ceil((fp.w / 3.5 + 1) * (fp.h / 3.5 + 1)) * 0.23 * 0.23 * WALL_H * plan.floors;
  const concrete = foundationConc + slabConc + columnConc;
  const brick = (extPerimeter * EXT_T + intWall * INT_T) * WALL_H * 0.85;
  const wallFaces = (extPerimeter * 2 + intWall * 2) * WALL_H * 0.85;
  const roofArea = fp.w * fp.h * (finishes.roofType === "pitched" ? 1.25 : 1.05);

  const raw: [CostKey, string, number, string, number][] = [
    ["concrete", "Concrete (foundation, slabs, columns)", concrete, "m³", RATES.concrete_m3],
    ["steel", "Reinforcement steel", concrete * 95, "kg", RATES.steel_kg],
    ["masonry", "Masonry walls", brick, "m³", RATES.brick_m3],
    ["plaster", "Plastering", wallFaces, "m²", RATES.plaster_m2],
    ["paint", "Painting", wallFaces, "m²", RATES.paint_m2 * lvl],
    ["floor", "Floor finishes", floorArea, "m²", RATES.floor_tile_m2 * lvl],
    [finishes.roofType === "pitched" ? "roof_pitched" : "roof_flat", finishes.roofType === "pitched" ? "Pitched roof (timber + tiles)" : "Flat roof waterproofing", roofArea, "m²", RATES.roof_m2 * lvl],
    ["doors", "Doors", doors, "nos", RATES.door * lvl],
    ["windows", "Windows", windows, "nos", RATES.window * lvl],
    ["bath", "Bathroom fit-out", baths, "nos", RATES.bath_fitout * lvl],
    ["kitchen", "Kitchen fit-out", kitchens, "nos", RATES.kitchen_fitout * lvl],
    ["electrical", "Electrical installation", floorArea, "m²", RATES.electrical_m2],
    ["plumbing", "Plumbing installation", floorArea, "m²", RATES.plumbing_m2],
  ];
  const lines = raw.map(([key, item, qty, unit, rate]) => {
    const r = rate * reg;
    return { key, item, qty, unit, rate: r, amount: qty * r };
  });
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const labour = subtotal * RATES.labour_factor;
  const contingency = (subtotal + labour) * RATES.contingency;
  const total = subtotal + labour + contingency;
  return { lines, subtotal, labour, contingency, total, area: floorArea, perSqft: total / (floorArea * 10.7639), regional: reg };
}

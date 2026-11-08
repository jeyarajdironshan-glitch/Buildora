import { describe, expect, it } from "vitest";
import { wallEdges, resizePlanFloors } from "./viewer";
import { generatePlans } from "./planner";
import { DEFAULT_LAND, DEFAULT_REQ } from "./types";

describe("3D customer choices", () => {
  const plan = generatePlans(DEFAULT_LAND, DEFAULT_REQ)[0];
  it("can select one, two or three storeys without losing existing edited rooms", () => {
    for (const count of [1, 2, 3]) {
      const changed = resizePlanFloors(plan, count);
      expect(changed.floors).toBe(count);
      expect([...new Set(changed.rooms.map((r) => r.floor))].sort()).toEqual(Array.from({ length: count }, (_, i) => i));
      expect(changed.rooms.filter((r) => r.floor === 0)).toEqual(plan.rooms.filter((r) => r.floor === 0));
    }
  });
  it("renders a shared partition once, even when adjacent rooms have unequal edges", () => {
    const p = { ...plan, rooms: [
      { id: "a", type: "living", name: "A", floor: 0, x: 0, y: 0, w: 4, h: 4 },
      { id: "b", type: "bedroom", name: "B", floor: 0, x: 4, y: 0, w: 3, h: 2 },
      { id: "c", type: "bedroom", name: "C", floor: 0, x: 4, y: 2, w: 3, h: 2 },
    ] };
    const shared = wallEdges(p).filter((w) => w.axis === "z" && w.x === 4);
    expect(shared).toHaveLength(2);
    expect(shared.reduce((sum, w) => sum + w.length, 0)).toBe(4);
    expect(shared.every((w) => !w.exterior)).toBe(true);
  });
});
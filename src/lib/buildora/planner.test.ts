import { describe, expect, it } from "vitest";
import { generatePlans, buildableRect, planWarnings } from "./planner";
import { DEFAULT_LAND, DEFAULT_REQ } from "./types";
import { sqmToPerch } from "./units";

describe("planner", () => {
  it("generates exactly four plans", () => {
    expect(generatePlans(DEFAULT_LAND, DEFAULT_REQ)).toHaveLength(4);
  });
  it("plans have no overlaps and respect setbacks", () => {
    for (const p of generatePlans(DEFAULT_LAND, DEFAULT_REQ)) {
      expect(planWarnings(p, DEFAULT_LAND).filter((w) => w.code === "overlap" || w.code === "setback")).toEqual([]);
    }
  });
  it("applies a 3 m road setback", () => {
    expect(buildableRect(DEFAULT_LAND).y).toBe(3);
  });
  it("staircase aligns between floors", () => {
    const p = generatePlans(DEFAULT_LAND, DEFAULT_REQ)[0];
    const [a, b] = p.rooms.filter((r) => r.type === "staircase");
    expect([a.x, a.y, a.w, a.h]).toEqual([b.x, b.y, b.w, b.h]);
  });
  it("1 perch = 25.29 m²", () => {
    expect(sqmToPerch(25.29285264)).toBeCloseTo(1, 6);
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("reactflow", () => ({
  Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
  getStraightPath: ({ sourceX, sourceY, targetX, targetY }) => [
    `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`,
    (sourceX + targetX) / 2,
    (sourceY + targetY) / 2,
  ],
  getSmoothStepPath: ({ sourceX, sourceY, targetX, targetY }) => [
    `M ${sourceX} ${sourceY} S ${targetX} ${targetY}`,
    (sourceX + targetX) / 2,
    (sourceY + targetY) / 2,
  ],
}));

import {
  clamp,
  dedupeConsecutivePoints,
  getRoundedPolylinePath,
  getPolylineMidpointByLength,
  getParallelMeta,
  getAssociationLayout,
} from "../associationUtils.js";
import { ASSOCIATION_LINE_STYLE_STRAIGHT, ASSOCIATION_LINE_STYLE_MANUAL } from "../../../../model/constants.js";

const makeNode = (x, y, width, height) => ({
  internals: { positionAbsolute: { x, y } },
  measured: { width, height },
});

// ─── clamp ────────────────────────────────────────────────────────────────────

describe("clamp", () => {
  it("returns value when it is within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("returns min when value is below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns max when value is above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

// ─── dedupeConsecutivePoints ──────────────────────────────────────────────────

describe("dedupeConsecutivePoints", () => {
  it("removes consecutive duplicates", () => {
    expect(dedupeConsecutivePoints([{ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 2 }]))
      .toEqual([{ x: 1, y: 1 }, { x: 2, y: 2 }]);
  });

  it("keeps non-consecutive duplicates", () => {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }];
    expect(dedupeConsecutivePoints(pts)).toHaveLength(3);
  });

  it("returns empty array for empty input", () => {
    expect(dedupeConsecutivePoints([])).toEqual([]);
  });
});

// ─── getRoundedPolylinePath ───────────────────────────────────────────────────

describe("getRoundedPolylinePath", () => {
  it("returns '' for empty/non-array input", () => {
    expect(getRoundedPolylinePath([])).toBe("");
    expect(getRoundedPolylinePath(null)).toBe("");
  });

  it("returns move command for single point", () => {
    expect(getRoundedPolylinePath([{ x: 1, y: 2 }])).toBe("M 1 2");
  });

  it("generates L commands with zero radius", () => {
    expect(getRoundedPolylinePath([{ x: 0, y: 0 }, { x: 5, y: 0 }], 0)).toBe("M 0 0 L 5 0");
  });

  it("includes Q for corners with positive radius", () => {
    const path = getRoundedPolylinePath(
      [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
      5,
    );
    expect(path).toContain("Q");
  });
});

// ─── getPolylineMidpointByLength ──────────────────────────────────────────────

describe("getPolylineMidpointByLength", () => {
  it("returns { x:0, y:0 } for empty/non-array input", () => {
    expect(getPolylineMidpointByLength([])).toEqual({ x: 0, y: 0 });
    expect(getPolylineMidpointByLength(null)).toEqual({ x: 0, y: 0 });
  });

  it("returns the single point for a one-element array", () => {
    expect(getPolylineMidpointByLength([{ x: 3, y: 7 }])).toEqual({ x: 3, y: 7 });
  });

  it("returns the midpoint for a two-point horizontal segment", () => {
    const mid = getPolylineMidpointByLength([{ x: 0, y: 0 }, { x: 10, y: 0 }]);
    expect(mid).toEqual({ x: 5, y: 0 });
  });

  it("returns the midpoint by arc-length for an L-shaped path", () => {
    // Segment 1: (0,0)→(10,0) length 10; Segment 2: (10,0)→(10,10) length 10
    // Total = 20, midpoint at distance 10 → exactly at the corner (10,0)
    const mid = getPolylineMidpointByLength([
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 },
    ]);
    expect(mid.x).toBeCloseTo(10);
    expect(mid.y).toBeCloseTo(0);
  });

  it("returns first point for zero-length polyline", () => {
    const mid = getPolylineMidpointByLength([{ x: 5, y: 5 }, { x: 5, y: 5 }]);
    expect(mid).toEqual({ x: 5, y: 5 });
  });
});

// ─── getParallelMeta ──────────────────────────────────────────────────────────

describe("getParallelMeta", () => {
  it("returns defaults when data has no parallel fields", () => {
    expect(getParallelMeta({})).toEqual({ parallelCount: 1, parallelIndex: 0, parallelOffset: 0 });
    expect(getParallelMeta(null)).toEqual({ parallelCount: 1, parallelIndex: 0, parallelOffset: 0 });
  });

  it("returns zero offset for a single edge (count=1)", () => {
    const meta = getParallelMeta({ parallelCount: 1, parallelIndex: 0 });
    expect(meta.parallelOffset).toBe(0);
  });

  it("computes the correct offset for parallel edges", () => {
    // Two parallel edges: index 0 → offset -0.5, index 1 → offset +0.5
    expect(getParallelMeta({ parallelCount: 2, parallelIndex: 0 }).parallelOffset).toBeCloseTo(-0.5);
    expect(getParallelMeta({ parallelCount: 2, parallelIndex: 1 }).parallelOffset).toBeCloseTo(0.5);
  });

  it("returns centred offset for an odd count", () => {
    // Three edges: index 1 (middle) → offset 0
    expect(getParallelMeta({ parallelCount: 3, parallelIndex: 1 }).parallelOffset).toBeCloseTo(0);
  });
});

// ─── getAssociationLayout ─────────────────────────────────────────────────────

describe("getAssociationLayout", () => {
  it("returns null when source or target node is missing", () => {
    const node = makeNode(0, 0, 100, 60);
    expect(getAssociationLayout(null, node, {})).toBeNull();
    expect(getAssociationLayout(node, null, {})).toBeNull();
  });

  it("returns a layout object with required keys for two valid nodes", () => {
    const src = makeNode(0, 0, 100, 60);
    const tgt = makeNode(200, 0, 100, 60);
    const layout = getAssociationLayout(src, tgt, {});
    expect(layout).not.toBeNull();
    expect(typeof layout.edgePath).toBe("string");
    expect(typeof layout.labelX).toBe("number");
    expect(typeof layout.labelY).toBe("number");
    expect(Array.isArray(layout.pathPoints)).toBe(true);
    expect(layout.isManualRouting).toBe(false);
  });

  it("uses straight path when lineStyle is straight", () => {
    const src = makeNode(0, 0, 100, 60);
    const tgt = makeNode(200, 0, 100, 60);
    const layout = getAssociationLayout(src, tgt, { lineStyle: ASSOCIATION_LINE_STYLE_STRAIGHT });
    expect(layout.edgePath).toContain("L");
    expect(layout.isManualRouting).toBe(false);
  });

  it("uses manual routing when lineStyle is manual", () => {
    const src = makeNode(0, 0, 100, 60);
    const tgt = makeNode(200, 0, 100, 60);
    const layout = getAssociationLayout(src, tgt, { lineStyle: ASSOCIATION_LINE_STYLE_MANUAL });
    expect(layout.isManualRouting).toBe(true);
  });

  it("uses manual routing when control points are present", () => {
    const src = makeNode(0, 0, 100, 60);
    const tgt = makeNode(200, 0, 100, 60);
    const layout = getAssociationLayout(src, tgt, { controlPoints: [{ x: 100, y: 50 }] });
    expect(layout.isManualRouting).toBe(true);
  });
});

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
  normalizeRelationshipControlPoints,
  normalizeLineStyle,
  dedupeConsecutivePoints,
  getRoundedPolylinePath,
  getOrthogonalIncomingDirection,
  getRelationshipLayout,
  getRelationshipLayoutFromNodes,
} from "../relationshipUtils.js";
import {
  ASSOCIATION_LINE_STYLE_STRAIGHT,
  ASSOCIATION_LINE_STYLE_MANUAL,
  ASSOCIATION_LINE_STYLE_ORTHOGONAL,
} from "../../../../model/constants.js";

// ─── normalizeLineStyle ───────────────────────────────────────────────────────

describe("normalizeLineStyle", () => {
  it("returns straight for ASSOCIATION_LINE_STYLE_STRAIGHT", () => {
    expect(normalizeLineStyle(ASSOCIATION_LINE_STYLE_STRAIGHT)).toBe(ASSOCIATION_LINE_STYLE_STRAIGHT);
  });

  it("returns manual for ASSOCIATION_LINE_STYLE_MANUAL", () => {
    expect(normalizeLineStyle(ASSOCIATION_LINE_STYLE_MANUAL)).toBe(ASSOCIATION_LINE_STYLE_MANUAL);
  });

  it("defaults to orthogonal for any other value", () => {
    expect(normalizeLineStyle(undefined)).toBe(ASSOCIATION_LINE_STYLE_ORTHOGONAL);
    expect(normalizeLineStyle(null)).toBe(ASSOCIATION_LINE_STYLE_ORTHOGONAL);
    expect(normalizeLineStyle("unknown")).toBe(ASSOCIATION_LINE_STYLE_ORTHOGONAL);
  });
});

// ─── normalizeRelationshipControlPoints ──────────────────────────────────────

describe("normalizeRelationshipControlPoints", () => {
  it("passes through valid points", () => {
    expect(normalizeRelationshipControlPoints([{ x: 1, y: 2 }, { x: 3, y: 4 }]))
      .toEqual([{ x: 1, y: 2 }, { x: 3, y: 4 }]);
  });

  it("returns [] for non-array input", () => {
    expect(normalizeRelationshipControlPoints(null)).toEqual([]);
    expect(normalizeRelationshipControlPoints("bad")).toEqual([]);
  });

  it("filters out entries with non-finite coordinates", () => {
    expect(normalizeRelationshipControlPoints([{ x: NaN, y: 1 }, { x: 2, y: 3 }]))
      .toEqual([{ x: 2, y: 3 }]);
    expect(normalizeRelationshipControlPoints([{ x: Infinity, y: 0 }])).toEqual([]);
  });
});

// ─── dedupeConsecutivePoints ──────────────────────────────────────────────────

describe("dedupeConsecutivePoints", () => {
  it("removes consecutive duplicate points", () => {
    expect(dedupeConsecutivePoints([
      { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 1 },
    ])).toEqual([{ x: 0, y: 0 }, { x: 1, y: 1 }]);
  });

  it("keeps non-consecutive duplicates", () => {
    expect(dedupeConsecutivePoints([
      { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 0 },
    ])).toEqual([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 0 }]);
  });

  it("always keeps the first point", () => {
    expect(dedupeConsecutivePoints([{ x: 5, y: 5 }])).toEqual([{ x: 5, y: 5 }]);
  });

  it("returns empty array for empty input", () => {
    expect(dedupeConsecutivePoints([])).toEqual([]);
  });
});

// ─── getRoundedPolylinePath ───────────────────────────────────────────────────

describe("getRoundedPolylinePath", () => {
  it("returns '' for empty or non-array input", () => {
    expect(getRoundedPolylinePath([])).toBe("");
    expect(getRoundedPolylinePath(null)).toBe("");
  });

  it("returns 'M x y' for a single point", () => {
    expect(getRoundedPolylinePath([{ x: 3, y: 7 }])).toBe("M 3 7");
  });

  it("generates L commands with zero radius", () => {
    const path = getRoundedPolylinePath([{ x: 0, y: 0 }, { x: 10, y: 0 }], 0);
    expect(path).toBe("M 0 0 L 10 0");
  });

  it("generates Q curves at corners with positive radius", () => {
    const path = getRoundedPolylinePath(
      [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
      5,
    );
    expect(path).toContain("Q");
  });
});

// ─── getOrthogonalIncomingDirection ──────────────────────────────────────────

describe("getOrthogonalIncomingDirection", () => {
  it("returns { x:1, y:0 } for Position.Left target", () => {
    expect(getOrthogonalIncomingDirection(0, 0, 100, 0, "left")).toEqual({ x: 1, y: 0 });
  });

  it("returns { x:-1, y:0 } for Position.Right target", () => {
    expect(getOrthogonalIncomingDirection(0, 0, 100, 0, "right")).toEqual({ x: -1, y: 0 });
  });

  it("returns { x:0, y:1 } for Position.Top target", () => {
    expect(getOrthogonalIncomingDirection(0, 0, 0, 100, "top")).toEqual({ x: 0, y: 1 });
  });

  it("returns { x:0, y:-1 } for Position.Bottom target", () => {
    expect(getOrthogonalIncomingDirection(0, 0, 0, 100, "bottom")).toEqual({ x: 0, y: -1 });
  });

  it("falls back to normalised dx/dy vector when position is null", () => {
    const dir = getOrthogonalIncomingDirection(0, 0, 3, 4, null);
    expect(dir.x).toBeCloseTo(0.6);
    expect(dir.y).toBeCloseTo(0.8);
  });
});

// ─── getRelationshipLayout ────────────────────────────────────────────────────

describe("getRelationshipLayout", () => {
  const base = { sourceX: 0, sourceY: 0, targetX: 100, targetY: 0, sourcePosition: "right", targetPosition: "left" };

  it("returns null for non-finite coordinates", () => {
    expect(getRelationshipLayout({ ...base, sourceX: NaN })).toBeNull();
    expect(getRelationshipLayout({ ...base, targetY: Infinity })).toBeNull();
  });

  it("returns a layout object with edgePath and pathPoints for orthogonal style", () => {
    const layout = getRelationshipLayout({ ...base, data: {} });
    expect(layout).not.toBeNull();
    expect(typeof layout.edgePath).toBe("string");
    expect(Array.isArray(layout.pathPoints)).toBe(true);
    expect(layout.isManualRouting).toBe(false);
  });

  it("returns straight path for straight line style", () => {
    const layout = getRelationshipLayout({ ...base, data: { lineStyle: ASSOCIATION_LINE_STYLE_STRAIGHT } });
    expect(layout.lineStyle).toBe(ASSOCIATION_LINE_STYLE_STRAIGHT);
    expect(layout.edgePath).toContain("L");
  });

  it("uses control points for manual routing", () => {
    const layout = getRelationshipLayout({
      ...base,
      data: {
        lineStyle: ASSOCIATION_LINE_STYLE_MANUAL,
        controlPoints: [{ x: 50, y: 25 }],
      },
    });
    expect(layout.isManualRouting).toBe(true);
    expect(layout.pathPoints.length).toBeGreaterThan(2);
  });

  it("activates manual routing when control points are present even without manual style", () => {
    const layout = getRelationshipLayout({
      ...base,
      data: { controlPoints: [{ x: 50, y: 0 }] },
    });
    expect(layout.isManualRouting).toBe(true);
  });

  it("returns incomingDx / incomingDy in the result", () => {
    const layout = getRelationshipLayout({ ...base, data: {} });
    expect(typeof layout.incomingDx).toBe("number");
    expect(typeof layout.incomingDy).toBe("number");
  });
});

// ─── getRelationshipLayoutFromNodes ──────────────────────────────────────────

describe("getRelationshipLayoutFromNodes", () => {
  const makeNode = (x, y, w, h) => ({
    internals: { positionAbsolute: { x, y } },
    measured: { width: w, height: h },
  });

  it("returns null when edge, sourceNode, or targetNode is missing", () => {
    const node = makeNode(0, 0, 100, 60);
    expect(getRelationshipLayoutFromNodes(null, node, node)).toBeNull();
    expect(getRelationshipLayoutFromNodes({}, null, node)).toBeNull();
    expect(getRelationshipLayoutFromNodes({}, node, null)).toBeNull();
  });

  it("falls back to node-derived anchors when handleBounds are absent", () => {
    const src = makeNode(0, 0, 100, 60);
    const tgt = makeNode(200, 0, 100, 60);
    const edge = { sourceHandle: "right-source", targetHandle: "left-target", data: {} };
    const layout = getRelationshipLayoutFromNodes(edge, src, tgt);
    expect(layout).not.toBeNull();
    expect(typeof layout.edgePath).toBe("string");
  });

  it("returns null when allowFallback is false and handles are missing", () => {
    const src = makeNode(0, 0, 100, 60);
    const tgt = makeNode(200, 0, 100, 60);
    const edge = { sourceHandle: "right-attr-x-source", targetHandle: "left-attr-y-target", data: {} };
    const result = getRelationshipLayoutFromNodes(edge, src, tgt, { allowFallback: false });
    expect(result).toBeNull();
  });
});

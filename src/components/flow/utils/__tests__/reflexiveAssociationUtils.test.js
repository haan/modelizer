import { describe, it, expect } from "vitest";
import {
  getReflexiveSide,
  getReflexiveNodeRect,
  getReflexiveAssociationLayout,
  getRoundedPolylinePath,
} from "../reflexiveAssociationUtils.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

const makeNode = (x, y, width, height) => ({
  internals: { positionAbsolute: { x, y } },
  measured: { width, height },
});

// ─── getRoundedPolylinePath ───────────────────────────────────────────────────

describe("getRoundedPolylinePath", () => {
  it("returns empty string for empty or non-array input", () => {
    expect(getRoundedPolylinePath([])).toBe("");
    expect(getRoundedPolylinePath(null)).toBe("");
    expect(getRoundedPolylinePath(undefined)).toBe("");
  });

  it("returns a move command for a single point", () => {
    expect(getRoundedPolylinePath([{ x: 5, y: 10 }])).toBe("M 5 10");
  });

  it("generates M + L commands with zero radius", () => {
    const path = getRoundedPolylinePath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], 0);
    expect(path).toBe("M 0 0 L 10 0 L 10 10");
  });

  it("generates quadratic bezier curves at corners with a positive radius", () => {
    const path = getRoundedPolylinePath(
      [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }],
      5,
    );
    expect(path).toContain("Q");
    expect(path).toMatch(/^M /);
  });

  it("falls back to sharp corner when segments are shorter than the radius", () => {
    const path = getRoundedPolylinePath(
      [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 10 }],
      100,
    );
    // radius clamped to half of shortest segment → still a valid path
    expect(path).toMatch(/^M /);
    expect(path).toContain("L");
  });
});

// ─── getReflexiveSide ─────────────────────────────────────────────────────────

describe("getReflexiveSide", () => {
  it("returns 'right' when reflexiveSide is 'right'", () => {
    expect(getReflexiveSide({ reflexiveSide: "right" })).toBe("right");
  });

  it("returns 'left' when reflexiveSide is 'left'", () => {
    expect(getReflexiveSide({ reflexiveSide: "left" })).toBe("left");
  });

  it("returns 'left' for reflexiveIndex 0", () => {
    expect(getReflexiveSide({ reflexiveIndex: 0 })).toBe("left");
  });

  it("returns 'right' for reflexiveIndex 1", () => {
    expect(getReflexiveSide({ reflexiveIndex: 1 })).toBe("right");
  });

  it("defaults to 'left' for missing/null data", () => {
    expect(getReflexiveSide(null)).toBe("left");
    expect(getReflexiveSide(undefined)).toBe("left");
    expect(getReflexiveSide({})).toBe("left");
  });
});

// ─── getReflexiveNodeRect ─────────────────────────────────────────────────────

describe("getReflexiveNodeRect", () => {
  it("returns { x, y, width, height } for a valid node", () => {
    const node = makeNode(10, 20, 100, 60);
    expect(getReflexiveNodeRect(node)).toEqual({ x: 10, y: 20, width: 100, height: 60 });
  });

  it("returns null when node is null/undefined", () => {
    expect(getReflexiveNodeRect(null)).toBeNull();
    expect(getReflexiveNodeRect(undefined)).toBeNull();
  });

  it("returns null when position is missing", () => {
    expect(getReflexiveNodeRect({ measured: { width: 100, height: 60 } })).toBeNull();
  });

  it("returns null when width or height is 0 or negative", () => {
    expect(getReflexiveNodeRect(makeNode(0, 0, 0, 60))).toBeNull();
    expect(getReflexiveNodeRect(makeNode(0, 0, 100, -1))).toBeNull();
  });

  it("returns null when position has non-finite coordinates", () => {
    const node = { internals: { positionAbsolute: { x: NaN, y: 0 } }, measured: { width: 100, height: 60 } };
    expect(getReflexiveNodeRect(node)).toBeNull();
  });

  it("accepts position from node.position as fallback", () => {
    const node = { position: { x: 5, y: 5 }, measured: { width: 80, height: 40 } };
    expect(getReflexiveNodeRect(node)).toEqual({ x: 5, y: 5, width: 80, height: 40 });
  });
});

// ─── getReflexiveAssociationLayout ───────────────────────────────────────────

describe("getReflexiveAssociationLayout", () => {
  it("returns null for invalid node", () => {
    expect(getReflexiveAssociationLayout(null)).toBeNull();
    expect(getReflexiveAssociationLayout(makeNode(0, 0, 0, 0))).toBeNull();
  });

  it("returns a layout object with expected keys for a valid node", () => {
    const node = makeNode(100, 100, 200, 120);
    const layout = getReflexiveAssociationLayout(node);
    expect(layout).not.toBeNull();
    expect(layout).toHaveProperty("edgePath");
    expect(layout).toHaveProperty("pathPoints");
    expect(layout).toHaveProperty("startAnchor");
    expect(layout).toHaveProperty("endAnchor");
    expect(layout).toHaveProperty("loopWidth");
    expect(layout).toHaveProperty("loopHeight");
    expect(layout).toHaveProperty("side");
    expect(layout).toHaveProperty("resizeHandles");
  });

  it("produces a 'left' side layout by default", () => {
    const layout = getReflexiveAssociationLayout(makeNode(0, 0, 200, 100), {});
    expect(layout.side).toBe("left");
  });

  it("produces a 'right' side layout when reflexiveSide is right", () => {
    const layout = getReflexiveAssociationLayout(makeNode(0, 0, 200, 100), { reflexiveSide: "right" });
    expect(layout.side).toBe("right");
  });

  it("clamps loopWidth and loopHeight to their minimums for invalid data values", () => {
    const node = makeNode(0, 0, 200, 100);
    const layout = getReflexiveAssociationLayout(node, { loopWidth: -5, loopHeight: "bad" });
    expect(layout.loopWidth).toBeGreaterThanOrEqual(layout.minLoopWidth);
    expect(layout.loopHeight).toBeGreaterThanOrEqual(layout.minLoopHeight);
  });

  it("respects custom loopWidth and loopHeight when valid", () => {
    const node = makeNode(0, 0, 200, 100);
    const layout = getReflexiveAssociationLayout(node, { loopWidth: 80, loopHeight: 50 });
    expect(layout.loopWidth).toBe(Math.max(layout.minLoopWidth, 80));
    expect(layout.loopHeight).toBe(Math.max(layout.minLoopHeight, 50));
  });

  it("edgePath is a non-empty SVG path string", () => {
    const layout = getReflexiveAssociationLayout(makeNode(0, 0, 200, 100));
    expect(typeof layout.edgePath).toBe("string");
    expect(layout.edgePath.length).toBeGreaterThan(0);
    expect(layout.edgePath).toMatch(/^M /);
  });
});

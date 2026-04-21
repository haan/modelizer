import { describe, it, expect } from "vitest";
import {
  normalizeControlPoints,
  normalizePositiveNumber,
  normalizeReflexiveSide,
  getOppositeReflexiveSide,
  normalizeEdges,
} from "../edgeUtils.js";
import {
  ASSOCIATION_EDGE_TYPE,
  REFLEXIVE_EDGE_TYPE,
} from "../constants.js";

describe("normalizePositiveNumber", () => {
  it("returns the value for positive numbers", () => {
    expect(normalizePositiveNumber(5)).toBe(5);
    expect(normalizePositiveNumber(0.1)).toBe(0.1);
  });

  it("returns undefined for zero", () => {
    expect(normalizePositiveNumber(0)).toBeUndefined();
  });

  it("returns undefined for negative numbers", () => {
    expect(normalizePositiveNumber(-1)).toBeUndefined();
  });

  it("returns undefined for NaN and non-numeric values", () => {
    expect(normalizePositiveNumber(NaN)).toBeUndefined();
    expect(normalizePositiveNumber("abc")).toBeUndefined();
    expect(normalizePositiveNumber(null)).toBeUndefined();
    expect(normalizePositiveNumber(undefined)).toBeUndefined();
  });

  it("coerces numeric strings", () => {
    expect(normalizePositiveNumber("3")).toBe(3);
  });
});

describe("normalizeControlPoints", () => {
  it("returns valid points unchanged", () => {
    expect(normalizeControlPoints([{ x: 1, y: 2 }, { x: 3, y: 4 }]))
      .toEqual([{ x: 1, y: 2 }, { x: 3, y: 4 }]);
  });

  it("returns empty array for non-array input", () => {
    expect(normalizeControlPoints(null)).toEqual([]);
    expect(normalizeControlPoints("bad")).toEqual([]);
    expect(normalizeControlPoints(undefined)).toEqual([]);
  });

  it("filters out entries with non-finite coordinates", () => {
    expect(normalizeControlPoints([{ x: 1, y: NaN }, { x: 2, y: 3 }]))
      .toEqual([{ x: 2, y: 3 }]);
    expect(normalizeControlPoints([{ x: undefined, y: 1 }])).toEqual([]);
    expect(normalizeControlPoints([{ x: "bad", y: 1 }])).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(normalizeControlPoints([])).toEqual([]);
  });
});

describe("normalizeReflexiveSide", () => {
  it("returns 'left' for 'left'", () => {
    expect(normalizeReflexiveSide("left")).toBe("left");
  });

  it("returns 'right' for 'right'", () => {
    expect(normalizeReflexiveSide("right")).toBe("right");
  });

  it("returns null for any other value", () => {
    expect(normalizeReflexiveSide("top")).toBeNull();
    expect(normalizeReflexiveSide("")).toBeNull();
    expect(normalizeReflexiveSide(null)).toBeNull();
    expect(normalizeReflexiveSide(undefined)).toBeNull();
  });
});

describe("getOppositeReflexiveSide", () => {
  it("returns 'left' for 'right'", () => {
    expect(getOppositeReflexiveSide("right")).toBe("left");
  });

  it("returns 'right' for 'left' (and any other value)", () => {
    expect(getOppositeReflexiveSide("left")).toBe("right");
    expect(getOppositeReflexiveSide(null)).toBe("right");
  });
});

describe("normalizeEdges", () => {
  it("returns an empty array for empty input", () => {
    expect(normalizeEdges([])).toEqual([]);
  });

  it("assigns reflexiveIndex, reflexiveCount, and reflexiveSide to reflexive edges", () => {
    const edge = {
      id: "e1",
      type: REFLEXIVE_EDGE_TYPE,
      source: "node1",
      target: "node1",
      data: {},
    };
    const result = normalizeEdges([edge]);
    expect(result[0].data.reflexiveIndex).toBe(0);
    expect(result[0].data.reflexiveCount).toBe(1);
    expect(["left", "right"]).toContain(result[0].data.reflexiveSide);
  });

  it("assigns parallelIndex and parallelCount to parallel association edges", () => {
    const e1 = { id: "e1", type: ASSOCIATION_EDGE_TYPE, source: "a", target: "b", data: {} };
    const e2 = { id: "e2", type: ASSOCIATION_EDGE_TYPE, source: "a", target: "b", data: {} };
    const result = normalizeEdges([e1, e2]);
    expect(result[0].data.parallelCount).toBe(2);
    expect(result[1].data.parallelCount).toBe(2);
    const indices = new Set(result.map((e) => e.data.parallelIndex));
    expect(indices).toEqual(new Set([0, 1]));
  });
});

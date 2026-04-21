import { describe, it, expect } from "vitest";
import {
  DEFAULT_VIEW_VISIBILITY,
  normalizeVisibility,
  normalizeViewPositions,
  normalizeViewSizes,
} from "../viewUtils.js";

describe("normalizeVisibility", () => {
  it("passes through valid boolean flags", () => {
    expect(normalizeVisibility({ conceptual: false, logical: true, physical: false }))
      .toEqual({ conceptual: false, logical: true, physical: false });
  });

  it("falls back to true for missing keys", () => {
    expect(normalizeVisibility({})).toEqual(DEFAULT_VIEW_VISIBILITY);
  });

  it("falls back to true for non-boolean values", () => {
    expect(normalizeVisibility({ conceptual: 1, logical: "yes", physical: null }))
      .toEqual(DEFAULT_VIEW_VISIBILITY);
  });

  it("falls back to true for null/undefined input", () => {
    expect(normalizeVisibility(null)).toEqual(DEFAULT_VIEW_VISIBILITY);
    expect(normalizeVisibility(undefined)).toEqual(DEFAULT_VIEW_VISIBILITY);
  });
});

describe("normalizeViewPositions", () => {
  it("passes through valid positions for all views", () => {
    const positions = {
      conceptual: { x: 1, y: 2 },
      logical: { x: 3, y: 4 },
      physical: { x: 5, y: 6 },
    };
    expect(normalizeViewPositions(positions, { x: 0, y: 0 })).toEqual(positions);
  });

  it("uses fallback for missing view positions", () => {
    const result = normalizeViewPositions({}, { x: 10, y: 20 });
    expect(result.conceptual).toEqual({ x: 10, y: 20 });
    expect(result.logical).toEqual({ x: 10, y: 20 });
    expect(result.physical).toEqual({ x: 10, y: 20 });
  });

  it("uses {x:0,y:0} when no fallback provided", () => {
    const result = normalizeViewPositions(null);
    expect(result.conceptual).toEqual({ x: 0, y: 0 });
  });

  it("uses fallback for invalid position entries", () => {
    const positions = {
      conceptual: { x: "bad", y: 2 },
      logical: null,
      physical: { x: 5, y: 6 },
    };
    const result = normalizeViewPositions(positions, { x: 99, y: 99 });
    expect(result.conceptual).toEqual({ x: 99, y: 99 });
    expect(result.logical).toEqual({ x: 99, y: 99 });
    expect(result.physical).toEqual({ x: 5, y: 6 });
  });
});

describe("normalizeViewSizes", () => {
  it("passes through valid sizes for all views", () => {
    const sizes = {
      conceptual: { width: 100, height: 200 },
      logical: { width: 300, height: 400 },
      physical: { width: 500, height: 600 },
    };
    expect(normalizeViewSizes(sizes, { width: 0, height: 0 })).toEqual(sizes);
  });

  it("uses fallback for missing view sizes", () => {
    const result = normalizeViewSizes({}, { width: 50, height: 60 });
    expect(result.conceptual).toEqual({ width: 50, height: 60 });
    expect(result.logical).toEqual({ width: 50, height: 60 });
    expect(result.physical).toEqual({ width: 50, height: 60 });
  });

  it("uses {width:0,height:0} when no fallback provided", () => {
    const result = normalizeViewSizes(null);
    expect(result.conceptual).toEqual({ width: 0, height: 0 });
  });

  it("uses fallback for invalid size entries", () => {
    const sizes = {
      conceptual: { width: "wide", height: 200 },
      logical: undefined,
      physical: { width: 500, height: 600 },
    };
    const result = normalizeViewSizes(sizes, { width: 10, height: 10 });
    expect(result.conceptual).toEqual({ width: 10, height: 10 });
    expect(result.logical).toEqual({ width: 10, height: 10 });
    expect(result.physical).toEqual({ width: 500, height: 600 });
  });
});

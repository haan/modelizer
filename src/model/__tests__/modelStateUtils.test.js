import { describe, it, expect } from "vitest";
import {
  deriveViewPositionsMeta,
  getAttributeIdFromHandle,
  isAttributeHandle,
  getRelationshipHandleSide,
  resolveRelationshipSideByAimX,
  getDistanceSquaredToSegment,
  getClosestSegmentIndex,
  getSnappedCoordinate,
  getControlPointSnapNeighbors,
  syncNodeViewLayout,
} from "../modelStateUtils.js";
import {
  AREA_NODE_TYPE,
  CLASS_NODE_TYPE,
  NOTE_NODE_TYPE,
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from "../constants.js";

// ─── deriveViewPositionsMeta ──────────────────────────────────────────────────

describe("deriveViewPositionsMeta", () => {
  it("passes through explicit boolean meta when all three are present", () => {
    const node = { data: { viewPositionsMeta: { conceptual: true, logical: false, physical: true } } };
    const viewPositions = {};
    expect(deriveViewPositionsMeta(node, viewPositions))
      .toEqual({ conceptual: true, logical: false, physical: true });
  });

  it("infers meta when node has no viewPositionsMeta", () => {
    const pos = { x: 0, y: 0 };
    const differentPos = { x: 100, y: 200 };
    const viewPositions = {
      [VIEW_CONCEPTUAL]: pos,
      [VIEW_LOGICAL]: pos,
      [VIEW_PHYSICAL]: differentPos,
    };
    const meta = deriveViewPositionsMeta({ data: {} }, viewPositions);
    expect(meta.conceptual).toBe(true);
    expect(meta.logical).toBe(false); // same as conceptual
    expect(meta.physical).toBe(true); // different from both
  });

  it("returns conceptual=true, logical=false, physical=false when all views are identical", () => {
    const pos = { x: 10, y: 20 };
    const viewPositions = {
      [VIEW_CONCEPTUAL]: pos,
      [VIEW_LOGICAL]: pos,
      [VIEW_PHYSICAL]: pos,
    };
    const meta = deriveViewPositionsMeta({ data: {} }, viewPositions);
    expect(meta.conceptual).toBe(true);
    expect(meta.logical).toBe(false);
    expect(meta.physical).toBe(false);
  });

  it("treats non-boolean meta fields as missing and infers", () => {
    const node = { data: { viewPositionsMeta: { conceptual: 1, logical: "yes", physical: null } } };
    const pos = { x: 0, y: 0 };
    const viewPositions = { [VIEW_CONCEPTUAL]: pos, [VIEW_LOGICAL]: pos, [VIEW_PHYSICAL]: pos };
    const meta = deriveViewPositionsMeta(node, viewPositions);
    expect(meta.conceptual).toBe(true);
  });
});

// ─── syncNodeViewLayout ───────────────────────────────────────────────────────

describe("syncNodeViewLayout", () => {
  it("syncs class position from conceptual to logical", () => {
    const node = {
      id: "class-1",
      type: CLASS_NODE_TYPE,
      position: { x: 100, y: 120 },
      data: {
        viewPositions: {
          [VIEW_CONCEPTUAL]: { x: 10, y: 20 },
          [VIEW_LOGICAL]: { x: 100, y: 120 },
          [VIEW_PHYSICAL]: { x: 300, y: 320 },
        },
        viewPositionsMeta: {
          conceptual: true,
          logical: true,
          physical: true,
        },
      },
    };

    const result = syncNodeViewLayout(node, VIEW_LOGICAL);

    expect(result.position).toEqual({ x: 10, y: 20 });
    expect(result.data.viewPositions[VIEW_LOGICAL]).toEqual({ x: 10, y: 20 });
    expect(result.data.viewPositions[VIEW_PHYSICAL]).toEqual({ x: 300, y: 320 });
    expect(result.data.viewPositionsMeta.logical).toBe(true);
  });

  it("syncs note position from conceptual to logical", () => {
    const node = {
      id: "note-1",
      type: NOTE_NODE_TYPE,
      position: { x: 140, y: 160 },
      data: {
        label: "Note",
        viewPositions: {
          [VIEW_CONCEPTUAL]: { x: 20, y: 30 },
          [VIEW_LOGICAL]: { x: 140, y: 160 },
          [VIEW_PHYSICAL]: { x: 260, y: 280 },
        },
        viewPositionsMeta: {
          conceptual: true,
          logical: true,
          physical: true,
        },
      },
    };

    const result = syncNodeViewLayout(node, VIEW_LOGICAL);

    expect(result.position).toEqual({ x: 20, y: 30 });
    expect(result.data.viewPositions[VIEW_LOGICAL]).toEqual({ x: 20, y: 30 });
    expect(result.data.viewPositions[VIEW_PHYSICAL]).toEqual({ x: 260, y: 280 });
  });

  it("syncs area position and size from logical to physical", () => {
    const node = {
      id: "area-1",
      type: AREA_NODE_TYPE,
      position: { x: 300, y: 320 },
      width: 500,
      height: 350,
      style: { zIndex: -1, width: 500, height: 350 },
      data: {
        label: "Area",
        viewPositions: {
          [VIEW_CONCEPTUAL]: { x: 10, y: 20 },
          [VIEW_LOGICAL]: { x: 100, y: 120 },
          [VIEW_PHYSICAL]: { x: 300, y: 320 },
        },
        viewSizes: {
          [VIEW_CONCEPTUAL]: { width: 280, height: 180 },
          [VIEW_LOGICAL]: { width: 400, height: 250 },
          [VIEW_PHYSICAL]: { width: 500, height: 350 },
        },
        viewPositionsMeta: {
          conceptual: true,
          logical: true,
          physical: true,
        },
      },
    };

    const result = syncNodeViewLayout(node, VIEW_PHYSICAL);

    expect(result.position).toEqual({ x: 100, y: 120 });
    expect(result.width).toBe(400);
    expect(result.height).toBe(250);
    expect(result.style).toEqual({ zIndex: -1, width: 400, height: 250 });
    expect(result.data.viewPositions[VIEW_PHYSICAL]).toEqual({ x: 100, y: 120 });
    expect(result.data.viewSizes[VIEW_PHYSICAL]).toEqual({ width: 400, height: 250 });
    expect(result.data.viewPositionsMeta.physical).toBe(true);
  });

  it("leaves unsupported nodes and conceptual sync unchanged", () => {
    const unsupported = { id: "other-1", type: "other", position: { x: 1, y: 2 } };
    const classNode = {
      id: "class-1",
      type: CLASS_NODE_TYPE,
      position: { x: 1, y: 2 },
      data: {},
    };

    expect(syncNodeViewLayout(unsupported, VIEW_LOGICAL)).toBe(unsupported);
    expect(syncNodeViewLayout(classNode, VIEW_CONCEPTUAL)).toBe(classNode);
  });
});

// ─── getAttributeIdFromHandle ─────────────────────────────────────────────────

describe("getAttributeIdFromHandle", () => {
  it("extracts attribute id from left-side source handle", () => {
    expect(getAttributeIdFromHandle("left-attr-abc-source")).toBe("attr-abc");
  });

  it("extracts attribute id from right-side target handle", () => {
    expect(getAttributeIdFromHandle("right-myAttrId-target")).toBe("myAttrId");
  });

  it("returns null for standard class handles", () => {
    expect(getAttributeIdFromHandle("left-source")).toBeNull();
    expect(getAttributeIdFromHandle("right-target")).toBeNull();
    expect(getAttributeIdFromHandle("top-source")).toBeNull();
    expect(getAttributeIdFromHandle("bottom-target")).toBeNull();
  });

  it("returns null for the association target handle", () => {
    expect(getAttributeIdFromHandle("association-target")).toBeNull();
  });

  it("returns null for null/undefined/empty input", () => {
    expect(getAttributeIdFromHandle(null)).toBeNull();
    expect(getAttributeIdFromHandle(undefined)).toBeNull();
    expect(getAttributeIdFromHandle("")).toBeNull();
  });

  it("returns null for handles without -source or -target suffix", () => {
    expect(getAttributeIdFromHandle("left-attr-abc")).toBeNull();
  });
});

// ─── isAttributeHandle ────────────────────────────────────────────────────────

describe("isAttributeHandle", () => {
  it("returns true for attribute handles", () => {
    expect(isAttributeHandle("left-attr-abc-source")).toBe(true);
    expect(isAttributeHandle("right-myId-target")).toBe(true);
  });

  it("returns false for class and association handles", () => {
    expect(isAttributeHandle("left-source")).toBe(false);
    expect(isAttributeHandle("association-target")).toBe(false);
    expect(isAttributeHandle(null)).toBe(false);
  });
});

// ─── getRelationshipHandleSide ────────────────────────────────────────────────

describe("getRelationshipHandleSide", () => {
  it("returns 'left' for left-prefixed handles", () => {
    expect(getRelationshipHandleSide("left-source")).toBe("left");
    expect(getRelationshipHandleSide("left-attr-abc-source")).toBe("left");
  });

  it("returns 'right' for right-prefixed handles", () => {
    expect(getRelationshipHandleSide("right-target")).toBe("right");
  });

  it("returns null for handles with other prefixes", () => {
    expect(getRelationshipHandleSide("top-source")).toBeNull();
    expect(getRelationshipHandleSide("bottom-target")).toBeNull();
  });

  it("returns null for non-string input", () => {
    expect(getRelationshipHandleSide(null)).toBeNull();
    expect(getRelationshipHandleSide(undefined)).toBeNull();
  });
});

// ─── resolveRelationshipSideByAimX ───────────────────────────────────────────

describe("resolveRelationshipSideByAimX", () => {
  const pos = { leftX: 0, rightX: 200, centerX: 100 };

  it("returns 'right' when aimX is closer to the right side", () => {
    expect(resolveRelationshipSideByAimX(pos, 180, null)).toBe("right");
  });

  it("returns 'left' when aimX is closer to the left side", () => {
    expect(resolveRelationshipSideByAimX(pos, 20, null)).toBe("left");
  });

  it("keeps currentSide when distances are equal", () => {
    expect(resolveRelationshipSideByAimX(pos, 100, "left")).toBe("left");
    expect(resolveRelationshipSideByAimX(pos, 100, "right")).toBe("right");
  });

  it("uses centerX to break tie when currentSide is null", () => {
    expect(resolveRelationshipSideByAimX(pos, 100, null)).toBe("right"); // aimX >= centerX
    expect(resolveRelationshipSideByAimX(pos, 99, null)).toBe("left");  // aimX < centerX
  });

  it("returns default 'right' for invalid position or aimX", () => {
    expect(resolveRelationshipSideByAimX(null, 50, null)).toBe("right");
    expect(resolveRelationshipSideByAimX(pos, NaN, null)).toBe("right");
    expect(resolveRelationshipSideByAimX({ leftX: NaN, rightX: 100 }, 50, null)).toBe("right");
  });
});

// ─── getDistanceSquaredToSegment ──────────────────────────────────────────────

describe("getDistanceSquaredToSegment", () => {
  it("returns 0 when point is on the segment", () => {
    expect(getDistanceSquaredToSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }))
      .toBeCloseTo(0);
  });

  it("returns the squared perpendicular distance for a point off the segment", () => {
    // Point at (5, 3) above a horizontal segment from (0,0) to (10,0) → distance = 3, squared = 9
    expect(getDistanceSquaredToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 }))
      .toBeCloseTo(9);
  });

  it("returns squared distance to the nearest endpoint when point is beyond the segment", () => {
    // Point at (15, 0), segment (0,0)→(10,0); nearest endpoint is (10,0), distance² = 25
    expect(getDistanceSquaredToSegment({ x: 15, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }))
      .toBeCloseTo(25);
  });

  it("returns squared distance to the point when segment has zero length", () => {
    // degenerate segment (5,5)→(5,5), point (8,9): distance² = 9+16 = 25
    expect(getDistanceSquaredToSegment({ x: 8, y: 9 }, { x: 5, y: 5 }, { x: 5, y: 5 }))
      .toBeCloseTo(25);
  });
});

// ─── getClosestSegmentIndex ───────────────────────────────────────────────────

describe("getClosestSegmentIndex", () => {
  it("returns 0 for fewer than 2 path points", () => {
    expect(getClosestSegmentIndex([], { x: 0, y: 0 })).toBe(0);
    expect(getClosestSegmentIndex([{ x: 0, y: 0 }], { x: 0, y: 0 })).toBe(0);
    expect(getClosestSegmentIndex(null, { x: 0, y: 0 })).toBe(0);
  });

  it("returns 0 for a single-segment polyline", () => {
    expect(getClosestSegmentIndex([{ x: 0, y: 0 }, { x: 10, y: 0 }], { x: 5, y: 0 })).toBe(0);
  });

  it("identifies the closest segment index in a multi-segment polyline", () => {
    const path = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 10 }];
    // Point close to segment 1 (vertical: (10,0)→(10,10))
    expect(getClosestSegmentIndex(path, { x: 11, y: 5 })).toBe(1);
    // Point close to segment 2 (horizontal: (10,10)→(20,10))
    expect(getClosestSegmentIndex(path, { x: 15, y: 11 })).toBe(2);
  });
});

// ─── getSnappedCoordinate ─────────────────────────────────────────────────────

describe("getSnappedCoordinate", () => {
  it("returns value unchanged when no neighbors are within threshold", () => {
    expect(getSnappedCoordinate(50, [{ x: 100, y: 0 }], "x")).toBe(50);
  });

  it("snaps to a neighbor within threshold (10px)", () => {
    expect(getSnappedCoordinate(48, [{ x: 50, y: 0 }], "x")).toBe(50);
  });

  it("snaps to the closest neighbor when multiple are within threshold", () => {
    const neighbors = [{ x: 45, y: 0 }, { x: 49, y: 0 }];
    expect(getSnappedCoordinate(48, neighbors, "x")).toBe(49);
  });

  it("uses y axis when axis is 'y'", () => {
    expect(getSnappedCoordinate(98, [{ x: 0, y: 100 }], "y")).toBe(100);
  });

  it("returns value unchanged for non-finite value or empty neighbors", () => {
    expect(getSnappedCoordinate(NaN, [{ x: 5, y: 0 }], "x")).toBeNaN();
    expect(getSnappedCoordinate(5, [], "x")).toBe(5);
    expect(getSnappedCoordinate(5, null, "x")).toBe(5);
  });
});

// ─── getControlPointSnapNeighbors ─────────────────────────────────────────────

describe("getControlPointSnapNeighbors", () => {
  const pts = [{ x: 0, y: 0 }, { x: 10, y: 5 }, { x: 20, y: 0 }];

  it("returns adjacent control points as xNeighbors", () => {
    const { xNeighbors } = getControlPointSnapNeighbors({
      controlPoints: pts,
      controlPointIndex: 1,
      sourceAnchor: null,
      targetAnchor: null,
    });
    expect(xNeighbors).toContainEqual(pts[0]);
    expect(xNeighbors).toContainEqual(pts[2]);
  });

  it("adds sourceAnchor to yNeighbors for first control point", () => {
    const src = { x: -10, y: 0 };
    const { yNeighbors } = getControlPointSnapNeighbors({
      controlPoints: pts,
      controlPointIndex: 0,
      sourceAnchor: src,
      targetAnchor: null,
    });
    expect(yNeighbors).toContainEqual(src);
  });

  it("adds targetAnchor to yNeighbors for last control point", () => {
    const tgt = { x: 30, y: 0 };
    const { yNeighbors } = getControlPointSnapNeighbors({
      controlPoints: pts,
      controlPointIndex: 2,
      sourceAnchor: null,
      targetAnchor: tgt,
    });
    expect(yNeighbors).toContainEqual(tgt);
  });

  it("does not add anchors for middle control points", () => {
    const src = { x: -10, y: 0 };
    const tgt = { x: 30, y: 0 };
    const { yNeighbors } = getControlPointSnapNeighbors({
      controlPoints: pts,
      controlPointIndex: 1,
      sourceAnchor: src,
      targetAnchor: tgt,
    });
    expect(yNeighbors).not.toContainEqual(src);
    expect(yNeighbors).not.toContainEqual(tgt);
  });
});

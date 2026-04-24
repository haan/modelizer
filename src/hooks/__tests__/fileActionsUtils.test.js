import { describe, it, expect } from "vitest";
import {
  buildHashPayload,
  isSamePosition,
  isSameNode,
  isSameEdge,
  hasMeaningfulNodeChange,
  hasMeaningfulEdgeChange,
} from "../useFileActions.js";
import {
  AREA_NODE_TYPE,
  CLASS_NODE_TYPE,
  VIEW_CONCEPTUAL,
  VIEW_LOGICAL,
  VIEW_PHYSICAL,
} from "../../model/constants.js";

// ─── buildHashPayload ─────────────────────────────────────────────────────────

describe("buildHashPayload", () => {
  it("returns defaults for null/undefined input", () => {
    const result = buildHashPayload(null);
    expect(result.modelName).toBe("Untitled model");
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
    expect(typeof result.version).not.toBeUndefined();
  });

  it("passes through valid fields", () => {
    const payload = { version: 2, modelName: "MyModel", nodes: [{}], edges: [{}] };
    const result = buildHashPayload(payload);
    expect(result.version).toBe(2);
    expect(result.modelName).toBe("MyModel");
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(1);
  });

  it("falls back to 'Untitled model' for empty or whitespace modelName", () => {
    expect(buildHashPayload({ modelName: "" }).modelName).toBe("Untitled model");
    expect(buildHashPayload({ modelName: "   " }).modelName).toBe("Untitled model");
    expect(buildHashPayload({ modelName: 42 }).modelName).toBe("Untitled model");
  });

  it("falls back to [] for non-array nodes/edges", () => {
    expect(buildHashPayload({ nodes: null, edges: "bad" }))
      .toMatchObject({ nodes: [], edges: [] });
  });

  it("keeps per-view positions but canonicalizes top-level node position", () => {
    const viewPositions = {
      [VIEW_CONCEPTUAL]: { x: 10, y: 20 },
      [VIEW_LOGICAL]: { x: 110, y: 120 },
      [VIEW_PHYSICAL]: { x: 210, y: 220 },
    };
    const payload = buildHashPayload({
      nodes: [
        {
          id: "class-1",
          type: CLASS_NODE_TYPE,
          position: viewPositions[VIEW_LOGICAL],
          data: { viewPositions },
        },
      ],
    });

    expect(payload.nodes[0].position).toEqual(viewPositions[VIEW_CONCEPTUAL]);
    expect(payload.nodes[0].data.viewPositions).toEqual(viewPositions);
  });

  it("keeps per-view area sizes but canonicalizes top-level area size", () => {
    const viewPositions = {
      [VIEW_CONCEPTUAL]: { x: 10, y: 20 },
      [VIEW_LOGICAL]: { x: 110, y: 120 },
      [VIEW_PHYSICAL]: { x: 210, y: 220 },
    };
    const viewSizes = {
      [VIEW_CONCEPTUAL]: { width: 280, height: 180 },
      [VIEW_LOGICAL]: { width: 380, height: 280 },
      [VIEW_PHYSICAL]: { width: 480, height: 380 },
    };
    const payload = buildHashPayload({
      nodes: [
        {
          id: "area-1",
          type: AREA_NODE_TYPE,
          position: viewPositions[VIEW_LOGICAL],
          width: viewSizes[VIEW_LOGICAL].width,
          height: viewSizes[VIEW_LOGICAL].height,
          style: {
            zIndex: -1,
            width: viewSizes[VIEW_LOGICAL].width,
            height: viewSizes[VIEW_LOGICAL].height,
          },
          data: { viewPositions, viewSizes },
        },
      ],
    });

    expect(payload.nodes[0].position).toEqual(viewPositions[VIEW_CONCEPTUAL]);
    expect(payload.nodes[0].width).toBe(viewSizes[VIEW_CONCEPTUAL].width);
    expect(payload.nodes[0].height).toBe(viewSizes[VIEW_CONCEPTUAL].height);
    expect(payload.nodes[0].style.width).toBe(viewSizes[VIEW_CONCEPTUAL].width);
    expect(payload.nodes[0].style.height).toBe(viewSizes[VIEW_CONCEPTUAL].height);
    expect(payload.nodes[0].data.viewPositions).toEqual(viewPositions);
    expect(payload.nodes[0].data.viewSizes).toEqual(viewSizes);
  });

  it("serializes the same payload regardless of active view projection", () => {
    const data = {
      label: "Customer",
      viewPositions: {
        [VIEW_CONCEPTUAL]: { x: 10, y: 20 },
        [VIEW_LOGICAL]: { x: 110, y: 120 },
        [VIEW_PHYSICAL]: { x: 210, y: 220 },
      },
    };
    const conceptualPayload = buildHashPayload({
      nodes: [
        {
          id: "class-1",
          type: CLASS_NODE_TYPE,
          position: data.viewPositions[VIEW_CONCEPTUAL],
          data,
        },
      ],
    });
    const logicalPayload = buildHashPayload({
      nodes: [
        {
          id: "class-1",
          type: CLASS_NODE_TYPE,
          position: data.viewPositions[VIEW_LOGICAL],
          data,
        },
      ],
    });

    expect(JSON.stringify(logicalPayload)).toBe(JSON.stringify(conceptualPayload));
  });
});

// ─── isSamePosition ───────────────────────────────────────────────────────────

describe("isSamePosition", () => {
  it("returns true for equal positions", () => {
    expect(isSamePosition({ x: 1, y: 2 }, { x: 1, y: 2 })).toBe(true);
    expect(isSamePosition({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(true);
  });

  it("returns false when x or y differs", () => {
    expect(isSamePosition({ x: 1, y: 2 }, { x: 9, y: 2 })).toBe(false);
    expect(isSamePosition({ x: 1, y: 2 }, { x: 1, y: 9 })).toBe(false);
  });

  it("handles null/undefined gracefully", () => {
    expect(isSamePosition(null, null)).toBe(true);
    expect(isSamePosition(null, { x: 0, y: 0 })).toBe(false);
  });
});

// ─── isSameNode ───────────────────────────────────────────────────────────────

describe("isSameNode", () => {
  const base = { type: "class", position: { x: 0, y: 0 }, width: 100, height: 60, data: {}, style: {} };

  it("returns true for identical nodes", () => {
    expect(isSameNode(base, { ...base })).toBe(true);
  });

  it("returns false when either node is null", () => {
    expect(isSameNode(null, base)).toBe(false);
    expect(isSameNode(base, null)).toBe(false);
  });

  it("returns false when type differs", () => {
    expect(isSameNode(base, { ...base, type: "note" })).toBe(false);
  });

  it("returns false when position differs", () => {
    expect(isSameNode(base, { ...base, position: { x: 99, y: 0 } })).toBe(false);
  });

  it("returns false when width or height differs", () => {
    expect(isSameNode(base, { ...base, width: 200 })).toBe(false);
    expect(isSameNode(base, { ...base, height: 999 })).toBe(false);
  });

  it("returns false when data reference differs", () => {
    expect(isSameNode(base, { ...base, data: {} })).toBe(false);
  });

  it("returns false when style reference differs", () => {
    expect(isSameNode(base, { ...base, style: {} })).toBe(false);
  });
});

// ─── isSameEdge ───────────────────────────────────────────────────────────────

describe("isSameEdge", () => {
  const base = {
    type: "association",
    source: "a",
    target: "b",
    sourceHandle: "right-source",
    targetHandle: "left-target",
    data: {},
    style: {},
    markerEnd: null,
    markerStart: null,
  };

  it("returns true for identical edges", () => {
    expect(isSameEdge(base, { ...base })).toBe(true);
  });

  it("returns false when either edge is null", () => {
    expect(isSameEdge(null, base)).toBe(false);
    expect(isSameEdge(base, null)).toBe(false);
  });

  it("returns false when type differs", () => {
    expect(isSameEdge(base, { ...base, type: "relationship" })).toBe(false);
  });

  it("returns false when source or target differs", () => {
    expect(isSameEdge(base, { ...base, source: "z" })).toBe(false);
    expect(isSameEdge(base, { ...base, target: "z" })).toBe(false);
  });

  it("returns false when sourceHandle or targetHandle differs", () => {
    expect(isSameEdge(base, { ...base, sourceHandle: "left-source" })).toBe(false);
    expect(isSameEdge(base, { ...base, targetHandle: "right-target" })).toBe(false);
  });

  it("returns false when data reference differs", () => {
    expect(isSameEdge(base, { ...base, data: {} })).toBe(false);
  });

  it("returns false when markerEnd differs", () => {
    expect(isSameEdge(base, { ...base, markerEnd: "arrow" })).toBe(false);
  });
});

// ─── hasMeaningfulNodeChange ──────────────────────────────────────────────────

describe("hasMeaningfulNodeChange", () => {
  const sharedData = {};
  const node = { id: "n1", type: "class", position: { x: 0, y: 0 }, width: 100, height: 60, data: sharedData, style: {} };

  it("returns false when node arrays are identical by content", () => {
    expect(hasMeaningfulNodeChange([node], [node])).toBe(false);
  });

  it("returns true when length differs", () => {
    expect(hasMeaningfulNodeChange([], [node])).toBe(true);
    expect(hasMeaningfulNodeChange([node], [])).toBe(true);
  });

  it("returns true when a node's type changes", () => {
    expect(hasMeaningfulNodeChange([node], [{ ...node, type: "note" }])).toBe(true);
  });

  it("returns true when a node's position changes", () => {
    expect(hasMeaningfulNodeChange([node], [{ ...node, position: { x: 99, y: 0 } }])).toBe(true);
  });

  it("returns false for empty arrays", () => {
    expect(hasMeaningfulNodeChange([], [])).toBe(false);
  });
});

// ─── hasMeaningfulEdgeChange ──────────────────────────────────────────────────

describe("hasMeaningfulEdgeChange", () => {
  const sharedData = {};
  const edge = {
    id: "e1", type: "association", source: "a", target: "b",
    sourceHandle: "right-source", targetHandle: "left-target",
    data: sharedData, style: {}, markerEnd: null, markerStart: null,
  };

  it("returns false when edge arrays are identical by content", () => {
    expect(hasMeaningfulEdgeChange([edge], [edge])).toBe(false);
  });

  it("returns true when length differs", () => {
    expect(hasMeaningfulEdgeChange([], [edge])).toBe(true);
  });

  it("returns true when an edge's source changes", () => {
    expect(hasMeaningfulEdgeChange([edge], [{ ...edge, source: "z" }])).toBe(true);
  });

  it("returns false for empty arrays", () => {
    expect(hasMeaningfulEdgeChange([], [])).toBe(false);
  });
});

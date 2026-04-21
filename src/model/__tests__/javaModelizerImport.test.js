import { describe, it, expect } from "vitest";
import {
  parseDob,
  deriveModelName,
  mapDatatype,
  importJavaModelizer,
} from "../javaModelizerImport.js";
import { ATTRIBUTE_TYPE_PARAMS_DEFAULT } from "../../attributes.js";

// ─── parseDob ────────────────────────────────────────────────────────────────

describe("parseDob", () => {
  it("returns { table, field } for 'Table.field' notation", () => {
    expect(parseDob("Users.id")).toEqual({ table: "Users", field: "id" });
  });

  it("returns { table, field: null } when no dot is present", () => {
    expect(parseDob("Users")).toEqual({ table: "Users", field: null });
  });

  it("returns { table: null, field: null } for empty / falsy input", () => {
    expect(parseDob("")).toEqual({ table: null, field: null });
    expect(parseDob(null)).toEqual({ table: null, field: null });
    expect(parseDob(undefined)).toEqual({ table: null, field: null });
  });

  it("trims surrounding whitespace", () => {
    expect(parseDob("  Users.id  ")).toEqual({ table: "Users", field: "id" });
  });

  it("uses only the first dot as separator", () => {
    expect(parseDob("a.b.c")).toEqual({ table: "a", field: "b.c" });
  });
});

// ─── deriveModelName ─────────────────────────────────────────────────────────

describe("deriveModelName", () => {
  it("strips the file extension", () => {
    expect(deriveModelName("myModel.mod")).toBe("myModel");
    expect(deriveModelName("archive.tar.gz")).toBe("archive.tar");
  });

  it("returns the name unchanged when there is no extension", () => {
    expect(deriveModelName("myModel")).toBe("myModel");
  });

  it("returns 'Imported model' for empty or whitespace-only input", () => {
    expect(deriveModelName("")).toBe("Imported model");
    expect(deriveModelName("   ")).toBe("Imported model");
    expect(deriveModelName(null)).toBe("Imported model");
    expect(deriveModelName(undefined)).toBe("Imported model");
  });

  it("returns 'Imported model' when the name is only an extension", () => {
    expect(deriveModelName(".mod")).toBe("Imported model");
  });
});

// ─── mapDatatype ─────────────────────────────────────────────────────────────

describe("mapDatatype", () => {
  it("maps integer variants to int", () => {
    expect(mapDatatype("int")).toMatchObject({ type: "int", isFallback: false });
    expect(mapDatatype("integer")).toMatchObject({ type: "int", isFallback: false });
    expect(mapDatatype("smallint")).toMatchObject({ type: "int", isFallback: false });
    expect(mapDatatype("bigint")).toMatchObject({ type: "int", isFallback: false });
  });

  it("maps varchar variants and captures length param", () => {
    expect(mapDatatype("varchar(255)")).toMatchObject({
      type: "varchar(n)",
      typeParams: { maxLength: "255" },
      isFallback: false,
    });
    expect(mapDatatype("char")).toMatchObject({ type: "varchar(n)", isFallback: false });
    expect(mapDatatype("varchar")).toMatchObject({ type: "varchar(n)", isFallback: false });
  });

  it("maps decimal variants and captures precision/scale params", () => {
    expect(mapDatatype("decimal(10,2)")).toMatchObject({
      type: "decimal(p,s)",
      typeParams: { precision: "10", scale: "2" },
      isFallback: false,
    });
    expect(mapDatatype("numeric(5)")).toMatchObject({
      type: "decimal(p,s)",
      typeParams: { precision: "5", scale: "" },
      isFallback: false,
    });
  });

  it("maps enum and captures values", () => {
    expect(mapDatatype("enum(A,B,C)")).toMatchObject({
      type: "enum(e)",
      typeParams: { enumValues: "a,b,c" },
      isFallback: false,
    });
  });

  it("maps scalar types", () => {
    for (const [raw, type] of [
      ["text", "text"],
      ["boolean", "boolean"],
      ["bool", "boolean"],
      ["datetime", "datetime"],
      ["timestamp", "timestamp"],
      ["date", "date"],
      ["time", "time"],
    ]) {
      expect(mapDatatype(raw)).toMatchObject({ type, isFallback: false });
    }
  });

  it("returns isFallback: true and empty type for unknown datatypes", () => {
    expect(mapDatatype("jsonb")).toMatchObject({ type: "", isFallback: true });
    expect(mapDatatype("xml")).toMatchObject({ type: "", isFallback: true });
  });

  it("returns empty type and isFallback: false for empty/null input", () => {
    expect(mapDatatype("")).toMatchObject({ type: "", isFallback: false });
    expect(mapDatatype(null)).toMatchObject({ type: "", isFallback: false });
  });

  it("is case-insensitive", () => {
    expect(mapDatatype("INT")).toMatchObject({ type: "int", isFallback: false });
    expect(mapDatatype("VARCHAR(10)")).toMatchObject({ type: "varchar(n)", isFallback: false });
  });
});

// ─── importJavaModelizer ─────────────────────────────────────────────────────

describe("importJavaModelizer", () => {
  it("returns null for non-string input", () => {
    expect(importJavaModelizer(null)).toBeNull();
    expect(importJavaModelizer(42)).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(importJavaModelizer("not json")).toBeNull();
  });

  it("returns null when tables array is missing", () => {
    expect(importJavaModelizer(JSON.stringify({}))).toBeNull();
    expect(importJavaModelizer(JSON.stringify({ tables: "nope" }))).toBeNull();
  });

  it("returns a model with empty nodes and edges for an empty tables array", () => {
    const result = importJavaModelizer(JSON.stringify({ tables: [] }));
    expect(result).not.toBeNull();
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it("creates one node per table with the correct label and attributes", () => {
    const mod = {
      tables: [
        {
          name: "User",
          x0: 10, y0: 20,
          fields: [
            { name: "id", datatype: "int" },
            { name: "name", datatype: "varchar(100)" },
          ],
        },
      ],
    };
    const result = importJavaModelizer(JSON.stringify(mod));
    expect(result.nodes).toHaveLength(1);
    const node = result.nodes[0];
    expect(node.data.label).toBe("User");
    expect(node.data.attributes).toHaveLength(2);
    expect(node.data.attributes[0].name).toBe("id");
    expect(node.data.attributes[0].type).toBe("int");
    expect(node.data.attributes[1].name).toBe("name");
    expect(node.data.attributes[1].type).toBe("varchar(n)");
    expect(node.data.attributes[1].typeParams.maxLength).toBe("100");
  });

  it("counts unmatched attribute types in importWarnings", () => {
    const mod = {
      tables: [{ name: "T", fields: [{ name: "x", datatype: "jsonb" }] }],
    };
    const result = importJavaModelizer(JSON.stringify(mod));
    expect(result.importWarnings.unmatchedAttributeTypes).toBe(1);
  });

  it("creates association edges from table links", () => {
    const mod = {
      tables: [
        {
          name: "A",
          links: [
            {
              name: "rel",
              endpoints: [
                { dob: "A", cardinality: "1" },
                { dob: "B", cardinality: "n" },
              ],
            },
          ],
        },
        { name: "B" },
      ],
    };
    const result = importJavaModelizer(JSON.stringify(mod));
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].type).toBe("association");
    expect(result.edges[0].data.multiplicityA).toBe("1");
    expect(result.edges[0].data.multiplicityB).toBe("n");
  });

  it("enforces a maximum of 2 reflexive edges per class", () => {
    const links = [1, 2, 3].map((i) => ({
      name: `rel${i}`,
      endpoints: [{ dob: "A" }, { dob: "A" }],
    }));
    const mod = { tables: [{ name: "A", links }] };
    const result = importJavaModelizer(JSON.stringify(mod));
    const reflexiveEdges = result.edges.filter((e) => e.type === "reflexive");
    expect(reflexiveEdges.length).toBeLessThanOrEqual(2);
  });

  it("uses deriveModelName to set the model name from fileName", () => {
    const result = importJavaModelizer(JSON.stringify({ tables: [] }), "Shop.mod");
    expect(result.modelName).toBe("Shop");
  });

  it("uses 'Imported model' when no fileName is provided", () => {
    const result = importJavaModelizer(JSON.stringify({ tables: [] }));
    expect(result.modelName).toBe("Imported model");
  });

  it("includes MODEL_VERSION in the result", () => {
    const result = importJavaModelizer(JSON.stringify({ tables: [] }));
    expect(result.version).toBeDefined();
  });
});

import { describe, it, expect } from "vitest";
import {
  parseEnumValues,
  parseDefaultValue,
  mapMySqlDatatype,
  buildGridPositions,
  extractColumnNames,
  getForeignKeyDefinition,
  getRelationshipHandles,
  importMySql,
} from "../mysqlImport.js";

// ─── parseEnumValues ──────────────────────────────────────────────────────────

describe("parseEnumValues", () => {
  it("extracts string values from an expr_list", () => {
    const expr = {
      type: "expr_list",
      value: [
        { value: "ACTIVE" },
        { value: "INACTIVE" },
      ],
    };
    expect(parseEnumValues(expr)).toEqual(["ACTIVE", "INACTIVE"]);
  });

  it("falls back to raw when value is not a string", () => {
    const expr = {
      type: "expr_list",
      value: [{ raw: "'PENDING'" }, { value: "DONE" }],
    };
    expect(parseEnumValues(expr)).toEqual(["'PENDING'", "DONE"]);
  });

  it("returns [] for non-expr_list type", () => {
    expect(parseEnumValues({ type: "column_ref" })).toEqual([]);
    expect(parseEnumValues(null)).toEqual([]);
    expect(parseEnumValues(undefined)).toEqual([]);
  });

  it("filters out entries that produce empty strings", () => {
    const expr = { type: "expr_list", value: [{ value: "" }, { value: "OK" }] };
    expect(parseEnumValues(expr)).toEqual(["OK"]);
  });
});

// ─── parseDefaultValue ────────────────────────────────────────────────────────

describe("parseDefaultValue", () => {
  it("returns '' for falsy input", () => {
    expect(parseDefaultValue(null)).toBe("");
    expect(parseDefaultValue(undefined)).toBe("");
    expect(parseDefaultValue(0)).toBe("");
  });

  it("returns the string directly when value is a string", () => {
    expect(parseDefaultValue({ value: "hello" })).toBe("hello");
  });

  it("converts numeric value to string", () => {
    expect(parseDefaultValue({ value: 42 })).toBe("42");
  });

  it("handles single/double quoted string objects", () => {
    expect(parseDefaultValue({ value: { type: "single_quote_string", value: "  foo  " } }))
      .toBe("foo");
    expect(parseDefaultValue({ value: { type: "double_quote_string", value: "  bar  " } }))
      .toBe("bar");
  });

  it("handles number type objects", () => {
    expect(parseDefaultValue({ value: { type: "number", value: 99 } })).toBe("99");
  });

  it("extracts function name for function type objects", () => {
    expect(parseDefaultValue({
      value: {
        type: "function",
        name: { name: [{ value: "NOW" }] },
      },
    })).toBe("NOW");
  });

  it("returns '' for unknown object types", () => {
    expect(parseDefaultValue({ value: { type: "unknown" } })).toBe("");
  });

  it("handles top-level string/number values (no .value wrapper)", () => {
    expect(parseDefaultValue("direct")).toBe("direct");
    expect(parseDefaultValue(7)).toBe("7");
  });
});

// ─── mapMySqlDatatype ─────────────────────────────────────────────────────────

describe("mapMySqlDatatype", () => {
  it("maps int variants to int", () => {
    for (const t of ["int", "integer", "smallint", "bigint", "mediumint"]) {
      expect(mapMySqlDatatype({ dataType: t })).toMatchObject({ type: "int", isFallback: false });
    }
  });

  it("maps tinyint(1) to boolean", () => {
    expect(mapMySqlDatatype({ dataType: "tinyint", length: 1 }))
      .toMatchObject({ type: "boolean", isFallback: false });
  });

  it("maps tinyint with other lengths to int", () => {
    expect(mapMySqlDatatype({ dataType: "tinyint", length: 4 }))
      .toMatchObject({ type: "int", isFallback: false });
    expect(mapMySqlDatatype({ dataType: "tinyint" }))
      .toMatchObject({ type: "int", isFallback: false });
  });

  it("maps varchar/char/nvarchar/nchar and captures length", () => {
    expect(mapMySqlDatatype({ dataType: "varchar", length: 255 }))
      .toMatchObject({ type: "varchar(n)", typeParams: { maxLength: "255" }, isFallback: false });
    expect(mapMySqlDatatype({ dataType: "nvarchar", length: 100 }))
      .toMatchObject({ type: "varchar(n)", typeParams: { maxLength: "100" } });
    expect(mapMySqlDatatype({ dataType: "char" }))
      .toMatchObject({ type: "varchar(n)" });
  });

  it("maps decimal/numeric/float/double and captures precision+scale", () => {
    expect(mapMySqlDatatype({ dataType: "decimal", length: 10, scale: 2 }))
      .toMatchObject({ type: "decimal(p,s)", typeParams: { precision: "10", scale: "2" } });
    expect(mapMySqlDatatype({ dataType: "float" }))
      .toMatchObject({ type: "decimal(p,s)" });
  });

  it("maps enum and extracts values", () => {
    const expr = { type: "expr_list", value: [{ value: "A" }, { value: "B" }] };
    expect(mapMySqlDatatype({ dataType: "enum", expr }))
      .toMatchObject({ type: "enum(e)", typeParams: { enumValues: "A, B" } });
  });

  it("maps text variants", () => {
    for (const t of ["text", "tinytext", "mediumtext", "longtext"]) {
      expect(mapMySqlDatatype({ dataType: t })).toMatchObject({ type: "text" });
    }
  });

  it("maps boolean/bool", () => {
    expect(mapMySqlDatatype({ dataType: "boolean" })).toMatchObject({ type: "boolean" });
    expect(mapMySqlDatatype({ dataType: "bool" })).toMatchObject({ type: "boolean" });
  });

  it("maps date/time types", () => {
    for (const [t, expected] of [
      ["datetime", "datetime"], ["timestamp", "timestamp"],
      ["date", "date"], ["time", "time"],
    ]) {
      expect(mapMySqlDatatype({ dataType: t })).toMatchObject({ type: expected });
    }
  });

  it("returns isFallback:true for unknown types", () => {
    expect(mapMySqlDatatype({ dataType: "jsonb" })).toMatchObject({ type: "", isFallback: true });
  });

  it("returns empty type for empty/missing dataType", () => {
    expect(mapMySqlDatatype({})).toMatchObject({ type: "", isFallback: false });
    expect(mapMySqlDatatype({ dataType: "" })).toMatchObject({ type: "", isFallback: false });
  });
});

// ─── buildGridPositions ───────────────────────────────────────────────────────

describe("buildGridPositions", () => {
  it("returns empty array for 0 items", () => {
    expect(buildGridPositions(0)).toEqual([]);
  });

  it("returns a single position for 1 item", () => {
    const positions = buildGridPositions(1);
    expect(positions).toHaveLength(1);
    expect(typeof positions[0].x).toBe("number");
    expect(typeof positions[0].y).toBe("number");
  });

  it("places items in a grid with correct row/col logic", () => {
    const positions = buildGridPositions(4);
    expect(positions).toHaveLength(4);
    // 4 items → 2 columns. First two in row 0, second two in row 1.
    expect(positions[0].y).toBe(positions[1].y);
    expect(positions[2].y).toBe(positions[3].y);
    expect(positions[2].y).toBeGreaterThan(positions[0].y);
  });

  it("produces unique x/y pairs for each item", () => {
    const positions = buildGridPositions(9);
    const unique = new Set(positions.map((p) => `${p.x},${p.y}`));
    expect(unique.size).toBe(9);
  });
});

// ─── extractColumnNames ───────────────────────────────────────────────────────

describe("extractColumnNames", () => {
  it("extracts column strings from a definition array", () => {
    expect(extractColumnNames([{ column: "id" }, { column: "name" }]))
      .toEqual(["id", "name"]);
  });

  it("filters out entries without a column property", () => {
    expect(extractColumnNames([{ column: "id" }, {}, { column: "" }]))
      .toEqual(["id"]);
  });

  it("returns [] for non-array input", () => {
    expect(extractColumnNames(null)).toEqual([]);
    expect(extractColumnNames(undefined)).toEqual([]);
    expect(extractColumnNames("bad")).toEqual([]);
  });
});

// ─── getForeignKeyDefinition ──────────────────────────────────────────────────

describe("getForeignKeyDefinition", () => {
  const makeConstraint = (srcCol, targetTable, targetCol) => ({
    definition: [{ column: srcCol }],
    reference_definition: {
      table: [{ table: targetTable }],
      definition: [{ column: targetCol }],
    },
  });

  it("returns { sourceColumn, targetTable, targetColumn } for a valid single-column FK", () => {
    expect(getForeignKeyDefinition(makeConstraint("user_id", "users", "id")))
      .toEqual({ sourceColumn: "user_id", targetTable: "users", targetColumn: "id" });
  });

  it("returns null when source has multiple columns", () => {
    const constraint = {
      definition: [{ column: "a" }, { column: "b" }],
      reference_definition: {
        table: [{ table: "t" }],
        definition: [{ column: "id" }],
      },
    };
    expect(getForeignKeyDefinition(constraint)).toBeNull();
  });

  it("returns null when target table is missing", () => {
    const constraint = {
      definition: [{ column: "user_id" }],
      reference_definition: {
        table: [{}],
        definition: [{ column: "id" }],
      },
    };
    expect(getForeignKeyDefinition(constraint)).toBeNull();
  });

  it("returns null for null/undefined input", () => {
    expect(getForeignKeyDefinition(null)).toBeNull();
    expect(getForeignKeyDefinition(undefined)).toBeNull();
  });
});

// ─── getRelationshipHandles ───────────────────────────────────────────────────

describe("getRelationshipHandles", () => {
  it("puts source handle on right when target is to the right", () => {
    const result = getRelationshipHandles({ x: 0 }, { x: 100 }, "srcAttr", "tgtAttr");
    expect(result.sourceHandle).toContain("right-");
    expect(result.targetHandle).toContain("left-");
  });

  it("puts source handle on left when target is to the left", () => {
    const result = getRelationshipHandles({ x: 100 }, { x: 0 }, "srcAttr", "tgtAttr");
    expect(result.sourceHandle).toContain("left-");
    expect(result.targetHandle).toContain("right-");
  });

  it("includes the attribute ids in the handle strings", () => {
    const result = getRelationshipHandles({ x: 0 }, { x: 100 }, "attrA", "attrB");
    expect(result.sourceHandle).toContain("attrA");
    expect(result.targetHandle).toContain("attrB");
  });
});

// ─── importMySql (integration) ────────────────────────────────────────────────

describe("importMySql", () => {
  it("returns null for non-string input", async () => {
    expect(await importMySql(null)).toBeNull();
    expect(await importMySql(42)).toBeNull();
  });

  it("returns null when SQL contains no CREATE TABLE statements", async () => {
    expect(await importMySql("SELECT 1")).toBeNull();
  });

  it("parses a simple CREATE TABLE into a node", async () => {
    const sql = `CREATE TABLE users (id INT NOT NULL PRIMARY KEY, name VARCHAR(255) NOT NULL)`;
    const result = await importMySql(sql, "schema.sql");
    expect(result).not.toBeNull();
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].data.label).toBe("users");
    expect(result.nodes[0].data.attributes).toHaveLength(2);
  });

  it("sets nullable correctly based on NOT NULL and PRIMARY KEY constraints", async () => {
    const sql = `CREATE TABLE t (a INT NOT NULL PRIMARY KEY, b INT NOT NULL, c INT)`;
    const result = await importMySql(sql);
    const [a, b, c] = result.nodes[0].data.attributes;
    expect(a.nullable).toBe(false); // primary key
    expect(b.nullable).toBe(false); // not null
    expect(c.nullable).toBe(true);  // nullable by default
  });

  it("maps tinyint(1) to boolean type", async () => {
    const sql = `CREATE TABLE t (flag TINYINT(1))`;
    const result = await importMySql(sql);
    expect(result.nodes[0].data.attributes[0].type).toBe("boolean");
  });

  it("creates relationship edges from inline FOREIGN KEY constraints", async () => {
    const sql = `
      CREATE TABLE users (id INT PRIMARY KEY);
      CREATE TABLE orders (id INT PRIMARY KEY, user_id INT, FOREIGN KEY (user_id) REFERENCES users(id))
    `;
    const result = await importMySql(sql);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].type).toBe("relationship");
  });

  it("deduplicates relationship edges", async () => {
    const sql = `
      CREATE TABLE a (id INT PRIMARY KEY);
      CREATE TABLE b (id INT PRIMARY KEY, a_id INT, FOREIGN KEY (a_id) REFERENCES a(id));
      ALTER TABLE b ADD FOREIGN KEY (a_id) REFERENCES a(id)
    `;
    const result = await importMySql(sql);
    expect(result.edges).toHaveLength(1);
  });

  it("derives model name from fileName", async () => {
    const sql = `CREATE TABLE t (id INT)`;
    const result = await importMySql(sql, "shop.sql");
    expect(result.modelName).toBe("shop");
  });

  it("returns 'Imported model' when no fileName is given", async () => {
    const sql = `CREATE TABLE t (id INT)`;
    const result = await importMySql(sql);
    expect(result.modelName).toBe("Imported model");
  });
});

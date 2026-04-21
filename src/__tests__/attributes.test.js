import { describe, it, expect } from "vitest";
import {
  normalizeAttributes,
  normalizeTypeParams,
  getTypeParamKind,
  formatAttributeType,
  createAttribute,
  ATTRIBUTE_TYPE_PARAMS_DEFAULT,
  ATTRIBUTE_TYPE_UNDEFINED,
} from "../attributes.js";

describe("normalizeTypeParams", () => {
  it("returns defaults for null/undefined/non-object input", () => {
    expect(normalizeTypeParams(null)).toEqual(ATTRIBUTE_TYPE_PARAMS_DEFAULT);
    expect(normalizeTypeParams(undefined)).toEqual(ATTRIBUTE_TYPE_PARAMS_DEFAULT);
    expect(normalizeTypeParams("string")).toEqual(ATTRIBUTE_TYPE_PARAMS_DEFAULT);
    expect(normalizeTypeParams(42)).toEqual(ATTRIBUTE_TYPE_PARAMS_DEFAULT);
  });

  it("passes through valid string properties", () => {
    const params = { maxLength: "10", precision: "5", scale: "2", enumValues: "A,B" };
    expect(normalizeTypeParams(params)).toEqual(params);
  });

  it("replaces non-string properties with empty string", () => {
    expect(normalizeTypeParams({ maxLength: 10, precision: null, scale: true, enumValues: [] }))
      .toEqual({ maxLength: "", precision: "", scale: "", enumValues: "" });
  });

  it("fills missing properties with empty string", () => {
    expect(normalizeTypeParams({})).toEqual(ATTRIBUTE_TYPE_PARAMS_DEFAULT);
    expect(normalizeTypeParams({ maxLength: "5" }))
      .toEqual({ maxLength: "5", precision: "", scale: "", enumValues: "" });
  });
});

describe("getTypeParamKind", () => {
  it("returns 'length' for types ending with (n)", () => {
    expect(getTypeParamKind("varchar(n)")).toBe("length");
    expect(getTypeParamKind("char(n)")).toBe("length");
  });

  it("returns 'precisionScale' for types ending with (p,s)", () => {
    expect(getTypeParamKind("decimal(p,s)")).toBe("precisionScale");
    expect(getTypeParamKind("numeric(p,s)")).toBe("precisionScale");
  });

  it("returns 'enum' for types ending with (e)", () => {
    expect(getTypeParamKind("enum(e)")).toBe("enum");
  });

  it("returns null for types with no param suffix", () => {
    expect(getTypeParamKind("int")).toBeNull();
    expect(getTypeParamKind("text")).toBeNull();
    expect(getTypeParamKind("boolean")).toBeNull();
    expect(getTypeParamKind("")).toBeNull();
  });

  it("returns null for non-string input", () => {
    expect(getTypeParamKind(null)).toBeNull();
    expect(getTypeParamKind(undefined)).toBeNull();
    expect(getTypeParamKind(42)).toBeNull();
  });
});

describe("formatAttributeType", () => {
  it("returns empty string for falsy, non-string, or ATTRIBUTE_TYPE_UNDEFINED type", () => {
    expect(formatAttributeType("", {})).toBe("");
    expect(formatAttributeType(null, {})).toBe("");
    expect(formatAttributeType(undefined, {})).toBe("");
    expect(formatAttributeType(ATTRIBUTE_TYPE_UNDEFINED, {})).toBe("");
  });

  it("substitutes length parameter for varchar(n)", () => {
    expect(formatAttributeType("varchar(n)", { maxLength: "255" })).toBe("varchar(255)");
  });

  it("returns base type when length param is empty", () => {
    expect(formatAttributeType("varchar(n)", { maxLength: "" })).toBe("varchar(n)");
    expect(formatAttributeType("varchar(n)", {})).toBe("varchar(n)");
  });

  it("substitutes precision and scale for decimal(p,s)", () => {
    expect(formatAttributeType("decimal(p,s)", { precision: "10", scale: "2" })).toBe("decimal(10,2)");
  });

  it("substitutes only precision when scale is empty", () => {
    expect(formatAttributeType("decimal(p,s)", { precision: "10", scale: "" })).toBe("decimal(10)");
  });

  it("returns base type when both precision and scale are empty", () => {
    expect(formatAttributeType("decimal(p,s)", {})).toBe("decimal(p,s)");
  });

  it("substitutes enum values for enum(e)", () => {
    expect(formatAttributeType("enum(e)", { enumValues: "ACTIVE,INACTIVE" })).toBe("enum(ACTIVE,INACTIVE)");
  });

  it("returns base type when enum values are empty", () => {
    expect(formatAttributeType("enum(e)", { enumValues: "" })).toBe("enum(e)");
  });

  it("returns type unchanged for no-param types like int, text", () => {
    expect(formatAttributeType("int", {})).toBe("int");
    expect(formatAttributeType("text", {})).toBe("text");
    expect(formatAttributeType("boolean", {})).toBe("boolean");
  });

  it("trims whitespace from param values before substituting", () => {
    expect(formatAttributeType("varchar(n)", { maxLength: "  10  " })).toBe("varchar(10)");
    expect(formatAttributeType("enum(e)", { enumValues: "  A,B  " })).toBe("enum(A,B)");
  });
});

describe("normalizeAttributes", () => {
  it("returns empty array for non-array input", () => {
    expect(normalizeAttributes("node1", null)).toEqual([]);
    expect(normalizeAttributes("node1", "bad")).toEqual([]);
    expect(normalizeAttributes("node1", 42)).toEqual([]);
  });

  it("converts string attributes to full objects with generated id", () => {
    const result = normalizeAttributes("node1", ["email"]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("node1-attr-0");
    expect(result[0].name).toBe("email");
    expect(result[0].logicalName).toBe("");
    expect(result[0].type).toBe("");
    expect(result[0].nullable).toBe(false);
    expect(result[0].unique).toBe(false);
    expect(result[0].autoIncrement).toBe(false);
  });

  it("normalizes object attributes, preserving existing id and valid fields", () => {
    const attr = {
      id: "existing-id",
      name: "age",
      type: "int",
      nullable: true,
      unique: true,
      autoIncrement: true,
      logicalName: "Age",
      defaultValue: "0",
    };
    const result = normalizeAttributes("node1", [attr]);
    expect(result[0].id).toBe("existing-id");
    expect(result[0].name).toBe("age");
    expect(result[0].type).toBe("int");
    expect(result[0].nullable).toBe(true);
    expect(result[0].unique).toBe(true);
    expect(result[0].autoIncrement).toBe(true);
    expect(result[0].logicalName).toBe("Age");
    expect(result[0].defaultValue).toBe("0");
  });

  it("falls back to label property when name is missing on object attribute", () => {
    const result = normalizeAttributes("node1", [{ label: "myLabel" }]);
    expect(result[0].name).toBe("myLabel");
  });

  it("generates id from nodeId and index when object has no id", () => {
    const result = normalizeAttributes("node1", [{ name: "x" }]);
    expect(result[0].id).toBe("node1-attr-0");
  });

  it("converts invalid attribute entries (null, number) to default objects", () => {
    const result = normalizeAttributes("node1", [null, 42]);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("");
    expect(result[1].name).toBe("");
    expect(result[1].id).toBe("node1-attr-1");
  });

  it("falls back to empty string for non-string boolean fields", () => {
    const result = normalizeAttributes("node1", [{ name: "x", nullable: "yes", unique: 1 }]);
    expect(result[0].nullable).toBe(false);
    expect(result[0].unique).toBe(false);
  });

  it("handles empty array", () => {
    expect(normalizeAttributes("node1", [])).toEqual([]);
  });
});

describe("createAttribute", () => {
  it("returns an object with the correct shape", () => {
    const attr = createAttribute("node1", "email");
    expect(attr.name).toBe("email");
    expect(attr.id).toMatch(/^attr-node1-/);
    expect(attr.logicalName).toBe("");
    expect(attr.type).toBe("");
    expect(attr.defaultValue).toBe("");
    expect(attr.nullable).toBe(false);
    expect(attr.unique).toBe(false);
    expect(attr.autoIncrement).toBe(false);
  });

  it("includes normalized typeParams and visibility defaults", () => {
    const attr = createAttribute("node1", "x");
    expect(attr.typeParams).toEqual(ATTRIBUTE_TYPE_PARAMS_DEFAULT);
    expect(attr.visibility).toEqual({ conceptual: true, logical: true, physical: true });
  });

  it("passes the name through unchanged", () => {
    expect(createAttribute("n", "My Field").name).toBe("My Field");
    expect(createAttribute("n", "").name).toBe("");
  });
});

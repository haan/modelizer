import { describe, it, expect } from "vitest";
import { sanitizeFileName } from "../fileUtils.js";

describe("sanitizeFileName", () => {
  it("returns empty string for falsy input", () => {
    expect(sanitizeFileName("")).toBe("");
    expect(sanitizeFileName(null)).toBe("");
    expect(sanitizeFileName(undefined)).toBe("");
  });

  it("returns clean name unchanged", () => {
    expect(sanitizeFileName("MyModel")).toBe("MyModel");
    expect(sanitizeFileName("my model")).toBe("my model");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeFileName("  hello  ")).toBe("hello");
  });

  it("collapses multiple spaces to a single space", () => {
    expect(sanitizeFileName("a   b")).toBe("a b");
  });

  it("replaces invalid filesystem characters with hyphens", () => {
    expect(sanitizeFileName("a<b")).toBe("a-b");
    expect(sanitizeFileName("a>b")).toBe("a-b");
    expect(sanitizeFileName("a:b")).toBe("a-b");
    expect(sanitizeFileName('a"b')).toBe("a-b");
    expect(sanitizeFileName("a/b")).toBe("a-b");
    expect(sanitizeFileName("a\\b")).toBe("a-b");
    expect(sanitizeFileName("a|b")).toBe("a-b");
    expect(sanitizeFileName("a?b")).toBe("a-b");
    expect(sanitizeFileName("a*b")).toBe("a-b");
  });

  it("replaces control characters (code < 32) with hyphens", () => {
    expect(sanitizeFileName("a\tb")).toBe("a-b");
    expect(sanitizeFileName("a\nb")).toBe("a-b");
    expect(sanitizeFileName("a\x00b")).toBe("a-b");
    expect(sanitizeFileName("a\x1fb")).toBe("a-b");
  });
});

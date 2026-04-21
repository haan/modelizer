import { describe, it, expect, vi } from "vitest";
import { getPaletteColor, getRandomPaletteColor, CLASS_COLOR_PALETTE } from "../classPalette.js";

describe("getPaletteColor", () => {
  it("returns the first colour for index 0", () => {
    expect(getPaletteColor(0)).toBe(CLASS_COLOR_PALETTE[0]);
  });

  it("wraps around when index exceeds palette length", () => {
    expect(getPaletteColor(CLASS_COLOR_PALETTE.length)).toBe(CLASS_COLOR_PALETTE[0]);
    expect(getPaletteColor(CLASS_COLOR_PALETTE.length + 1)).toBe(CLASS_COLOR_PALETTE[1]);
  });

  it("uses absolute value for negative indices", () => {
    expect(getPaletteColor(-1)).toBe(CLASS_COLOR_PALETTE[1]);
    expect(getPaletteColor(-CLASS_COLOR_PALETTE.length)).toBe(CLASS_COLOR_PALETTE[0]);
  });

  it("returns a non-empty hex colour string", () => {
    const colour = getPaletteColor(3);
    expect(colour).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe("getRandomPaletteColor", () => {
  it("returns a colour that exists in the palette", () => {
    const colour = getRandomPaletteColor();
    expect(CLASS_COLOR_PALETTE).toContain(colour);
  });

  it("picks the colour at the floored random index", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(getRandomPaletteColor()).toBe(CLASS_COLOR_PALETTE[0]);

    Math.random.mockReturnValue(0.9999);
    expect(getRandomPaletteColor()).toBe(CLASS_COLOR_PALETTE[CLASS_COLOR_PALETTE.length - 1]);

    Math.random.mockRestore();
  });
});

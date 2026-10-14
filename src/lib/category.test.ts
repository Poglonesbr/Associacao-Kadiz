import { describe, expect, it } from "vitest";
import { getCategory } from "./category";

describe("getCategory", () => {
  const today = new Date(2026, 9, 14);
  it.each([
    [new Date(2015, 11, 17), "Sub-10"],
    [new Date(2011, 6, 16), "Sub-16"],
    [new Date(2019, 3, 13), "Sub-8"],
    [new Date(2015, 10, 15), "Sub-10"],
  ])("returns an even category age for %s", (birthDate, expected) => {
    expect(getCategory(birthDate, today)).toBe(expected);
  });
});

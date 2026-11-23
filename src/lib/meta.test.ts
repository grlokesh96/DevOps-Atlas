import { describe, expect, it } from "vitest";
import { CATEGORIES, CONTENT_TYPES, TYPE_META, formatDate, slugify } from "./meta";

describe("slugify", () => {
  it("lowercases and hyphenates titles", () => {
    expect(slugify("Production EKS Architecture")).toBe("production-eks-architecture");
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("  Hello, World!  ")).toBe("hello-world");
    expect(slugify("C++ & Go")).toBe("c-go");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("--already-slugged--")).toBe("already-slugged");
  });
});

describe("formatDate", () => {
  it("formats ISO dates consistently", () => {
    expect(formatDate("2026-10-07")).toBe("Oct 7, 2026");
  });

  it("returns an empty string for empty input", () => {
    expect(formatDate("")).toBe("");
  });

  it("returns the original value when unparseable", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

describe("content metadata", () => {
  it("defines all supported content types and routes", () => {
    expect(CONTENT_TYPES).toHaveLength(8);
    for (const type of CONTENT_TYPES) {
      expect(TYPE_META[type].route.length).toBeGreaterThan(0);
      expect(TYPE_META[type].label.length).toBeGreaterThan(0);
    }
  });

  it("has unique category names", () => {
    expect(new Set(CATEGORIES).size).toBe(CATEGORIES.length);
  });
});

import { test, expect, describe } from "bun:test";
import {
  yearSlugOf,
  academicYearUrl,
  canonicalTenantUrl,
  swapYearUrl,
} from "../routing/academic-year-url";

describe("yearSlugOf", () => {
  test("passes a conventional name through unchanged", () => {
    expect(yearSlugOf("2026-2027")).toBe("2026-2027");
    expect(yearSlugOf("2026-27")).toBe("2026-27");
  });
  test("normalises free text an admin may have typed", () => {
    expect(yearSlugOf("FY 2026")).toBe("fy-2026");
    expect(yearSlugOf(" 2026--27 ")).toBe("2026-27");
    expect(yearSlugOf("Session 2026/27")).toBe("session-2026-27");
  });
});

describe("academicYearUrl", () => {
  test("a bare key gets the year inserted after the tenant", () => {
    expect(academicYearUrl("demo", "2026-2027", "results-entry")).toBe(
      "/demo/2026-2027/results-entry",
    );
  });
  test("a qualified key keeps both segments", () => {
    expect(academicYearUrl("demo", "2026-2027", "academics/classes")).toBe(
      "/demo/2026-2027/academics/classes",
    );
  });
  test("query strings ride along untouched", () => {
    expect(
      academicYearUrl("demo", "2026-2027", "students?student=S-1%20A"),
    ).toBe("/demo/2026-2027/students?student=S-1%20A");
  });
  test("no year yields the year-free URL the gate screen needs", () => {
    expect(academicYearUrl("demo", null, "academic-years")).toBe(
      "/demo/academic-years",
    );
  });
  test("no tenant yields a platform route", () => {
    expect(academicYearUrl("", null, "tenants")).toBe("/tenants");
  });
});

describe("canonicalTenantUrl", () => {
  test("a year-free path gains the year before the screen", () => {
    expect(
      canonicalTenantUrl({
        slug: "demo",
        segments: ["results-entry"],
        yearSlug: "2026-2027",
      }),
    ).toBe("/demo/2026-2027/results-entry");
  });
  test("a module-scoped path keeps its two segments", () => {
    expect(
      canonicalTenantUrl({
        slug: "demo",
        segments: ["academics", "classes"],
        yearSlug: "2026-2027",
      }),
    ).toBe("/demo/2026-2027/academics/classes");
  });
  test("search is re-appended", () => {
    expect(
      canonicalTenantUrl({
        slug: "demo",
        segments: ["students"],
        yearSlug: "2026-2027",
        search: "?classId=C-9",
      }),
    ).toBe("/demo/2026-2027/students?classId=C-9");
  });
});

describe("swapYearUrl", () => {
  test("only the year segment changes", () => {
    expect(
      swapYearUrl({
        slug: "demo",
        segments: ["2026-2027", "academics", "classes"],
        fromYearSlug: "2026-2027",
        toYearSlug: "2025-2026",
      }),
    ).toBe("/demo/2025-2026/academics/classes");
  });
  test("a URL that carries no year gains one at the front of the tail", () => {
    expect(
      swapYearUrl({
        slug: "demo",
        segments: ["exams"],
        fromYearSlug: null,
        toYearSlug: "2026-2027",
      }),
    ).toBe("/demo/2026-2027/exams");
  });
  test("an empty tail means the dashboard", () => {
    expect(
      swapYearUrl({
        slug: "demo",
        segments: ["2026-2027"],
        fromYearSlug: "2026-2027",
        toYearSlug: "2025-2026",
      }),
    ).toBe("/demo/2025-2026/module");
  });
});

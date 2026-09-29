import { test, expect, describe } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  REMARKS_MAX_LENGTH,
  studentUpdateAuditDetails,
} from "./student-update.audit";

const SRC_ROOT = resolve(import.meta.dir, "..", "..");

describe("student update audit details", () => {
  test("an ordinary student edit contributes nothing to the audit trail", () => {
    // The existing edit-student flow sends none of these keys; its audit row must
    // look exactly as it did before the class change screen existed.
    expect(studentUpdateAuditDetails({ name: "Ayesha Rahman", classId: "cls-2" })).toEqual({});
    expect(studentUpdateAuditDetails(undefined)).toEqual({});
  });

  test("supplied values are trimmed into the audit details", () => {
    expect(
      studentUpdateAuditDetails({
        effectiveDate: " 2026-10-01 ",
        reason: "  Family relocation ",
        remarks: " Parent emailed the office ",
      }),
    ).toEqual({
      effectiveDate: "2026-10-01",
      reason: "Family relocation",
      remarks: "Parent emailed the office",
    });
  });

  test("blank text is dropped instead of recorded as an empty field", () => {
    expect(
      studentUpdateAuditDetails({ effectiveDate: "2026-10-01", reason: "   ", remarks: "" }),
    ).toEqual({ effectiveDate: "2026-10-01" });
  });

  test("a date that is not a calendar date is refused", () => {
    // The screen has a date input, so a hand-crafted request is the only way junk
    // gets here — and a wrong date in an audit trail is worse than no date.
    expect(() => studentUpdateAuditDetails({ effectiveDate: "01/10/2026" })).toThrowError(
      expect.objectContaining({ code: "INVALID_EFFECTIVE_DATE" }),
    );
    expect(() => studentUpdateAuditDetails({ effectiveDate: "2026-13-45" })).toThrowError(
      expect.objectContaining({ code: "INVALID_EFFECTIVE_DATE" }),
    );
  });

  test("an over-long reason is refused rather than silently truncated", () => {
    expect(() =>
      studentUpdateAuditDetails({ reason: "x".repeat(121) }),
    ).toThrowError(expect.objectContaining({ code: "REASON_TOO_LONG" }));
  });

  test("an over-long remark is refused", () => {
    expect(() =>
      studentUpdateAuditDetails({ remarks: "x".repeat(REMARKS_MAX_LENGTH + 1) }),
    ).toThrowError(expect.objectContaining({ code: "REMARKS_TOO_LONG" }));
  });

  test("the length gate counts trimmed text", () => {
    expect(
      studentUpdateAuditDetails({ remarks: `  ${"x".repeat(REMARKS_MAX_LENGTH)}  ` }).remarks,
    ).toHaveLength(REMARKS_MAX_LENGTH);
  });

  test("the route puts them inside newData, which is where the audit queue keeps them", () => {
    // Measured, not assumed: audit-helper reads only `id`, `oldData` and `newData` out of the
    // details it is handed, and the worker stores exactly those. Spreading the three fields
    // beside `newData` compiled, returned 200 and produced an audit row with no trace of them.
    const src = readFileSync(
      join(SRC_ROOT, "modules/students/students.routes.ts"),
      "utf8",
    );
    const start = src.indexOf("action: 'UPDATE_STUDENT'");
    expect(start).toBeGreaterThan(-1);
    const call = src.slice(start, src.indexOf("return { success: true };", start));

    expect([...call.matchAll(/\.\.\.changeDetails/g)].length).toBe(1);
    const newDataStart = call.indexOf("newData: {");
    const spread = call.indexOf("...changeDetails");
    expect(spread).toBeGreaterThan(newDataStart);
    expect(spread).toBeLessThan(call.indexOf("\n      }", newDataStart));
  });
});

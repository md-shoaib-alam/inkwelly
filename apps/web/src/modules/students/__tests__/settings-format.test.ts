import { test, expect, describe } from "bun:test";
import {
  DEFAULT_SETTINGS,
  parseStudentsSettings,
  previewId,
  shortSchoolYear,
} from "../settings/settings-format";

const ctx = { schoolCode: "DEL", calendarYear: "2026", schoolYear: "2026-27" };

describe("previewId", () => {
  test("renders the default pattern from the prefix, the year and a padded sequence", () => {
    expect(
      previewId({ ...DEFAULT_SETTINGS.studentId, enabled: true }, ctx),
    ).toBe("STU20260001");
  });

  test("a start number continues the series instead of restarting at 1", () => {
    expect(
      previewId({ ...DEFAULT_SETTINGS.studentId, enabled: true, startFrom: "450" }, ctx),
    ).toBe("STU20260450");
  });

  test("a start past the configured width is never truncated", () => {
    // 12345 in a 4-wide field still has to render in full, or the previewed ID would
    // collide with an earlier one in the same series.
    expect(
      previewId({ ...DEFAULT_SETTINGS.studentId, enabled: true, startFrom: "12345" }, ctx),
    ).toBe("STU202612345");
  });

  test("every token the chips can insert is substituted", () => {
    expect(
      previewId(
        {
          ...DEFAULT_SETTINGS.studentId,
          enabled: true,
          format: "{SCHOOL_CODE}-{PREFIX}/{SCHOOL_YEAR}-{SEQ}",
          numberLength: "3",
        },
        ctx,
      ),
    ).toBe("DEL-STU/2026-27-001");
  });

  test("an off rule previews nothing, which is what the card's manual-entry note depends on", () => {
    expect(previewId(DEFAULT_SETTINGS.studentId, ctx)).toBeNull();
  });
});

describe("parseStudentsSettings", () => {
  test("a tenant that never saved these settings gets the reference defaults", () => {
    const parsed = parseStudentsSettings({});
    expect(parsed.studentId.prefix).toBe("STU");
    expect(parsed.admissionNo.prefix).toBe("ADM");
    expect(parsed.studentId.enabled).toBe(false);
    expect(parsed.schoolCode).toBe("");
  });

  test("a stored rule keeps its own values and inherits only the parts it lacks", () => {
    const parsed = parseStudentsSettings({
      schoolCode: "DEL",
      studentId: { prefix: "DPS", enabled: true },
    });
    expect(parsed.schoolCode).toBe("DEL");
    expect(parsed.studentId.prefix).toBe("DPS");
    expect(parsed.studentId.enabled).toBe(true);
    expect(parsed.studentId.numberLength).toBe("4");
    expect(parsed.studentId.format).toBe("{PREFIX}{YEAR}{SEQ}");
  });

  test("a missing or malformed payload cannot take the screen down", () => {
    for (const raw of [null, undefined, "not an object", 42]) {
      expect(parseStudentsSettings(raw).admissionNo.prefix).toBe("ADM");
    }
  });
});

describe("school years", () => {

  test("a full session name shortens to the form an ID carries", () => {
    expect(shortSchoolYear("2026-2027")).toBe("2026-27");
    expect(shortSchoolYear("2026-27")).toBe("2026-27");
    expect(shortSchoolYear(null)).toBe("");
  });
});

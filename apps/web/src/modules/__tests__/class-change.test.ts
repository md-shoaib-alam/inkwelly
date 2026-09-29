import { test, expect, describe } from "bun:test";
import {
  buildChangeClassRequests,
  validateChangeClassForm,
  type ChangeClassTarget,
  type ChangeClassForm,
} from "../students/class-change/class-change.request";

const zara: ChangeClassTarget = { id: "s-1", name: "Zara Ahmed", classId: "cls-5a", className: "5-A", rollNumber: "12" };
const bilal: ChangeClassTarget = { id: "s-2", name: "Bilal Khan", classId: "cls-5a", className: "5-A", rollNumber: "13" };

const form = (over: Partial<ChangeClassForm> = {}): ChangeClassForm => ({
  targetClassId: "cls-6a",
  newRollNumber: "",
  effectiveDate: "2026-10-01",
  reason: "Family relocation",
  remarks: "",
  ...over,
});

describe("class change validation", () => {
  test("a complete single-student change is accepted", () => {
    expect(validateChangeClassForm([zara], form())).toBeNull();
  });

  test("nothing selected is refused before anything is sent", () => {
    expect(validateChangeClassForm([], form())).toMatch(/Select at least one student/);
  });

  test("no target class is refused", () => {
    expect(validateChangeClassForm([zara], form({ targetClassId: "" }))).toMatch(/class to move to/);
  });

  test("moving a student into the class they are already in is refused", () => {
    // The server would accept it and quietly write an audit row for no change.
    expect(validateChangeClassForm([zara], form({ targetClassId: "cls-5a" }))).toMatch(/already in/);
  });

  test("the refusal counts every student already in the target", () => {
    const third: ChangeClassTarget = { id: "s-3", name: "Iyan Ali", classId: "cls-6a", className: "6-A", rollNumber: "1" };
    expect(validateChangeClassForm([zara, bilal, third], form({ targetClassId: "cls-6a" }))).toMatch(/1 selected/);
  });

  test("an effective date is required", () => {
    expect(validateChangeClassForm([zara], form({ effectiveDate: "" }))).toMatch(/date/);
  });

  test("a reason is required, and Other has to be explained", () => {
    expect(validateChangeClassForm([zara], form({ reason: "" }))).toMatch(/reason/);
    expect(
      validateChangeClassForm([zara], form({ reason: "Other", remarks: "  " })),
    ).toMatch(/describe/i);
    expect(
      validateChangeClassForm([zara], form({ reason: "Other", remarks: "Court order" })),
    ).toBeNull();
  });

  test("one new roll number cannot be spread across several students", () => {
    expect(
      validateChangeClassForm([zara, bilal], form({ newRollNumber: "40" })),
    ).toMatch(/one student/i);
  });
});

describe("class change requests", () => {
  test("a single student carries their new roll number when one is given", () => {
    expect(buildChangeClassRequests([zara], form({ newRollNumber: "  40  " }))).toEqual([
      {
        id: "s-1",
        classId: "cls-6a",
        rollNumber: "40",
        effectiveDate: "2026-10-01",
        reason: "Family relocation",
        remarks: "",
      },
    ]);
  });

  test("a blank roll number is omitted, not sent as an empty string", () => {
    // PUT /students writes any string it receives into rollNumber.
    const [request] = buildChangeClassRequests([zara], form());
    expect(request).not.toHaveProperty("rollNumber");
  });

  test("a bulk change sends one request per student and no roll number", () => {
    const requests = buildChangeClassRequests(
      [zara, bilal],
      form({ newRollNumber: "40", remarks: " Block move " }),
    );
    expect(requests.map((r) => r.id)).toEqual(["s-1", "s-2"]);
    expect(requests.every((r) => !("rollNumber" in r))).toBe(true);
    expect(requests[0]?.remarks).toBe("Block move");
  });

  test("every request names the class, date and reason being recorded", () => {
    for (const request of buildChangeClassRequests([zara, bilal], form())) {
      expect(request.classId).toBe("cls-6a");
      expect(request.effectiveDate).toBe("2026-10-01");
      expect(request.reason).toBe("Family relocation");
    }
  });
});

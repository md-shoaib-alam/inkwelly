import { describe, expect, test } from "bun:test";
import { evaluateEligibility } from "../promotion/eligibility";

const base = {
  classId: "cls-1",
  className: "Class-5",
  admissionNo: "ADM-100",
  rollNumber: "12",
  status: "active",
};

describe("promotion eligibility rules", () => {
  test("a complete, active student is eligible", () => {
    expect(evaluateEligibility(base)).toEqual({ status: "eligible", failedRules: [] });
  });

  test("missing admission number or roll is a warning, not a block", () => {
    expect(evaluateEligibility({ ...base, admissionNo: "" })).toMatchObject({
      status: "warning",
      failedRules: ["Missing admission number"],
    });
    expect(evaluateEligibility({ ...base, rollNumber: "" })).toMatchObject({
      status: "warning",
      failedRules: ["Missing roll number"],
    });
    expect(evaluateEligibility({ ...base, admissionNo: "", rollNumber: "" }).failedRules).toHaveLength(2);
  });

  test("no class at all blocks, even when the profile is otherwise complete", () => {
    expect(evaluateEligibility({ ...base, classId: "", className: "" })).toMatchObject({
      status: "blocked",
      failedRules: ["No class assigned"],
    });
  });

  test("a non-active student blocks and names the status", () => {
    expect(evaluateEligibility({ ...base, status: "graduated" })).toMatchObject({
      status: "blocked",
      failedRules: ["Not active (graduated)"],
    });
  });

  test("block outranks warning when both apply", () => {
    const verdict = evaluateEligibility({ ...base, classId: "", className: "", admissionNo: "" });
    expect(verdict.status).toBe("blocked");
    expect(verdict.failedRules).toEqual(["No class assigned"]);
  });
});

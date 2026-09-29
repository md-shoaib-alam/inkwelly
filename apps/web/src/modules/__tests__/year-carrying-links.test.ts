import { test, expect, describe } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(import.meta.dir, "..", "..");

/**
 * A tenant URL must come from `academicYearUrl`, `canonicalTenantUrl`,
 * `swapYearUrl` or `useTenantHref`. Anything still interpolating a tenant slug
 * into a hand-written template literal would silently drop the year and bounce
 * the user to the school's default one.
 *
 * Platform routes have no tenant, so they stay bare; the allowlist is the only
 * way a new entry gets in, and each entry needs a reason.
 */
const TENANT_LITERAL =
  /(?:push|replace|redirect|href)\s*[=(]\s*[^`\n]{0,60}`\/[^`]*\$\{\s*(?:slug|tid|t[0-9]?|tenantIdentifier|tenantSlug|currentTenantSlug|currentTenantId|correctSlug|fallback|slugOfTenant)/;

const BUILDER_CALLS = ["academicYearUrl(", "canonicalTenantUrl(", "swapYearUrl(", "tenantHref("];

interface Allowed {
  /** Repo-relative file, forward slashes. */
  file: string;
  /** Substring of the line, so a shifting line number cannot hide a new offender. */
  text: string;
  reason: string;
}

const ALLOWLIST: Allowed[] = [
  {
    file: "app/(authenticated)/[slug]/generic-slug-dispatcher.tsx",
    text: "redirect(`/${correctSlug}`)",
    reason:
      "wrong-slug auto-correction: the year is not known for the right school yet, so the bare root is emitted and the next pass resolves it.",
  },
  {
    file: "app/(authenticated)/[slug]/generic-slug-dispatcher.tsx",
    text: 'redirect(`/${slug}/academic-years`)',
    reason:
      "the setup screen is the one year-free tenant screen (`YEAR_FREE_SCREENS`), so its URL carries no year by design.",
  },
  {
    file: "app/(authenticated)/[slug]/generic-slug-dispatcher.tsx",
    text: "redirect(fallback ? `/${fallback}` : \"/dashboard\")",
    reason:
      "fail-safe hop to the user's own tenant root, which resolves its own year on the next pass.",
  },
  {
    file: "modules/auth/components/Login.tsx",
    text: "window.location.href = tenantId ? `/${tenantId}` : \"/dashboard\"",
    reason:
      "the post-login landing goes to the tenant root, which is where the year is first resolved; nothing is known about the school's sessions yet.",
  },
  {
    file: "app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx",
    text: "redirect(`/${correctSlug}/${segments.join('/')}`)",
    reason:
      "wrong-slug auto-correction that keeps the tail. For a non-admin `academicYears` always returns their own school's list, so a leading year in that tail is by construction theirs; a tail with no year gets canonicalised on the next pass.",
  },
  {
    file: "app/(authenticated)/[slug]/[...segments]/tenant-screen-dispatcher.tsx",
    text: "redirect(`/${slug}/academic-years`)",
    reason:
      "the setup screen is the one year-free tenant screen (`YEAR_FREE_SCREENS`), so its URL carries no year by design.",
  },
];

function files(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry === "__tests__") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files(full, out);
    else if (/\.(tsx?|jsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

function allLines(): { rel: string; line: string }[] {
  const out: { rel: string; line: string }[] = [];
  for (const dir of ["app", "modules", "components"]) {
    for (const file of files(join(SRC, dir))) {
      const rel = file.slice(SRC.length + 1).replace(/\\/g, "/");
      for (const line of readFileSync(file, "utf8").split(/\r?\n/)) out.push({ rel, line });
    }
  }
  return out;
}

function scan(dir: string): string[] {
  const offenders: string[] = [];
  for (const file of files(join(SRC, dir))) {
    const rel = file.slice(SRC.length + 1).replace(/\\/g, "/");
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .forEach((line, i) => {
        // Prose may describe the pattern it is warning against.
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        if (!TENANT_LITERAL.test(line)) return;
        if (BUILDER_CALLS.some((b) => line.includes(b))) return;
        if (ALLOWLIST.some((a) => rel === a.file && line.includes(a.text))) return;
        offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
      });
  }
  return offenders;
}

describe("every tenant link carries the academic year", () => {
  test("no hand-built tenant URL survives outside the builders", () => {
    const offenders = [...scan("app"), ...scan("modules"), ...scan("components")];
    expect(offenders.join("\n")).toBe("");
  });

  test("no allowlist entry outlives the literal it excuses", () => {
    const dead = ALLOWLIST.filter(
      (a) =>
        !allLines().some(
          ({ rel, line }) => rel === a.file && !/^\s*(\/\/|\*|\/\*)/.test(line) && TENANT_LITERAL.test(line) && line.includes(a.text),
        ),
    ).map((a) => a.text);
    expect(dead.join("\n")).toBe("");
  });
});

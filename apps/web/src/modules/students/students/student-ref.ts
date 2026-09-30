/**
 * The Students -> All students screen answers for two URL shapes: `/students/list`
 * is the roster, `/students/list/STU2026120` is one student's profile. The route
 * parser stops at the screen key by design, so the profile ref is read here instead.
 *
 * The ref is only taken from the segment two past this module's own key, and only when
 * the segment in between is a key this screen is actually mounted under. `students` is
 * both the module word and a screen key, and other screens in the rail end in an id
 * too, so a looser rule would read `/students/graduated/<id>` as a student profile.
 */
const ROSTER_SCREEN_KEYS = new Set(["list", "students"]);

export function studentRefFromPathname(pathname: string, moduleKey = "students"): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const at = segments.indexOf(moduleKey);
  if (at === -1) return null;
  const screen = segments[at + 1];
  const ref = segments[at + 2];
  if (!screen || !ROSTER_SCREEN_KEYS.has(screen) || !ref) return null;
  // Anything deeper than one tail is a different screen's URL, not a broken profile link.
  if (segments.length !== at + 3) return null;
  return decode(ref);
}

/** The tail segment that turns a profile URL into the full-page correction form. */
const UPDATE_INFO_TAIL = "update-information";

/**
 * The correction form's own address: one tail segment past the profile it edits, the
 * same shape the shipped product uses. It is parsed separately from the profile ref
 * because the profile parser refuses any deeper path on purpose — a fifth segment is
 * this screen, not a broken profile link.
 */
export function updateInfoRefFromPathname(pathname: string, moduleKey = "students"): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const at = segments.indexOf(moduleKey);
  if (at === -1) return null;
  const screen = segments[at + 1];
  const ref = segments[at + 2];
  if (!screen || !ROSTER_SCREEN_KEYS.has(screen) || !ref) return null;
  if (segments.length !== at + 4 || segments[at + 3] !== UPDATE_INFO_TAIL) return null;
  return decode(ref);
}

/** The correction form's address, built off the roster so the year travels with it. */
export function updateInfoPathOf(rosterPath: string, ref: string): string {
  return `${profilePathOf(rosterPath, ref)}/${UPDATE_INFO_TAIL}`;
}

/**
 * The roster's own address, with the profile ref dropped. The profile is a full-page
 * replace rather than a dialog, so Back has to land on the roster URL and not on a
 * second copy of the profile.
 */
export function rosterPathOf(pathname: string, hasRef?: boolean, moduleKey = "students"): string {
  const cleanPath = pathname.split("?")[0].split("#")[0];
  const segments = cleanPath.split("/").filter(Boolean);
  const at = segments.indexOf(moduleKey);
  if (at !== -1 && segments[at + 1] && ROSTER_SCREEN_KEYS.has(segments[at + 1])) {
    return "/" + segments.slice(0, at + 2).join("/");
  }
  if (!hasRef) return cleanPath;
  const cut = cleanPath.lastIndexOf("/");
  return cut > 0 ? cleanPath.slice(0, cut) : "/";
}

/** The profile URL for one ref, built off the roster's address so the year travels with it. */
export function profilePathOf(rosterPath: string, ref: string): string {
  return `${rosterPath.replace(/\/$/, "")}/${encodeURIComponent(ref)}`;
}

/**
 * The tail a profile link is built from, in the one order the server resolves a ref by:
 * the student ID on the card, then the roll number on the roster, then the internal id.
 *
 * A ref goes into a path segment, not a query string, so it has to be encoded: roll
 * numbers with spaces in them are real (`S-1 A`), and an unencoded space truncates the
 * link at the first one.
 */
export function studentProfileTail(ref: string): string {
  return `list/${encodeURIComponent(ref)}`;
}

export function studentRefOf(student: {
  username?: string | null;
  rollNumber?: string | null;
  id?: string | null;
}): string {
  return student.username || student.rollNumber || student.id || "";
}

// A hand-typed or stale bookmark can carry a broken escape; it must not take the whole
// screen down with it.
function decode(segment: string): string | null {
  try {
    return decodeURIComponent(segment) || null;
  } catch {
    return segment;
  }
}

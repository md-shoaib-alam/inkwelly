/**
 * The Students -> Classes screen answers for two URL shapes: `/students/classes`
 * is the list, `/students/classes/class-1st-a` is one class. The route parser
 * stops at the screen key by design, so the detail ref is read here instead.
 *
 * A ref is only taken from the segment that follows this screen's own key. The
 * dispatcher mounts this module for a bare `/classes` too, and a screen's tail is
 * shared text with every other key (`/students/list/STU-9` also ends in an id), so
 * anchoring on the key is what stops another screen's id being read as a class.
 */
export function classRefFromPathname(pathname: string, screenKey = "classes"): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const keyAt = segments.lastIndexOf(screenKey);
  if (keyAt === -1 || keyAt === segments.length - 1) return null;
  const ref = decode(segments[segments.length - 1]);
  return ref || null;
}

// A hand-typed or stale bookmark can carry a broken escape; it must not take the
// whole screen down with it.
function decode(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

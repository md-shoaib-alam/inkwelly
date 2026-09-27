import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware - no NextAuth, no server-side session.
 * Auth is handled client-side via localStorage token + Zustand store.
 * 
 * This middleware only handles:
 * 1. Redirecting static asset / public paths (no-op)
 * 2. Ensuring API proxy-free routing (no /api routes exist anymore)
 */
export function proxy(request: NextRequest) {
  // Let everything pass through - auth is now client-side
  // The AppShell component checks the Zustand store and redirects to /login if not authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip static files and images
    "/((?!_next/static|_next/image|favicon.ico|images|logo.png).*)",
  ],
};

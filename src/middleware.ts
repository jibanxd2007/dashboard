import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSession } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Unprotected / Public routes
  if (
    pathname.startsWith("/unlock") ||
    pathname.startsWith("/l/") ||
    pathname.startsWith("/offline") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/capture") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.webmanifest" ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|svg|css|js|woff|woff2|webmanifest)$/)
  ) {
    // If accessing /unlock while already logged in, redirect to home
    if (pathname.startsWith("/unlock")) {
      const sessionCookie = request.cookies.get("crm_session")?.value;
      if (isValidSession(sessionCookie)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // Check auth session cookie
  const sessionCookie = request.cookies.get("crm_session")?.value;
  if (!isValidSession(sessionCookie)) {
    const unlockUrl = new URL("/unlock", request.url);
    return NextResponse.redirect(unlockUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

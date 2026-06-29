import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

// Next 16 renamed the "middleware" convention to "proxy" (same behaviour).
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Logged-in users shouldn't sit on auth pages.
  if (isLoggedIn && isPublic) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Everything matched by the config below (the app shell) needs a session.
  if (!isLoggedIn && !isPublic) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except Next internals, the auth API, and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

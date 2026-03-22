import { NextResponse, type NextRequest } from "next/server";

function hasSessionCookie(request: NextRequest): boolean {
  const v = request.cookies.get("applyai_auth")?.value;
  return Boolean(v && v !== "0");
}

export function middleware(request: NextRequest) {
  const hasAuth = hasSessionCookie(request);

  const protectedPaths = ["/dashboard", "/applications", "/resume", "/research"];
  const isProtected = protectedPaths.some((p) =>
    request.nextUrl.pathname.startsWith(p)
  );

  if (!hasAuth && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasAuth && ["/login", "/signup"].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

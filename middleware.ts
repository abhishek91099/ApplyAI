import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hasAuth = request.cookies.has("applyai_auth");

  const protectedPaths = ["/dashboard", "/applications"];
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

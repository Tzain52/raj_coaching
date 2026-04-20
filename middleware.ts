import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // If signed in but trying to access auth page → redirect to appropriate home
    if (pathname.startsWith("/auth/signin") && token) {
      const dest = token.role === "ADMIN" ? "/admin" : "/student";
      return NextResponse.redirect(new URL(dest, req.url));
    }

    // Admin-only routes — students get bounced to /student
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/student", req.url));
    }

    // Student-only routes — admins get bounced to /admin
    if (pathname.startsWith("/student") && token?.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // authorized = false → withAuth will redirect to /auth/signin automatically
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/student/:path*",
    "/auth/signin",
  ],
};

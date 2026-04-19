import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request
  const hostname = req.headers.get("host") || "ihut.shop";

  // Check for subdomain
  const isMainDomain = hostname === "ihut.shop" || hostname === "localhost:9002";

  if (isMainDomain) {
    // Regular routing for the main application
    return NextResponse.next();
  }

  // Handle subdomains
  const subdomain = hostname.split(".")[0];

  // Rewrite to the dynamic route
  return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}${url.search}`, req.url));
}

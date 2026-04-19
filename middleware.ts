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

  // Get hostname of request (e.g. demo.ihut.shop, localhost:9002)
  const hostname = req.headers.get("host") || "";

  // Define root domains
  const rootDomains = ["ihut.shop", "www.ihut.shop", "localhost:9002"];
  
  // Check if current host is a root domain
  const isRootDomain = rootDomains.includes(hostname);

  if (isRootDomain) {
    // If we're on the root domain, just proceed with normal routing
    // This allows ihut.shop/arman to work via the [subdomain] route
    return NextResponse.next();
  }

  // If not a root domain, extract the subdomain
  // e.g. "arman.ihut.shop" -> "arman"
  const subdomain = hostname.split(".")[0];

  // Fallback if subdomain detection fails
  if (!subdomain || subdomain === hostname) {
    return NextResponse.next();
  }

  // Rewrite to the dynamic route
  // e.g. arman.ihut.shop/products -> /arman/products
  return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}${url.search}`, req.url));
}

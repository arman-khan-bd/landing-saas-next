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
  const hostname = req.headers.get("host") || "";

  // Standardize hostname (remove port if present)
  const currentHost = hostname.replace(/:.*$/, "");

  // Root domains configuration
  const rootDomain = "ihut.shop";
  const rootDomains = [rootDomain, `www.${rootDomain}`, "localhost"];

  // 1. Check if we're on a root domain
  if (rootDomains.includes(currentHost)) {
    // Standard routing (e.g., ihut.shop/dashboard or localhost:9002/arman)
    return NextResponse.next();
  }

  // 2. Subdomain detection (e.g., arman.ihut.shop)
  let subdomain = "";
  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, "");
  } else if (currentHost.endsWith(".localhost")) {
    subdomain = currentHost.replace(".localhost", "");
  }

  // 3. Fallback for no subdomain or common "www"
  if (!subdomain || subdomain === "www") {
    return NextResponse.next();
  }

  // 4. Prevent double-rewriting if the path already starts with /[subdomain]
  if (url.pathname.startsWith(`/${subdomain}/`) || url.pathname === `/${subdomain}`) {
    return NextResponse.next();
  }

  // 5. Rewrite to the dynamic [subdomain] route
  // Browser stays at arman.ihut.shop/products, server sees /[subdomain]/products
  return NextResponse.rewrite(
    new URL(`/${subdomain}${url.pathname}${url.search}`, req.url)
  );
}

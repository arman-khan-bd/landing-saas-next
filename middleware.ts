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
  
  // Use x-forwarded-host as a fallback for production environments behind proxies
  const hostname = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  // Standardize hostname: remove port, lowercase, and trim trailing dots
  const currentHost = hostname.replace(/:.*$/, "").toLowerCase().replace(/\.$/, "");

  // Root domains configuration
  const rootDomain = "ihut.shop";
  const rootDomains = [rootDomain, `www.${rootDomain}`, "localhost", "127.0.0.1"];

  // 1. Check if we're on a defined root domain
  const isRootDomain = rootDomains.includes(currentHost);
  
  if (isRootDomain) {
    return NextResponse.next();
  }

  // 2. Subdomain detection strategy
  let subdomain = "";
  
  // Handle production: *.ihut.shop
  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, "");
  } 
  // Handle local dev: *.localhost or *.127.0.0.1
  else if (currentHost.endsWith(".localhost") || currentHost.endsWith(".127.0.0.1")) {
    const parts = currentHost.split(".");
    if (parts.length > 1) {
      subdomain = parts[0];
    }
  }
  // Generic fallback for other domains (Vercel previews, custom domains, etc.)
  else if (currentHost.split(".").length >= 2 && !currentHost.includes("vercel.app")) {
     subdomain = currentHost.split(".")[0];
  }

  // 3. Fallback for no subdomain detected or common "www"
  if (!subdomain || subdomain === "www") {
    return NextResponse.next();
  }

  // 4. Prevent double-rewriting loop and allow internal paths
  // If the internal path already starts with the subdomain segment, don't rewrite
  if (url.pathname.startsWith(`/${subdomain}/`) || url.pathname === `/${subdomain}`) {
    return NextResponse.next();
  }

  // 5. Rewrite logic
  // Visitors to arman.ihut.shop/ see content from /arman/
  // The browser URL stays arman.ihut.shop
  const rewriteUrl = new URL(`/${subdomain}${url.pathname}${url.search}`, req.url);
  
  return NextResponse.rewrite(rewriteUrl);
}
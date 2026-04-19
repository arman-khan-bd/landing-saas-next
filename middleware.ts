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

  // Root domains configuration - add your custom production domain here
  const rootDomain = "ihut.shop";
  const rootDomains = [rootDomain, `www.${rootDomain}`, "localhost"];

  // 1. Check if we're on a defined root domain
  const isRootDomain = rootDomains.includes(currentHost);
  
  if (isRootDomain) {
    // On root domain, proceed normally (allows access to /, /auth, /dashboard, /saas-admin, etc.)
    return NextResponse.next();
  }

  // 2. Subdomain detection strategy
  let subdomain = "";
  
  // Handle production: *.ihut.shop
  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, "");
  } 
  // Handle local dev: *.localhost
  else if (currentHost.endsWith(".localhost")) {
    subdomain = currentHost.replace(".localhost", "");
  }
  // Generic fallback for other domains (Vercel deployments, etc.)
  else if (currentHost.split(".").length > 2 && !currentHost.includes("vercel.app")) {
     subdomain = currentHost.split(".")[0];
  }
  // Vercel specific preview handling (optional, adjust if needed)
  else if (currentHost.endsWith(".vercel.app") && currentHost.split(".").length > 3) {
     subdomain = currentHost.split(".")[0];
  }

  // 3. Fallback for no subdomain detected or common "www"
  if (!subdomain || subdomain === "www") {
    return NextResponse.next();
  }

  // 4. Prevent double-rewriting loop
  // If the internal path already starts with the subdomain, do nothing
  if (url.pathname.startsWith(`/${subdomain}/`) || url.pathname === `/${subdomain}`) {
    return NextResponse.next();
  }

  // 5. Rewrite logic
  // Visitors to arman.ihut.shop/ see content from /arman/
  // The browser URL stays arman.ihut.shop
  const rewriteUrl = new URL(`/${subdomain}${url.pathname}${url.search}`, req.url);
  return NextResponse.rewrite(rewriteUrl);
}
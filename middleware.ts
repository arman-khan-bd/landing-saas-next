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
  
  // Clean hostname
  const currentHost = hostname.replace(/:.*$/, "").toLowerCase();

  // Define root domain
  const rootDomain = "ihut.shop";
  
  // If it's the root domain or www, or local root, just proceed
  if (
    currentHost === rootDomain || 
    currentHost === `www.${rootDomain}` || 
    currentHost === "localhost" || 
    currentHost === "127.0.0.1"
  ) {
    return NextResponse.next();
  }

  // Extract subdomain: handle *.ihut.shop and others
  let subdomain = "";
  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, "");
  } else {
    // For Vercel preview URLs or other domains, take the first part
    const parts = currentHost.split(".");
    if (parts.length >= 2 && !currentHost.includes("vercel.app")) {
      subdomain = parts[0];
    }
  }

  // If no subdomain detected or it's 'www', serve root landing page
  if (!subdomain || subdomain === "www") {
    return NextResponse.next();
  }

  // Prevent double rewriting
  if (url.pathname.startsWith(`/${subdomain}/`) || url.pathname === `/${subdomain}`) {
    return NextResponse.next();
  }

  // Rewrite to the subdomain folder
  // Visitors to arman.ihut.shop/ see content from src/app/[subdomain]/page.tsx
  const rewritePath = `/${subdomain}${url.pathname}${url.search}`;
  return NextResponse.rewrite(new URL(rewritePath, req.url));
}
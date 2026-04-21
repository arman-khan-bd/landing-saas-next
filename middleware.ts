import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Clean hostname from Next.js URL object (more reliable than host header)
  const currentHost = url.hostname.toLowerCase().replace(/\.$/, "");

  // Define root domain
  const rootDomain = "ihut.shop";
  
  // 1. If it's the root domain or www, or local root, just proceed
  if (
    currentHost === rootDomain || 
    currentHost === `www.${rootDomain}` || 
    currentHost === "localhost" || 
    currentHost === "127.0.0.1"
  ) {
    return NextResponse.next();
  }

  // 2. Extract subdomain
  let subdomain = "";
  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, "");
  } else {
    // Fallback for non-standard domains (Vercel previews, etc.)
    const parts = currentHost.split(".");
    if (parts.length >= 2 && !currentHost.includes("vercel.app")) {
      subdomain = parts[0];
    }
  }

  // 3. Fallback for no subdomain
  if (!subdomain || subdomain === "www") {
    return NextResponse.next();
  }

  // 4. Prevent double rewriting loops
  if (url.pathname.startsWith(`/${subdomain}/`) || url.pathname === `/${subdomain}`) {
    return NextResponse.next();
  }

  // 5. Perform the rewrite
  const rewritePath = `/${subdomain}${url.pathname}${url.search}`;
  const response = NextResponse.rewrite(new URL(rewritePath, req.url));
  
  // Add debug headers
  response.headers.set("x-subdomain-detected", subdomain);
  response.headers.set("x-current-host", currentHost);
  
  return response;
}
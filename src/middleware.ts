import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)"],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop");
  const currentHost = hostname.toLowerCase().split(":")[0];

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";

  // 1. Root domain handling
  const isRootDomain = 
    currentHost === rootDomain || 
    currentHost === `www.${rootDomain}` ||
    currentHost === "localhost" ||
    currentHost === "127.0.0.1";

  if (isRootDomain) {
    return NextResponse.next();
  }

  // 2. Subdomain extraction
  let subdomain = "";
  if (currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = currentHost.replace(`.${rootDomain}`, "");
  } else if (currentHost.includes(".localhost")) {
    subdomain = currentHost.replace(".localhost", "");
  } else if (!currentHost.includes(rootDomain) && !currentHost.includes("vercel.app")) {
    // Handling for custom domains (e.g., myshop.com)
    subdomain = currentHost.split(".")[0];
  }

  if (!subdomain || subdomain === "www") {
    return NextResponse.next();
  }

  // 3. Auth Redirection: If user is on a subdomain and requests /auth, send them to the root domain auth
  if (url.pathname === "/auth") {
    const authUrl = new URL("/auth", `https://${rootDomain}`);
    // Maintain query params like planId
    authUrl.search = url.search;
    return NextResponse.redirect(authUrl);
  }

  // 4. Prevent loops if the path already starts with /[subdomain]
  if (url.pathname.startsWith(`/${subdomain}`)) {
    return NextResponse.next();
  }

  // 5. Specific alias for 'overview' -> 'dashboard' within tenant routes
  let path = url.pathname;
  if (path === "/overview") path = "/dashboard";

  // 6. Rewrite to dynamic tenant folder
  const rewritePath = `/${subdomain}${path === "/" ? "" : path}${url.search}`;
  
  const response = NextResponse.rewrite(new URL(rewritePath, req.url));
  
  // Add a debug header for development
  response.headers.set("x-subdomain-tenant", subdomain);
  
  return response;
}

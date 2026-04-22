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
  if (currentHost === rootDomain || currentHost === `www.${rootDomain}`) {
    return NextResponse.next();
  }

  // 2. Localhost handling
  if (currentHost === "localhost" || currentHost === "127.0.0.1") {
    return NextResponse.next();
  }

  // 3. Subdomain extraction
  const parts = currentHost.split(".");
  let subdomain = "";

  if (parts.length >= 3 && currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = parts[0];
  } else if (parts.length >= 2 && !currentHost.includes("vercel.app") && !currentHost.includes("localhost") && !currentHost.includes(rootDomain)) {
    // Fallback for other domains (custom domains)
    subdomain = parts[0];
  } else if (currentHost.includes(".localhost")) {
    // Handle arman.localhost:3000
    subdomain = parts[0];
  }

  if (!subdomain || subdomain === "www") {
    return NextResponse.next();
  }

  // 4. Rewrite
  // Rewrites https://arman.ihut.shop/ to src/app/[subdomain]/page.tsx
  const rewritePath = `/${subdomain}${url.pathname}${url.search}`;
  return NextResponse.rewrite(new URL(rewritePath, req.url));
}
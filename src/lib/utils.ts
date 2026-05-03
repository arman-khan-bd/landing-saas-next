import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStoreUrl(subdomain: string) {
  const isProd = process.env.NODE_ENV === "production";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
  
  if (isProd) {
    return `https://${subdomain}.${rootDomain}`;
  }
  return `http://localhost:9002/${subdomain}`;
}

export function getConsoleUrl() {
  const isProd = process.env.NODE_ENV === "production";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
  
  if (isProd) {
    return `https://${rootDomain}/dashboard`;
  }
  return `http://localhost:9002/dashboard`;
}

export function getAuthUrl() {
  const isProd = process.env.NODE_ENV === "production";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "ihut.shop";
  
  if (isProd) {
    return `https://${rootDomain}/auth`;
  }
  return `http://localhost:9002/auth`;
}

/**
 * Generates a path that works both on subdomains and main domain path-based access.
 */
export function getTenantPath(subdomain: string, path: string) {
  if (typeof window !== "undefined") {
    // If we are on a subdomain (e.g., arman.ihut.shop), 
    // the middleware handles the prefix, so we use relative paths.
    if (window.location.hostname.includes(`${subdomain}.`)) {
      return path.startsWith("/") ? path : `/${path}`;
    }
  }
  // Fallback for localhost or main domain path-based access
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `/${subdomain}${cleanPath ? `/${cleanPath}` : ""}`;
}

export function getCurrencySymbol(currencyCode: string = "BDT") {
  const symbols: Record<string, string> = {
    BDT: "৳",
    USD: "$",
    EUR: "€",
    GBP: "£",
    INR: "₹"
  };
  return symbols[currencyCode] || "৳";
}

export function formatPrice(amount: number, currencyCode: string = "BDT") {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${Number(amount).toFixed(2)}`;
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function getStoreUrl(subdomain: string) {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    return `https://${subdomain}.ihut.shop`;
  }
  return `http://localhost:9002/${subdomain}`;
}

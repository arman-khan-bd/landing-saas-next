
export const getSubdomain = (hostname: string | null, rootDomain: string) => {
  if (!hostname) return null;
  
  const currentHost = hostname.toLowerCase().split(":")[0];
  
  // 1. Root domain check
  if (currentHost === rootDomain || currentHost === `www.${rootDomain}` || currentHost === "localhost" || currentHost === "127.0.0.1") {
    return null;
  }

  // 2. Extract subdomain
  const parts = currentHost.split(".");
  let subdomain = "";

  if (parts.length >= 3 && currentHost.endsWith(`.${rootDomain}`)) {
    subdomain = parts[0];
  } else if (parts.length >= 2 && !currentHost.includes("vercel.app") && !currentHost.includes(rootDomain)) {
    // Fallback for other domains (custom domains)
    subdomain = parts[0];
  }

  if (!subdomain || subdomain === "www") {
    return null;
  }

  return subdomain;
};


"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTenantPath } from "@/lib/utils";

/**
 * Redirects to the new unified Section Manager.
 */
export default function BuilderRedirect() {
  const router = useRouter();
  const { subdomain } = useParams();

  useEffect(() => {
    if (subdomain) {
      router.replace(getTenantPath(subdomain as string, "/sections"));
    }
  }, [subdomain, router]);

  return null;
}


"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTenantPath } from "@/lib/utils";

/**
 * Redirects to the new Section Manager.
 * Generic "builder" concept is replaced by high-level section orchestration.
 */
export default function LegacyBuilderRedirect() {
  const router = useRouter();
  const { subdomain } = useParams();

  useEffect(() => {
    if (subdomain) {
      router.replace(getTenantPath(subdomain as string, "/sections"));
    }
  }, [subdomain, router]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTenantPath } from "@/lib/utils";

/**
 * Legacy redirect for overview -> dashboard.
 */
export default function OverviewRedirect() {
  const router = useRouter();
  const { subdomain } = useParams();

  useEffect(() => {
    if (subdomain) {
      router.replace(getTenantPath(subdomain as string, "/dashboard"));
    }
  }, [subdomain, router]);

  return null;
}


"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SaasAdminRoot() {
  const router = useRouter();

  useEffect(() => {
    router.push("/saas-admin/overview");
  }, [router]);

  return null;
}

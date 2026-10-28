"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import * as Fathom from "fathom-client";

export default function FathomAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    Fathom.load("HXGZYJJP", {
      includedDomains: ["dragon-names.vercel.app"],
    });
  }, []);

  // Record a pageview when the route changes
  useEffect(() => {
    Fathom.trackPageview();
  }, [pathname]);

  return null;
}

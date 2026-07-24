"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BrandFooter from "@/components/BrandFooter";

/** Shared site footer. Home embeds BrandFooter inside the menu sheet to mask the fixed hero. */
export default function Footer() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  // Avoid pathname hydration mismatch (SSR vs first client paint)
  if (!ready || pathname === "/") return null;

  return <BrandFooter withMap />;
}

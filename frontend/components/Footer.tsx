"use client";

import { usePathname } from "next/navigation";
import BrandFooter from "@/components/BrandFooter";

/** Shared site footer. Home embeds BrandFooter inside the menu sheet to mask the fixed hero. */
export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <BrandFooter withMap />;
}

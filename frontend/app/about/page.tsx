import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "О нас — BEEFштекс",
  description:
    "BEEFштекс — уютный корнер с бургерами из мраморной говядины в Коломне. PRO Нас и PRO #BEEF: качество, честность и коломенский характер.",
};

export default function AboutPage() {
  return <AboutClient />;
}

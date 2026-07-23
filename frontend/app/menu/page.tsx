import type { Metadata } from "next";
import MenuPageClient from "@/components/MenuPageClient";

export const metadata: Metadata = {
  title: "Меню — BEEFштекс",
  description:
    "Меню BEEFштекс в Коломне: бургеры, закуски, напитки и комбо. Акции, промокоды и новости корнера.",
};

export default function MenuPage() {
  return <MenuPageClient />;
}

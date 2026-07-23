import { redirect } from "next/navigation";

/** Old /menu index → home (promo + catalog live in the menu sheet). */
export default function MenuIndexRedirect() {
  redirect("/");
}

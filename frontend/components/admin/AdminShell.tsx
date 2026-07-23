"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAdminToken } from "@/lib/admin-auth";

const NAV = [
  { href: "/admin", label: "Дашборд", exact: true },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/menu", label: "Меню" },
  { href: "/admin/promos", label: "Промокоды" },
  { href: "/admin/reviews", label: "Отзывы" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    clearAdminToken();
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-terracotta">Beefshteks</span>
            <span className="rounded-full bg-terracotta/10 px-2.5 py-0.5 text-xs font-semibold text-terracotta">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted hover:text-terracotta">
              На сайт
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-muted hover:border-terracotta/30 hover:text-terracotta"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="lg:w-56 lg:shrink-0">
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-terracotta text-white"
                      : "bg-white text-ink hover:bg-terracotta/10 hover:text-terracotta"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

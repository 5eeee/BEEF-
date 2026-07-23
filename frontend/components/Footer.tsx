"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchCompanyInfo } from "@/lib/api";
import type { CompanyInfo } from "@/lib/types";

const FALLBACK: CompanyInfo = {
  name: "Beefshteks",
  tagline: "Сочные бургеры с доставкой за 45 минут",
  phone: "+7 (495) 123-45-67",
  email: "hello@beefshteks.ru",
  address: "г Москва, ул Поварская, д 10",
  working_hours: "Ежедневно с 10:00 до 23:00",
  inn: "7701234567",
  ogrn: "1027700132195",
};

export default function Footer() {
  const pathname = usePathname();
  const [info, setInfo] = useState<CompanyInfo>(FALLBACK);

  useEffect(() => {
    fetchCompanyInfo()
      .then(setInfo)
      .catch(() => setInfo(FALLBACK));
  }, []);

  // Home uses its own opaque branded footer inside the menu sheet
  if (pathname === "/") return null;

  const phoneHref = info.phone?.replace(/[^\d+]/g, "") || "+74951234567";

  return (
    <footer className="site-footer mt-12 border-t border-stone-100 bg-cream/50">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xl font-bold text-terracotta">{info.name}</p>
          {info.tagline && <p className="mt-2 text-sm text-muted">{info.tagline}</p>}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Контакты</p>
          <ul className="space-y-1 text-sm text-muted">
            {info.phone && (
              <li>
                <a href={`tel:${phoneHref}`} className="hover:text-terracotta">
                  {info.phone}
                </a>
              </li>
            )}
            {info.email && (
              <li>
                <a href={`mailto:${info.email}`} className="hover:text-terracotta">
                  {info.email}
                </a>
              </li>
            )}
            {info.address && <li>{info.address}</li>}
            {info.working_hours && <li>{info.working_hours}</li>}
          </ul>
        </div>

        {(info.inn || info.ogrn) && (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Реквизиты</p>
            <ul className="space-y-1 text-sm text-muted">
              {info.inn && <li>ИНН {info.inn}</li>}
              {info.ogrn && <li>ОГРН {info.ogrn}</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="border-t border-stone-100 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {info.name}. Все права защищены.
      </div>
    </footer>
  );
}

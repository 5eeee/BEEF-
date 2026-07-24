"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import { useUiPrefs } from "@/components/UiPrefs";
import about from "@/content/about.json";

const SOCIAL_ICONS: Record<string, string> = {
  Telegram: "/images/social/telegram.svg",
  VK: "/images/social/vk.svg",
  Instagram: "/images/social/instagram.svg",
};

export default function ContactsClient() {
  const { t } = useUiPrefs();
  const [cartOpen, setCartOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const tel = "+79160356777";

  useEffect(() => {
    setReady(true);
  }, []);

  // Stable SSR strings — swap to t() only after mount (avoids locale hydration mismatch)
  const visitUs = ready ? t("visitUs") : "Ждём в гостях";
  const everyDay = ready ? t("everyDay") : "каждый день, без выходных";
  const contactAndAddress = ready ? t("contactAndAddress") : "Связь и адрес";
  const pickup = ready ? t("pickup") : "Самовывоз";
  const callUs = ready ? t("callUs") : "Позвонить";
  const goToMenu = ready ? t("goToMenu") : "Перейти в меню";

  return (
    <div className="about-page contacts-page">
      <Header theme="dark" transparent={false} variant="hero" onCartClick={() => setCartOpen(true)} />

      <main>
        <section className="contacts-hero">
          <div className="container-page contacts-hero__inner">
            <h1 className="contacts-hero__title">{visitUs}</h1>
            <p className="contacts-hero__lead">
              {about.contacts.hours} — {everyDay}
            </p>
          </div>
        </section>

        <section className="contacts-body" aria-labelledby="contacts-main">
          <div className="container-page contacts-body__inner">
            <h2 id="contacts-main" className="contacts-body__title">
              {contactAndAddress}
            </h2>

            <a className="contacts-body__phone" href={`tel:${tel}`}>
              {about.contacts.phone}
            </a>
            <p className="contacts-body__addr">{about.contacts.address}</p>
            <p className="contacts-body__meta">
              {pickup}: {about.delivery.pickup}
            </p>
            <p className="contacts-body__rule">{about.delivery.rule}</p>

            <div className="about-social about-social--icons contacts-body__social">
              {about.contacts.social.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="about-social__chip">
                  {SOCIAL_ICONS[s.label] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={SOCIAL_ICONS[s.label]} alt="" width={28} height={28} />
                  ) : null}
                  <span>{s.label}</span>
                </a>
              ))}
            </div>

            <div className="contacts-body__actions">
              <a href={`tel:${tel}`} className="about-btn about-btn--accent">
                {callUs}
              </a>
              <Link href="/#menu" className="about-btn">
                {goToMenu}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

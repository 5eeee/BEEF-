"use client";

import Link from "next/link";
import { useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import about from "@/content/about.json";

const SOCIAL_ICONS: Record<string, string> = {
  Telegram: "/images/social/telegram.svg",
  VK: "/images/social/vk.svg",
  Instagram: "/images/social/instagram.svg",
};

export default function ContactsClient() {
  const [cartOpen, setCartOpen] = useState(false);
  const tel = "+79160356777";

  return (
    <div className="about-page">
      <Header theme="dark" transparent={false} variant="hero" onCartClick={() => setCartOpen(true)} />

      <main>
        <section className="about-hero">
          <p className="about-hero__eyebrow">Контакты</p>
          <h1 className="about-hero__brand">Залетай к нам</h1>
          <p className="about-hero__lead">{about.contacts.hours} — каждый день, без выходных</p>
        </section>

        <section className="about-section about-section--contacts" aria-labelledby="contacts-main">
          <h2 id="contacts-main" className="about-section__title">
            Связь и адрес
          </h2>
          <a className="about-contacts__phone" href={`tel:${tel}`}>
            {about.contacts.phone}
          </a>
          <p className="about-contacts__addr">{about.contacts.address}</p>
          <p className="about-contacts__hours" style={{ marginTop: "0.75rem" }}>
            Самовывоз: {about.delivery.pickup}
          </p>
          <p className="about-section__lead" style={{ marginTop: "1.25rem" }}>
            {about.delivery.rule}
          </p>

          <div className="about-social about-social--icons">
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

          <div className="about-hero__actions" style={{ marginTop: "1.75rem" }}>
            <a href={`tel:${tel}`} className="about-btn">
              Позвонить
            </a>
            <Link href="/#menu" className="about-btn about-btn--accent">
              К меню
            </Link>
          </div>
        </section>
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

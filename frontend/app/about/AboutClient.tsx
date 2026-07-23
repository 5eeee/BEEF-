"use client";

import Link from "next/link";
import { useState } from "react";
import CartDrawer from "@/components/CartDrawer";
import Header from "@/components/Header";
import about from "@/content/about.json";

export default function AboutClient() {
  const [cartOpen, setCartOpen] = useState(false);
  const tel = "+79160356777";

  return (
    <div className="about-page">
      <Header theme="dark" transparent={false} variant="hero" onCartClick={() => setCartOpen(true)} />

      <main>
        <section className="about-hero">
          <p className="about-hero__eyebrow">PRO Нас</p>
          <h1 className="about-hero__brand">{about.brand}</h1>
          <p className="about-hero__slogan">{about.slogan}</p>
          <p className="about-hero__belief">{about.belief}</p>
          <p className="about-hero__lead">{about.ogDescription}</p>
          <div className="about-hero__actions">
            <Link href="/#menu" className="about-btn about-btn--accent">
              К меню
            </Link>
            <a href="#pro-beef" className="about-btn about-btn--ghost">
              PRO #BEEF
            </a>
          </div>
        </section>

        <section className="about-section" id="pro-nas" aria-labelledby="pro-nas-title">
          <p className="about-section__eyebrow">{about.proNas.title}</p>
          <h2 id="pro-nas-title" className="about-section__title">
            Кто мы
          </h2>
          <p className="about-section__lead">{about.proNas.lead}</p>
          <div className="about-prose">
            {about.proNas.paragraphs.map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
          </div>

          {"gallery" in about && Array.isArray(about.gallery) && about.gallery.length > 0 ? (
            <div className="about-gallery" aria-label="Фото BEEFштекс">
              {about.gallery.map((shot) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={shot.src} src={shot.src} alt={shot.alt} className="about-gallery__img" loading="lazy" />
              ))}
            </div>
          ) : null}
        </section>

        <section className="about-section about-section--meat" id="pro-beef" aria-labelledby="pro-beef-title">
          <p className="about-section__eyebrow">{about.proBeef.title}</p>
          <h2 id="pro-beef-title" className="about-section__title">
            Про мясо
          </h2>
          <p className="about-section__lead">{about.proBeef.lead}</p>

          <div className="about-meat-q">
            <h3>{about.proBeef.question}</h3>
            <p>{about.proBeef.answer}</p>
            <p>{about.proBeef.marble}</p>
          </div>

          <div className="about-points">
            {about.proBeef.points.map((pt) => (
              <article key={pt.title} className="about-point">
                <h3>{pt.title}</h3>
                <p>{pt.text}</p>
              </article>
            ))}
          </div>

          <div className="about-prose">
            <p>{about.proBeef.breeds}</p>
            <p>{about.proBeef.doneness}</p>
          </div>
        </section>

        <section className="about-section" id="delivery" aria-labelledby="delivery-title">
          <p className="about-section__eyebrow">Самовывоз / Доставка</p>
          <h2 id="delivery-title" className="about-section__title">
            Как получить заказ
          </h2>
          <p className="about-section__lead">{about.delivery.rule}</p>
          <div className="about-prose">
            <p>{about.delivery.note}</p>
          </div>
          <ul className="about-zones">
            {about.delivery.zones.map((z) => (
              <li key={z.name}>
                <span>{z.name}</span>
                <span>{z.price}</span>
              </li>
            ))}
          </ul>
          <div className="about-prose">
            <p>
              <strong>Самовывоз:</strong> {about.delivery.pickup}
            </p>
          </div>
        </section>

        <section className="about-section about-section--contacts" id="contacts" aria-labelledby="contacts-title">
          <p className="about-section__eyebrow">Контакты</p>
          <h2 id="contacts-title" className="about-section__title">
            Залетай к нам
          </h2>
          <p className="about-contacts__hours">{about.contacts.hours} — каждый день, без выходных</p>
          <a className="about-contacts__phone" href={`tel:${tel}`}>
            {about.contacts.phone}
          </a>
          <p className="about-contacts__addr">{about.contacts.address}</p>
          <div className="about-social about-social--icons">
            {about.contacts.social.map((s) => {
              const icon =
                s.label === "Telegram"
                  ? "/images/social/telegram.svg"
                  : s.label === "VK"
                    ? "/images/social/vk.svg"
                    : s.label === "Instagram"
                      ? "/images/social/instagram.svg"
                      : null;
              return (
                <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="about-social__chip">
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt="" width={28} height={28} />
                  ) : null}
                  <span>{s.label}</span>
                </a>
              );
            })}
          </div>
          <div className="about-hero__actions" style={{ marginTop: "1.5rem" }}>
            <a href={`tel:${tel}`} className="about-btn">
              Позвонить
            </a>
            <Link href="/#menu" className="about-btn about-btn--accent">
              Заказать
            </Link>
          </div>
        </section>
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

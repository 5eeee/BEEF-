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
        <section className="about-hero" aria-labelledby="about-title">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="about-hero__photo"
            src="/images/about/photo-2.jpg"
            alt="Бургер BEEFштекс, который готовят на кухне"
          />
          <div className="about-hero__shade" />
          <div className="container-page about-hero__content">
            <p className="about-hero__eyebrow">Коломна · с 2023</p>
            <h1 id="about-title" className="about-hero__brand">
              {about.brand}
            </h1>
            <p className="about-hero__slogan">{about.slogan}</p>
            <p className="about-hero__belief">{about.belief}</p>
            <p className="about-hero__lead">{about.ogDescription}</p>
            <div className="about-hero__actions">
              <Link href="/#menu" className="about-btn about-btn--accent">
                Выбрать бургер
              </Link>
              <a href="#pro-beef" className="about-btn about-btn--ghost">
                Узнать про мясо
              </a>
            </div>
          </div>
        </section>

        <section className="about-story" id="pro-nas" aria-labelledby="pro-nas-title">
          <div className="container-page about-story__grid">
            <div className="about-story__intro">
              <p className="about-section__eyebrow">{about.proNas.title}</p>
              <h2 id="pro-nas-title" className="about-section__title">
                Бургерная, в которую заходят как к своим
              </h2>
              <p className="about-section__lead">{about.proNas.lead}</p>
            </div>
            <div className="about-story__copy">
              {about.proNas.paragraphs.slice(0, 2).map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
          </div>

          {"gallery" in about && Array.isArray(about.gallery) && about.gallery.length > 0 ? (
            <div className="container-page about-gallery" aria-label="Команда и кухня BEEFштекс">
              {about.gallery.map((shot, index) => (
                <figure key={shot.src} className={`about-gallery__item about-gallery__item--${index + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={shot.src} alt={shot.alt} className="about-gallery__img" loading="lazy" />
                </figure>
              ))}
            </div>
          ) : null}
          <div className="container-page about-story__closing">
            <p>{about.proNas.paragraphs[2]}</p>
          </div>
        </section>

        <section className="about-beef" id="pro-beef" aria-labelledby="pro-beef-title">
          <div className="container-page">
            <div className="about-beef__feature">
              <div className="about-beef__visual">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/products/raw/beef-chizburger-778941.jpg" alt="Ингредиенты бургера с говядиной" loading="lazy" />
              </div>
              <div className="about-beef__card">
                <p className="about-section__eyebrow">{about.proBeef.title}</p>
                <h2 id="pro-beef-title" className="about-section__title">
                  Вкус начинается с честного выбора
                </h2>
                <p>{about.proBeef.lead}</p>
              </div>
            </div>

            <div className="about-beef__detail">
              <div className="about-beef__question">
                <p className="about-section__eyebrow">Основа каждого бургера</p>
                <h3>{about.proBeef.question}</h3>
              </div>
              <div className="about-beef__answer">
                <p>{about.proBeef.answer}</p>
                <p>{about.proBeef.marble}</p>
              </div>
            </div>

            <div className="about-points">
              {about.proBeef.points.map((pt, index) => (
                <article key={pt.title} className="about-point">
                  <span className="about-point__number">0{index + 1}</span>
                  <h3>{pt.title}</h3>
                  <p>{pt.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="about-beef__banner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/about/photo-1.jpg" alt="Команда BEEFштекс за работой" loading="lazy" />
            <div className="about-beef__banner-shade" />
            <div className="container-page about-beef__banner-content">
              <p>От мраморной говядины — до горячего гриля</p>
              <span>Без случайных ингредиентов</span>
            </div>
          </div>

          <div className="container-page about-beef__notes">
            <div>
              <p className="about-section__eyebrow">Происхождение и вкус</p>
              <p>{about.proBeef.breeds}</p>
            </div>
            <div className="about-beef__menu-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/hero/hero-king-kong.png" alt="Фирменный бургер BEEFштекс" loading="lazy" />
            </div>
            <div>
              <p className="about-section__eyebrow">Как готовим</p>
              <p>{about.proBeef.doneness}</p>
            </div>
          </div>
        </section>

        <section className="about-visit" id="delivery" aria-labelledby="delivery-title">
          <div className="container-page about-visit__grid">
            <div>
              <p className="about-section__eyebrow">Самовывоз / Доставка</p>
              <h2 id="delivery-title" className="about-section__title">
                Горячими — к вам или для вас
              </h2>
              <p className="about-section__lead">{about.delivery.rule}</p>
              <p className="about-visit__text">{about.delivery.note}</p>
            </div>
            <div className="about-visit__panel">
              <ul className="about-zones">
                {about.delivery.zones.map((z) => (
                  <li key={z.name}>
                    <span>{z.name}</span>
                    <span>{z.price}</span>
                  </li>
                ))}
              </ul>
              <p>
                <strong>Самовывоз:</strong> {about.delivery.pickup}
              </p>
            </div>
          </div>
        </section>

        <section className="about-contact" id="contacts" aria-labelledby="contacts-title">
          <div className="container-page about-contact__inner">
            <p className="about-section__eyebrow">Контакты</p>
            <h2 id="contacts-title" className="about-section__title">
              Залетай к нам
            </h2>
            <p className="about-contacts__hours">{about.contacts.hours} · каждый день</p>
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
            <div className="about-hero__actions">
              <a href={`tel:${tel}`} className="about-btn">
                Позвонить
              </a>
              <Link href="/#menu" className="about-btn about-btn--accent">
                Заказать
              </Link>
            </div>
          </div>
        </section>
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

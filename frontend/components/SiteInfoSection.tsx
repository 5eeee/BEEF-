"use client";

import Link from "next/link";

const DELIVERY_ZONES = [
  { name: "Центр (до Старого города)", price: "300 ₽" },
  { name: "Старый город", price: "300 ₽" },
  { name: "Колычево", price: "300 ₽" },
  { name: "Щурово", price: "300 ₽" },
];

/** Compact home footer: delivery + contacts; full story lives on /about */
export default function SiteInfoSection() {
  return (
    <section className="site-info" aria-label="Доставка и контакты">
      <div className="site-info__grid site-info__grid--two">
        <div className="site-info__block" id="delivery">
          <p className="site-info__eyebrow">Самовывоз / Доставка</p>
          <h2 className="site-info__title">Как получить заказ</h2>
          <p className="site-info__text">
            <strong>Курьером:</strong> до 2000 ₽ — 300 ₽, от 2000 ₽ — бесплатно.
          </p>
          <ul className="site-info__zones">
            {DELIVERY_ZONES.map((z) => (
              <li key={z.name}>
                <span>{z.name}</span>
                <span>{z.price}</span>
              </li>
            ))}
          </ul>
          <p className="site-info__text">
            <strong>Самовывоз:</strong> ул. Октябрьской Революции, 362, ТРЦ «Рио», 3 этаж, фудкорт.
          </p>
        </div>

        <div className="site-info__block" id="contacts">
          <p className="site-info__eyebrow">Контакты</p>
          <h2 className="site-info__title">BEEFштекс</h2>
          <p className="site-info__text">
            <a href="tel:+79160356777" className="site-info__phone">
              +7 (916) 035-67-77
            </a>
          </p>
          <p className="site-info__text">
            Коломна, ул. Октябрьской Революции, 362
            <br />
            ТРЦ Рио, фудкорт · ежедневно 10:00 — 22:00
          </p>
          <div className="site-info__actions">
            <Link href="/about" className="site-info__btn site-info__btn--accent">
              О нас
            </Link>
            <a href="tel:+79160356777" className="site-info__btn">
              Позвонить
            </a>
            <Link href="#menu" className="site-info__btn site-info__btn--ghost">
              К меню
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

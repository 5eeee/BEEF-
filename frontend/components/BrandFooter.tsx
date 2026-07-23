"use client";

import Link from "next/link";

type Props = {
  /** When true, map is the last element (home). When false, keep compact footer for other pages. */
  withMap?: boolean;
  className?: string;
};

export default function BrandFooter({ withMap = true, className = "" }: Props) {
  return (
    <footer className={`home-brand-footer ${className}`.trim()} aria-label="Подвал">
      <div className="home-brand-footer__inner">
        <div className="home-brand-footer__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/brand/logo-mark.png" alt="" className="home-brand-footer__logo" />
          <div>
            <p className="home-brand-footer__name">
              BEEF<span>штекс</span>
            </p>
            <p className="home-brand-footer__tag">Бургеры с характером · Коломна</p>
          </div>
        </div>
        <nav className="home-brand-footer__nav" aria-label="Подвал">
          <Link href="/">Главная</Link>
          <Link href="/#menu">Меню</Link>
          <Link href="/about">О нас</Link>
          <Link href="/contacts">Контакты</Link>
          <Link href="/blog">Блог</Link>
          <a href="tel:+79160356777">+7 (916) 035-67-77</a>
        </nav>
        <p className="home-brand-footer__addr">
          Коломна, ул. Октябрьской Революции, 362 · ТРЦ Рио, фудкорт
        </p>
        <div className="home-brand-footer__meta">
          <a
            className="home-brand-footer__map-link"
            href="https://yandex.ru/maps/org/beefshteks/24908451928/?ll=38.800483%2C55.084059&z=17"
            target="_blank"
            rel="noreferrer"
          >
            Открыть BEEFштекс в Яндекс Картах
          </a>
          <p className="home-brand-footer__copy">© {new Date().getFullYear()} BEEFштекс</p>
        </div>
      </div>

      {withMap ? (
        <div className="home-brand-footer__map-wrap">
          <iframe
            className="home-brand-footer__map"
            title="BEEFштекс — ТРЦ Рио, Коломна"
            src="https://yandex.ru/map-widget/v1/?ll=38.800483%2C55.084059&z=17&ol=biz&oid=24908451928"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      ) : null}
    </footer>
  );
}

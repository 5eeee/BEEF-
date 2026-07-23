# Демо для заказчика (Vercel)

Постоянная ссылка на витрину **без включённого ноутбука**. Меню и корзина работают из fallback-каталога; полный заказ/оплата/админка — заглушки до деплоя backend.

## Один раз: задеплоить на Vercel

1. Открой [vercel.com](https://vercel.com) → **Log in with GitHub** (аккаунт, где есть репо `5eeee/BEEF-`).
2. **Add New… → Project** → Import **`BEEF-`**.
3. **Root Directory**: нажми *Edit* → выбери **`frontend`** → Continue.
4. Оставь Framework Preset = Next.js. Env уже в `frontend/vercel.json` (`NEXT_PUBLIC_DEMO=1`).
5. **Deploy**.

Через 1–2 минуты получишь URL вида `https://beef-xxxx.vercel.app` — его и отправляй заказчику.

Повторные пуши в `main` (папка `frontend/`) сами обновляют демо, если включён Production Branch.

## Что работает в демо

- Главная, каталог, карточки товаров, поиск, «О нас» и статика
- Корзина в `localStorage` (добавление / изменение количества)
- Checkout показывает демо-заказ с суммой из корзины (без реальной оплаты)

## Чего нет без backend

- Реальные заказы, оплата, админка, SMS/аккаунт
- Когда понадобится боевой сайт — VPS/Railway + `docker compose` + домен (отдельный шаг)

## Локально в режиме демо

```bash
cd frontend
set DEMO_MODE=1
set NEXT_PUBLIC_DEMO=1
npm run build && npm start
```

(На PowerShell: `$env:DEMO_MODE="1"; $env:NEXT_PUBLIC_DEMO="1"`.)

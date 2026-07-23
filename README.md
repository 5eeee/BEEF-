# BEEFштекс

[![CI](https://github.com/5eeee/BEEF-/actions/workflows/ci.yml/badge.svg)](https://github.com/5eeee/BEEF-/actions/workflows/ci.yml)

Сайт доставки бургеров (FastAPI микросервисы + Next.js).  
**GitHub Pages этот проект не хостит** — нужен Docker локально или свой сервер. CI на GitHub проверяет сборку и тесты.

**Демо для заказчика (только фронт, без ноутбука):** см. [DEMO.md](DEMO.md) — Import репо на Vercel, Root Directory = `frontend`.

## Быстрый старт (локально)

```bash
git clone https://github.com/5eeee/BEEF-.git
cd BEEF-
cp .env.example .env
docker compose up -d --build
```

Подожди ~1–2 минуты, пока сервисы станут healthy:

```bash
docker compose ps
```

Открой:

| Что | URL |
|-----|-----|
| Сайт | http://localhost:3000 |
| API Gateway | http://localhost:8000 |
| RabbitMQ UI | http://localhost:15672 |

### Только фронт (API уже поднят)

```bash
cd frontend
npm ci
npx next dev -H 0.0.0.0 -p 3000
```

API должен быть на `http://localhost:8000` (проксируется через Next).

## Проверка API

```bash
curl http://localhost:8000/api/v1/categories
curl "http://localhost:8000/api/v1/products?limit=5"
```

## CI на GitHub

При каждом push в `main` запускается:

1. Ruff (Python lint)
2. `npm run build` (Next.js)
3. Pytest для order / payment / delivery / content

Статус: https://github.com/5eeee/BEEF-/actions

## Структура

```
frontend/          Next.js PWA
services/          микросервисы (catalog, order, identity, …)
infra/             nginx gateway, postgres init
docker-compose.yml полный локальный стек
```

## Важно

- Файл `.env` не коммитится — копируй из `.env.example`
- Для продакшена нужен свой хостинг (VPS + Docker / Vercel для фронта + API отдельно)
- Не используй GitHub Pages для этого репозитория — там нет Node/API

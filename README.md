# Beefshteks — Food Delivery Platform (Microservices)



Сайт доставки готовой еды на микросервисной архитектуре. Mobile-first PWA, SEO, интеграции с платежами, CRM и службами доставки.



## Быстрый старт



```bash

# Клонировать и поднять всю инфраструктуру локально

cp .env.example .env

docker compose up -d --build



# Дождаться запуска (catalog seed + миграции ~30 сек)

docker compose ps



# Открыть сайт

# Frontend PWA:  http://localhost:3000

# API Gateway:   http://localhost:8000

# Traefik UI:    http://localhost:8080

```



### Проверка API



```bash

# Категории и меню

curl http://localhost:8000/api/v1/categories

curl http://localhost:8000/api/v1/products

curl "http://localhost:8000/api/v1/search?q=бургер&autocomplete=true"



# Корзина и заказ

curl http://localhost:8000/api/v1/cart -H "X-Session-Id: test-session-12345678"

curl -X POST http://localhost:8000/api/v1/cart/items \

  -H "Content-Type: application/json" \

  -H "X-Session-Id: test-session-12345678" \

  -d '{"product_id":"00000000-0000-0000-0000-000000000001","quantity":2}'

```



## Frontend (Next.js 14 PWA)



### Через Docker (рекомендуется)



```bash

docker compose up -d --build frontend

# → http://localhost:3000

```



### Локальная разработка (без Docker)



```bash

# 1. Поднять backend

docker compose up -d postgres redis rabbitmq meilisearch traefik catalog-service order-service promotion-service delivery-service



# 2. Запустить frontend

cd frontend

npm install

set NEXT_PUBLIC_API_URL=http://localhost:8000   # Windows CMD

# export NEXT_PUBLIC_API_URL=http://localhost:8000  # Linux/macOS

npm run dev

# → http://localhost:3000

```



### Сборка production



```bash

cd frontend

npm install

npm run build

npm start

```



**Переменные окружения:**



| Переменная | По умолчанию | Описание |

|------------|--------------|----------|

| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL API Gateway (для SSR / fallback) |
| `API_PROXY_URL` | `http://localhost:8000` | Backend для Next.js rewrites (`/api/*` → gateway) |



## Архитектура



```

                    ┌─────────────┐

                    │   CDN /     │

                    │   Nginx     │

                    └──────┬──────┘

                           │

              ┌────────────┴────────────┐

              │      Frontend (PWA)     │

              │      Next.js 14         │

              └────────────┬────────────┘

                           │ HTTPS

              ┌────────────▼────────────┐

              │     API Gateway         │

              │  (Traefik :8000)        │

              └────────────┬────────────┘

         sync REST/gRPC    │    async events (RabbitMQ)

    ┌──────────┬───────────┼───────────┬──────────┐

    ▼          ▼           ▼           ▼          ▼

 Catalog   Order      Identity    Payment   Notification

 Service   Service    Service     Service   Service

    │          │           │           │          │

    ▼          ▼           ▼           ▼          ▼

 Postgres  Postgres    Postgres    Postgres   Postgres

 Meili     Redis       Redis       —          Redis

```



## Сервисы



| Сервис | Порт | БД | Назначение |

|--------|------|-----|------------|

| api-gateway | 8000 | — | Маршрутизация через Traefik |

| catalog-service | 8001 | PostgreSQL + Meilisearch | Меню, поиск, фильтры |

| identity-service | 8002 | PostgreSQL + Redis | SMS-авторизация, адреса |

| order-service | 8003 | PostgreSQL + Redis | Корзина, checkout, заказы |

| payment-service | 8004 | PostgreSQL | Платёжный шлюз |

| notification-service | 8005 | PostgreSQL + Redis | SMS, push (PWA) |

| delivery-service | 8006 | PostgreSQL + Redis | DaData, расчёт доставки |

| content-service | 8007 | PostgreSQL | Отзывы, блог, SEO-страницы |

| promotion-service | 8008 | PostgreSQL | Промокоды, акции |

| integration-service | 8009 | PostgreSQL | CRM (МойСклад / 1С) |

| media-service | 8010 | MinIO (S3) | Изображения, WebP |

| **frontend** | **3000** | — | **Next.js 14 PWA** |



## Команды разработки



```bash

# Запуск одного сервиса локально (без Docker)

cd services/order-service

python -m venv .venv && .venv\Scripts\activate  # Windows

pip install -r requirements.txt

uvicorn app.main:app --reload --port 8003



# Миграции catalog-service

cd services/catalog-service && alembic upgrade head

python -m app.seed



# Тесты

pytest services/order-service/tests -v



# Линтинг

ruff check services/

```



## Промокоды (dev)



| Код | Скидка |

|-----|--------|

| `WELCOME10` | 10% от суммы |

| `BEEF200` | 200 ₽ (от 1500 ₽) |



## Документация



- [Архитектурное решение (ADR)](docs/ARCHITECTURE.md)


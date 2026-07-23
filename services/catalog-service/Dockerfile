FROM python:3.12-slim AS base

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY services/catalog-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/catalog-service/app ./app
COPY services/catalog-service/alembic ./alembic
COPY services/catalog-service/alembic.ini .
COPY services/catalog-service/entrypoint.sh .
RUN sed -i "s/\r$//" entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]

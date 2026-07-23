FROM python:3.12-slim AS base

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY services/identity-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/identity-service/app ./app
COPY services/identity-service/alembic ./alembic
COPY services/identity-service/alembic.ini .
COPY services/identity-service/entrypoint.sh .
RUN sed -i "s/\r$//" entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8002
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]

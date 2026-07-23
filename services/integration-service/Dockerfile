FROM python:3.12-slim AS base

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY services/integration-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/integration-service/app ./app
COPY services/integration-service/alembic ./alembic
COPY services/integration-service/alembic.ini .
COPY services/integration-service/entrypoint.sh .
RUN sed -i "s/\r$//" entrypoint.sh && chmod +x entrypoint.sh

EXPOSE 8009
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8009/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]

FROM python:3.12-slim
WORKDIR /app
COPY services/promotion-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/promotion-service/app ./app
EXPOSE 8008
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8008"]

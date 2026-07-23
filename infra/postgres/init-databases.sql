-- Создание отдельных БД для каждого микросервиса (Database per Service)
CREATE DATABASE catalog_db;
CREATE DATABASE identity_db;
CREATE DATABASE order_db;
CREATE DATABASE payment_db;
CREATE DATABASE notification_db;
CREATE DATABASE delivery_db;
CREATE DATABASE content_db;
CREATE DATABASE promotion_db;
CREATE DATABASE integration_db;
CREATE DATABASE media_db;

GRANT ALL PRIVILEGES ON DATABASE catalog_db TO beefshteks;
GRANT ALL PRIVILEGES ON DATABASE identity_db TO beefshteks;
GRANT ALL PRIVILEGES ON DATABASE order_db TO beefshteks;
GRANT ALL PRIVILEGES ON DATABASE payment_db TO beefshteks;
GRANT ALL PRIVILEGES ON DATABASE notification_db TO beefshteks;
GRANT ALL PRIVILEGES ON DATABASE delivery_db TO beefshteks;
GRANT ALL PRIVILEGES ON DATABASE content_db TO beefshteks;
GRANT ALL PRIVILEGES ON DATABASE promotion_db TO beefshteks;
GRANT ALL PRIVILEGES ON DATABASE integration_db TO beefshteks;
GRANT ALL PRIVILEGES ON DATABASE media_db TO beefshteks;

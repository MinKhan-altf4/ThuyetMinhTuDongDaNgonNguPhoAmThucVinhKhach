FROM dunglas/frankenphp

RUN install-php-extensions \
    pdo \
    pdo_mysql

WORKDIR /app/public

COPY . .
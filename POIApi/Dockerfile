FROM php:8.2-cli

RUN docker-php-ext-install mysqli pdo pdo_mysql

COPY . /app/

WORKDIR /app

EXPOSE 8080

CMD ["sh", "-c", "php -S 0.0.0.0:$PORT -t /app"]
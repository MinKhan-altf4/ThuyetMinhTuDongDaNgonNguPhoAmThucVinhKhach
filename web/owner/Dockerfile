FROM dunglas/frankenphp

RUN install-php-extensions \
    pdo \
    pdo_mysql

COPY . /app/public

CMD ["sh", "-c", "SERVER_NAME=:$PORT frankenphp run"]
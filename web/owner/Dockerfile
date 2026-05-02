FROM php:8.2-fpm-alpine

RUN docker-php-ext-install pdo pdo_mysql

RUN apk add --no-cache nginx gettext

COPY . /var/www/html/
COPY nginx.conf /etc/nginx/http.d/default.conf.template

CMD ["sh", "-c", "sed s/__PORT__/$PORT/ /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf && php-fpm -D && nginx -g 'daemon off;'"]
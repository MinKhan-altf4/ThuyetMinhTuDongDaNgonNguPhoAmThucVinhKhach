FROM php:8.2-apache

RUN a2dismod mpm_event mpm_worker && \
    a2enmod mpm_prefork && \
    docker-php-ext-install mysqli pdo pdo_mysql

COPY . /var/www/html/

EXPOSE 80

CMD ["apache2-foreground"]
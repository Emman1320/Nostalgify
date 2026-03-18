#!/bin/sh
set -eu

if [ -z "${APP_DOMAIN:-}" ] || [ -z "${LETSENCRYPT_EMAIL:-}" ]; then
    echo "APP_DOMAIN and LETSENCRYPT_EMAIL must be set."
    exit 1
fi

COMPOSE_FILE=docker-compose.prod.yml

docker compose -f "$COMPOSE_FILE" up -d valkey backend nginx
sleep 5

docker compose --profile certbot -f "$COMPOSE_FILE" run --rm certbot \
    certonly \
    --webroot \
    -w /var/www/certbot \
    -d "$APP_DOMAIN" \
    --email "$LETSENCRYPT_EMAIL" \
    --agree-tos \
    --no-eff-email

docker compose -f "$COMPOSE_FILE" up -d nginx

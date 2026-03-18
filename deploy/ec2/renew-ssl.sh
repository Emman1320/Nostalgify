#!/bin/sh
set -eu

COMPOSE_FILE=docker-compose.prod.yml

docker compose --profile certbot -f "$COMPOSE_FILE" run --rm certbot \
    renew \
    --webroot \
    -w /var/www/certbot

docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload

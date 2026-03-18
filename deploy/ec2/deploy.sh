#!/bin/sh
set -eu

COMPOSE_FILE=docker-compose.prod.yml

docker compose -f "$COMPOSE_FILE" pull

if [ -n "${APP_DOMAIN:-}" ]; then
    if ! docker compose --profile certbot -f "$COMPOSE_FILE" run --rm --entrypoint sh certbot -c "test -f /etc/letsencrypt/live/${APP_DOMAIN}/fullchain.pem"; then
        ./deploy/ec2/bootstrap-ssl.sh
    fi
fi

docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
docker image prune -f

#!/bin/sh
set -eu

APP_DOMAIN=${APP_DOMAIN:-_}
TEMPLATE=/etc/nginx/templates/site-http.conf.template

if [ "$APP_DOMAIN" != "_" ] && [ -f "/etc/letsencrypt/live/$APP_DOMAIN/fullchain.pem" ]; then
    TEMPLATE=/etc/nginx/templates/site-https.conf.template
fi

export APP_DOMAIN
envsubst '${APP_DOMAIN}' < "$TEMPLATE" > /etc/nginx/conf.d/default.conf

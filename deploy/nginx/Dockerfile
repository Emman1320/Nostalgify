FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./

ARG REACT_APP_BACKEND_URL=/api
ARG REACT_APP_WEB_SOCKET_URL=
ARG REACT_APP_WEB_SOCKET_PATH=/socket.io

ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_WEB_SOCKET_URL=$REACT_APP_WEB_SOCKET_URL
ENV REACT_APP_WEB_SOCKET_PATH=$REACT_APP_WEB_SOCKET_PATH

RUN npm run build

FROM nginx:1.27-alpine

RUN rm /etc/nginx/conf.d/default.conf

# Use a custom dir so the image's 20-envsubst-on-templates.sh doesn't render both
# templates (which would load HTTPS config and fail when certs don't exist).
COPY deploy/nginx/templates/site-http.conf.template /etc/nginx/templates-custom/site-http.conf.template
COPY deploy/nginx/templates/site-https.conf.template /etc/nginx/templates-custom/site-https.conf.template
COPY deploy/nginx/entrypoint/40-render-config.sh /docker-entrypoint.d/40-render-config.sh
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/40-render-config.sh

EXPOSE 80 443

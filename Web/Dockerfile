# Build stage
FROM node:18-alpine AS build
WORKDIR /app

COPY Web/package.json ./
RUN npm install --legacy-peer-deps

COPY Web/ ./

ARG REACT_APP_API_URL=http://192.168.1.65:6065/oms-backend/
ARG REACT_APP_TILES_BASE=http://192.168.1.65:6065/oms-backend
ARG REACT_APP_BASENAME=/
ARG PUBLIC_URL=/

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_TILES_BASE=$REACT_APP_TILES_BASE
ENV REACT_APP_BASENAME=$REACT_APP_BASENAME
ENV PUBLIC_URL=$PUBLIC_URL
ENV NODE_ENV=production
ENV CI=false
ENV NODE_OPTIONS=--openssl-legacy-provider

RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

RUN apk add --no-cache wget

COPY Web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 3009

HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3009/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

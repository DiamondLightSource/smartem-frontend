FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/smartem/package.json apps/smartem/
COPY apps/legacy/package.json apps/legacy/
COPY packages/api/package.json packages/api/
COPY packages/ui/package.json packages/ui/
RUN npm ci

COPY apps/smartem apps/smartem
COPY packages packages
COPY scripts scripts
COPY tsconfig.base.json tsconfig.json biome.json ./

ARG FRONTEND_VERSION=dev
ARG GIT_SHA=unknown
ARG BUILD_TIME=unknown
ENV FRONTEND_VERSION=$FRONTEND_VERSION \
    GIT_SHA=$GIT_SHA \
    BUILD_TIME=$BUILD_TIME

RUN npm run api:generate -w @smartem/api
RUN node scripts/write-version-json.mjs
RUN npm run build:smartem

FROM nginx:1.30-alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY apps/smartem/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/smartem/dist /usr/share/nginx/html
EXPOSE 80

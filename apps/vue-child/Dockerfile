FROM node:22-alpine AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mfe/vue-child build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/vue-child/dist /usr/share/nginx/html
COPY ../../docker/nginx/spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80


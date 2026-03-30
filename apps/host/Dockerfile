FROM node:22-alpine AS build
WORKDIR /app

# 启用 corepack，保证可以使用 pnpm
RUN corepack enable

ARG VITE_VUE_ENTRY
ARG VITE_REACT_ENTRY

ENV VITE_VUE_ENTRY=${VITE_VUE_ENTRY}
ENV VITE_REACT_ENTRY=${VITE_REACT_ENTRY}

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @mfe/host build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/host/dist /usr/share/nginx/html
COPY ../../docker/nginx/spa.conf /etc/nginx/conf.d/default.conf

EXPOSE 80


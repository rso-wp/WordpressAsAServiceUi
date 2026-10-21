# Production build of the frontend, served by nginx. The app calls /graphql, /payment-methods and /provisions on its own
# origin, so put it behind the gateway (or a proxy that routes those paths to the services).

FROM node:24-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build

# Runs as non-root (uid 101) on 8080; only /tmp needs to be writable (pid and temp files), so the root filesystem can be
# read-only.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist/WordpressAsAServiceUi/browser /usr/share/nginx/html
EXPOSE 8080

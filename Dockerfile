# Built from this directory, which is the root of github.com/cloider/docs:
#   docker build -t cloider-docs .
# .git comes along (fetch-depth 0 in CI) for the pages' "last updated" dates.
FROM node:22-alpine AS build
RUN apk add --no-cache git
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . ./
RUN git config --global --add safe.directory /app && npm run build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80

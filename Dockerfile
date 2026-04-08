FROM node:25.9-alpine3.23 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM svenstaro/miniserve:0.33.0-alpine

COPY --from=builder /app/dist /srv

EXPOSE 80

CMD ["/srv", "--index", "index.html", "--spa", "--port", "80"]

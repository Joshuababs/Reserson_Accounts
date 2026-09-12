# ── build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines `VITE_*` at build time, so the .env the Jenkins pipeline writes has
# to be in the build context before this runs — there is no runtime env for a
# static bundle. `tsc -b` runs first (it's part of `npm run build`), so a type
# error fails the image rather than shipping.
RUN npm run build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# nginx rather than `vite preview`: `preview` is a development server by its own
# documentation, and this is the page every Reservon customer signs in on.
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 9100

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:9100/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

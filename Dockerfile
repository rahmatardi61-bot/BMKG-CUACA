# BMKG Cuaca (public) — build (Vite) lalu serve lewat Node: static + proxy /api/bmkg.
#
#   docker build -t registry-dev.rumahaplikasi.com:5000/bmkg/fe-public:latest .
#   docker push registry-dev.rumahaplikasi.com:5000/bmkg/fe-public:latest
#
# Frontend memanggil /api/bmkg/* (lihat VITE_BMKG_PROXY) yang di-proxy ke
# https://cuaca.bmkg.go.id — butuh Referer/Origin + x-public-token fresh, jadi
# tidak bisa dilayani nginx statis. server.mjs meneruskan ke handler yang sama
# yang dipakai Vercel (api/bmkg/[...path].ts).

# ---------- build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# prod: frontend manggil /api/bmkg/* → server.mjs → handler
ENV VITE_BMKG_PROXY=/api/bmkg
RUN npm run build

# ---------- serve ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=build /app/dist ./dist
COPY --from=build /app/api ./api
COPY server.mjs ./
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
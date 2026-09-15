# Build stage
FROM node:22-alpine AS build-stage

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Prod: frontend memanggil /api/bmkg/* → diteruskan server.mjs ke handler
# yang sama dengan Vercel (api/bmkg/[...path].ts)
ENV VITE_BMKG_PROXY=/api/bmkg
RUN npm run build

# Production stage
# ponytail: pakai Node + server.mjs (bukan `serve`) karena /api/df/* dan
# /api/public/* butuh Referer/Origin + x-public-token segar — tidak bisa
# dilayani static server.
FROM node:22-alpine AS production-stage

WORKDIR /app

COPY --from=build-stage /app/dist ./dist
COPY --from=build-stage /app/api ./api
COPY server.mjs ./

ENV NODE_ENV=production PORT=4021
EXPOSE 4021

CMD ["node", "server.mjs"]
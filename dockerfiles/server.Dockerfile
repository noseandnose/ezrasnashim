# 1) Build client assets
FROM node:20 AS builder
WORKDIR /app

COPY ./server/tsconfig.json  ./tsconfig.json
COPY package*.json ./
COPY ./shared shared
COPY ./server server
RUN npm install --legacy-peer-deps

RUN npx tsc

# 2) Runtime image
FROM node:20-slim
WORKDIR /app

# Copy production deps + built client + server source
COPY package*.json ./
COPY tsconfig.json ./

COPY --from=builder /app/node_modules ./node_modules
#COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["npx", "tsx", "server/index.ts"]
#
#CMD ["node","server/index.js"]
#CMD ["sleep","150000"]

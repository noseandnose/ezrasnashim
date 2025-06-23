# 1) Build client assets
FROM node:20 AS builder
WORKDIR /app
COPY package*.json tsconfig.json  ./
COPY client client
COPY shared shared
COPY server server
RUN npm ci
RUN npx tsc

# 2) Runtime image
FROM node:20-slim
WORKDIR /app

# Copy production deps + built client + server source
COPY package*.json tsconfig.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY server server
COPY shared shared

ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80

CMD ["npm", "start"]

# 1) Build client assets
FROM node:20 AS builder
WORKDIR /app
COPY package*.json server/tsconfig.json  ./
COPY shared shared
COPY server server
RUN npm ci
RUN npx tsc

# 2) Runtime image
FROM node:20-slim
WORKDIR /app

# Copy production deps + built client + server source
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

ENV NODE_ENV=production
ENV PORT=80
EXPOSE 80

CMD ["npm", "start"]

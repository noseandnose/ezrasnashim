FROM node:20
WORKDIR /app

COPY ./server/tsconfig.json ./tsconfig.json
COPY package*.json ./
COPY ./shared shared
COPY ./server server

# Install only production dependencies — skips vitest, jsdom, and other
# dev tools that pull in old package versions blocked by security policy
RUN npm install --omit=dev --legacy-peer-deps

# Install tsx separately so we can run TypeScript directly at runtime
RUN npm install tsx --legacy-peer-deps

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["npx", "tsx", "server/index.ts"]

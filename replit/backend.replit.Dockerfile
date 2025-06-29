# ./replit/backend.replit.Dockerfile
FROM node:24-alpine3.21

WORKDIR /app

# Let Docker Compose mount the code, so skip copying anything here

# Run install + dev server after mount
CMD sh -c "npm ci && npx tsx watch server/index.ts"

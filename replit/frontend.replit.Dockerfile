#FROM node:24-alpine3.21
##COPY . .
#
#WORKDIR /app
#COPY ./package*.json .
#
#RUN npm ci
## ./replit/backend.replit.Dockerfile
FROM node:24-alpine3.21

WORKDIR /app

# Let Docker Compose mount the code, so skip copying anything here

# Run install + dev server after mount
CMD sh -c "npm ci && npx vite dev --mode replit --host 0.0.0.0 "

#CMD ["npx", "vite", "dev", "--mode", "replit", "--host", "0.0.0.0"]
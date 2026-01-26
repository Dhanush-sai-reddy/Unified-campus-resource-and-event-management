FROM node:20-alpine

WORKDIR /app

# Install git/openssl for Prisma/Simple-git
RUN apk add --no-cache git openssl

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY . .

# Generate Prisma Client (Linux binary)
RUN npx prisma generate

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 5000

# Use entrypoint script for db setup + start
CMD ["./docker-entrypoint.sh"]

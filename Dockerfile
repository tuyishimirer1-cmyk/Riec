# ---------- 1️⃣ Builder Stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy dependency manifests first (better caching)
COPY package.json yarn.lock ./

# Install all deps (including dev)
RUN yarn install --frozen-lockfile

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy rest of source
COPY . .

# Build NestJS
RUN yarn build



# ---------- 2️⃣ Production Stage ----------
FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=512

# Copy built artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY package.json ./

# Remove devDependencies (lighter runtime)
RUN yarn install --production --frozen-lockfile --ignore-scripts && yarn cache clean

EXPOSE 3000

# ---- Prisma Runtime Initialization ----
# For MongoDB: validate connection + optionally push schema
CMD npx prisma db push && node dist/src/main.js

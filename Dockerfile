# syntax=docker/dockerfile:1.7

# ---- deps: install full deps (incl. dev) for build & migrate ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript -> dist/ ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json tsconfig.node.json ./
COPY src ./src
RUN npm run build

# ---- migrate: drizzle-kit + schema/migrations (used by compose `migrate` & `seed` services) ----
FROM node:22-alpine AS migrate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json drizzle.config.ts tsconfig.json tsconfig.node.json ./
COPY src ./src
USER node
CMD ["npm", "run", "db:migrate"]

# ---- runtime: prod-only deps + compiled dist/ ----
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]

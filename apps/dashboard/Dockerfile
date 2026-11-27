FROM node:22-alpine

WORKDIR /app

# Copy workspace manifests first for better Docker layer caching
COPY package.json package-lock.json* ./
COPY packages/core/package.json ./packages/core/
COPY apps/dashboard/package.json ./apps/dashboard/

RUN npm install --workspace=apps/dashboard --workspace=packages/core --include-workspace-root

# Copy shared core and dashboard sources
COPY packages/core ./packages/core
COPY apps/dashboard ./apps/dashboard

RUN npm run build:dashboard

EXPOSE 5173

CMD ["node", "apps/dashboard/server.mjs"]

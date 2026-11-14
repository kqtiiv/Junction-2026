# Backend image. Build context is the repository root (see fly.toml), because the backend
# validates against contracts/schemas and seeds fixtures from contracts/examples at runtime.
FROM node:22-bookworm-slim

WORKDIR /app
COPY contracts/schemas contracts/schemas
COPY contracts/examples contracts/examples
COPY contracts/interfaces contracts/interfaces

COPY backend/package.json backend/package-lock.json backend/
# tsx runs the TypeScript directly; it is needed at runtime, so dev dependencies are installed too.
RUN cd backend && npm ci --no-audit --no-fund && npm cache clean --force

COPY backend/tsconfig.json backend/
COPY backend/src backend/src

ENV NODE_ENV=production PORT=8787
EXPOSE 8787
USER node
WORKDIR /app/backend
CMD ["node", "--import", "tsx", "src/main.ts"]

# --- build the frontend ---
FROM node:20-alpine AS web
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
RUN npm run build

# --- API server (also serves the built frontend) ---
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8392
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi
COPY server ./server
# The server reuses the demo seed data from the frontend sources.
COPY src ./src
COPY --from=web /app/dist ./dist
WORKDIR /app/server
EXPOSE 8392
CMD ["node_modules/.bin/tsx", "src/index.ts"]

FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./

# VITE_API_URL tells the frontend where the backend lives at runtime.
# In Docker Compose the browser hits localhost:3001 directly.
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Serve with a lightweight static server ──────────────────────
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]

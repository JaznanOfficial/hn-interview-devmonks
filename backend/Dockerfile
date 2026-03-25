FROM node:20-alpine

WORKDIR /app

# Install build tools for better-sqlite3 native bindings
RUN apk add --no-cache python3 make g++

# Copy package files
COPY backend/package.json ./backend/package.json
COPY config.js ./config.js

WORKDIR /app/backend
RUN npm install

WORKDIR /app
COPY backend/src ./backend/src

# Create data dir for SQLite
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "backend/src/index.js"]

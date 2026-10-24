FROM node:20-bookworm-slim

# Install Chromium and runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libnss3 \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy dependency manifests
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Clean install dependencies in Linux environment
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy application source code (node_modules excluded by .dockerignore)
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build React production bundle
RUN cd frontend && npx vite build

WORKDIR /app/backend

EXPOSE 5000

CMD ["npm", "start"]

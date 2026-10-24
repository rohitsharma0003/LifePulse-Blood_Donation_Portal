FROM node:20-bookworm-slim

# Install Chromium and required fonts cleanly
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libnss3 \
    libxss1 \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy dependency manifests
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy application source
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend production bundle into frontend/dist
RUN cd frontend && npm run build

WORKDIR /app/backend

EXPOSE 5000

CMD ["npm", "start"]

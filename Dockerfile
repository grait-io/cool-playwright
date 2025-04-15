FROM mcr.microsoft.com/playwright:focal

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npx playwright install --with-deps
RUN apt-get update && apt-get install -y curl && apt-get clean

EXPOSE 3000
ENV NODE_ENV=production
ENV CI=true

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
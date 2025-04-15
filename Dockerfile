FROM mcr.microsoft.com/playwright:focal

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npx playwright install --with-deps

EXPOSE 3000
ENV NODE_ENV=production
ENV CI=true

CMD ["node", "server.js"]
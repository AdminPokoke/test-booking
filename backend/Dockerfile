FROM node:20-alpine

WORKDIR /app
COPY backend/package.json ./package.json
RUN npm install

COPY backend ./
# Static files served from /app/public (mounted via docker compose)

ENV NODE_ENV=production
CMD ["npm", "start"]

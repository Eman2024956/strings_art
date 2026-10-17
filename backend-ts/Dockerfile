FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Create storage directories
RUN mkdir -p /app/data/uploads /app/data/jobs

EXPOSE 8000

CMD ["node", "dist/index.js"]

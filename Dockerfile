FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN DATABASE_URL=postgresql://postgres:postgres@db:5432/kadiz npm run build
RUN npm prune --omit=dev

EXPOSE 3000
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run start"]

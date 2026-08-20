FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY tests ./tests
COPY vitest.config.mjs ./

EXPOSE 3000

CMD ["npm", "run", "docker:start"]

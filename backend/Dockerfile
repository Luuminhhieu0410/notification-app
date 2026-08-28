FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn config set network-timeout 600000 -g \
    && yarn install --frozen-lockfile

COPY . .

RUN yarn prisma generate

RUN NODE_OPTIONS="--max-old-space-size=2048" yarn build


FROM node:22-alpine AS production

WORKDIR /app



COPY package.json yarn.lock ./

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]
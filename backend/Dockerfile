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

ENV NODE_ENV=production

COPY package.json yarn.lock ./

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/scripts/import-content-json.mjs ./scripts/import-content-json.mjs
COPY --from=builder /app/scripts/content-import-contract.cjs ./scripts/content-import-contract.cjs
COPY --from=builder /app/data ./data

USER node

EXPOSE 3000

CMD ["node", "dist/src/main.js"]

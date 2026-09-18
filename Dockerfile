FROM node:22-alpine AS build

WORKDIR /app

ARG NODE_AUTH_TOKEN

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
	echo "@Fiandriananaprime:registry=https://npm.pkg.github.com" > .npmrc \
	&& echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc \
	&& npm ci \
	&& rm -f .npmrc

COPY prisma ./prisma

RUN npx prisma generate

COPY src ./src
COPY tsconfig.json ./

RUN npm run build


FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003

ARG NODE_AUTH_TOKEN

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
	echo "@Fiandriananaprime:registry=https://npm.pkg.github.com" > .npmrc \
	&& echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc \
	&& npm ci --omit=dev \
	&& rm -f .npmrc

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/generated/prisma ./dist/generated/prisma

EXPOSE 3003

CMD ["node", "dist/server.js"]
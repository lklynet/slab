FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json ./

RUN npm install --production

FROM node:22-alpine

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/node_modules ./node_modules

COPY server.js package.json ./
COPY index.html script.js ./
COPY css ./css

RUN mkdir -p data && chown -R app:app data

USER app

EXPOSE 3000

CMD ["node", "server.js"]

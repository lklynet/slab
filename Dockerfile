FROM node:22-alpine

WORKDIR /app

COPY server.js index.html script.js ./
COPY css ./css

RUN mkdir -p data

EXPOSE 3000

CMD ["node", "server.js"]

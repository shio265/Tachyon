FROM oven/bun:latest
WORKDIR /app

COPY package.json ./
COPY bun.lock ./
COPY src ./

RUN bun install
EXPOSE 8080
CMD ["bun", "run", "start"]
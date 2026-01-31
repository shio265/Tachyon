FROM oven/bun:latest
WORKDIR /app

COPY package.json ./
COPY src ./

RUN bun install
EXPOSE 8080
CMD ["bun", "run", "start"]
FROM node:24-bullseye

WORKDIR /app

COPY package.json package-lock.json ./

RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    g++ \
    chromium \
    libnss3 \
    libfreetype6 \
    libfreetype6-dev \
    libharfbuzz-dev \
    fonts-freefont-ttf \
    ca-certificates \
    python3-pip

RUN pip3 install --no-cache-dir gtts

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true   
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN npm install

COPY . .

RUN sed -i '1s|.*|#!/usr/bin/env python3|' /app/bin/gtts-cli \
    && chmod +x /app/bin/gtts-cli
RUN chmod +x ./bin/gtts-cli

ENV PATH="./bin:$PATH"

CMD ["npm", "run", "start"]

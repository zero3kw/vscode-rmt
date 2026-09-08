FROM node:24-slim

RUN apt-get update \
    && apt-get install -y \
        git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g \
    pnpm@12.3.4 \
    @vscode/vsce

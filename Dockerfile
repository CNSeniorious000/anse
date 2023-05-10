FROM node:alpine
WORKDIR /usr/src
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm run build
ENV HOST="0.0.0.0" \
    PORT="3000" \
    NODE_ENV="production" \
    HEAD_SCRIPTS="<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-F8K8V9N5K4\"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-F8K8V9N5K4');</script>"
EXPOSE $PORT
CMD ["node", "dist/server/entry.mjs"]

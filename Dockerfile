FROM node:23 AS build

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN npm cache clean --force

RUN pnpm install

# RUN pnpm install -g @angular/cli

COPY . .

RUN pnpm run build

FROM nginx:alpine

COPY --from=build app/dist/sonar-front/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
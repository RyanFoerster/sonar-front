FROM node:20.17.0 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g @angular/cli

COPY . .

RUN ng build --configuration=production

# FROM nginx:alpine

# COPY --from=build app/dist/sonar-front/browser /usr/share/nginx/html
# COPY ngnix.conf /etc/nginx/conf.d/default.conf


# RUN apk add certbot

# COPY ./certbot/conf /etc/letsencrypt
# COPY ./ dest


# EXPOSE 8080
# EXPOSE 443

# CMD ["nginx", "-g", "daemon off;"]
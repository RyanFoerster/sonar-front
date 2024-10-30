FROM node:20.17.0 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g @angular/cli

COPY . .

RUN ng build --configuration=production

FROM certbot/certbot AS ssl
VOLUME [ "/etc/letsencrypt", "/var/www/certbot" ]
CMD [ "certonly", "--webroot", "--webroot-path", "/var/www/certbot", "--email", "ryanfoerster@dimagin.be", "--agree-tos", "-d", "sonarartists.fr", "-d", "www.sonarartists.fr" ]


FROM nginx:alpine

COPY --from=build app/dist/sonar-front/browser /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=ssl /etc/letsencrypt/live/sonarartists.fr /etc/letsencrypt/live/sonarartists.fr

VOLUME [ "/etc/letsencrypt", "/var/www/certbot", "/etc/nginx/conf.d" ]


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
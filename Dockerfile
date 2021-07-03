FROM node:14-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . .

RUN npm install

EXPOSE 8080
EXPOSE 3456

CMD ["npm", "run", "start:live"]
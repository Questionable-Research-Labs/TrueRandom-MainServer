FROM node:16-alpine

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY . .

ENV PYTHON /usr/bin/python

RUN apt-get update || : && apt-get install python2 -y && apt-get install python -y
RUN npm install

EXPOSE 8080
EXPOSE 3456

CMD ["npm", "run", "start:live"]
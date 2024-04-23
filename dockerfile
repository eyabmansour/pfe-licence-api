FROM node:20.10.0

WORKDIR /usr/src/app

COPY . . 

RUN npm install

EXPOSE 3000

CMD [ "npm", "run", "start:dev" ]
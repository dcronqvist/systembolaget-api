FROM node

WORKDIR /app
COPY . .
RUN yarn
RUN mkdir data
RUN mkdir data/stores

CMD [ "yarn", "start" ]
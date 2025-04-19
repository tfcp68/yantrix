FROM node:lts
WORKDIR /app
COPY package.json .
RUN npm i
RUN npm install -g serve
COPY . .
RUN npm run build
EXPOSE 8888
# CMD ["serve", "-l", "8888", "-s", "dist"]
CMD ["npm", "run", "dev"]
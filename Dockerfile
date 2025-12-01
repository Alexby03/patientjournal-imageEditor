FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 8085

ENV HOST=0.0.0.0
ENV PORT=8085

CMD ["npm", "start"]
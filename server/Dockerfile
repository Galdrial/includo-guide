FROM node:22-alpine

WORKDIR /app

# Copy dependency manifests first for better Docker layer caching
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]

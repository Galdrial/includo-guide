FROM node:22-alpine

WORKDIR /app

# Avendo impostato la Base Directory su /backend, 
# qui siamo già "dentro" la cartella backend.
COPY package*.json ./

RUN npm install

COPY . .

# Cambia 3000 con la porta reale del tuo backend se diversa
EXPOSE 3001

CMD ["npm", "start"]

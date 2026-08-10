FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /usr/src/app

# Instalar dependencias
COPY package*.json ./
RUN npm install --production

# Copiar el código fuente de la aplicación
COPY bot.js ./

# Iniciar la aplicación
CMD [ "npm", "start" ]

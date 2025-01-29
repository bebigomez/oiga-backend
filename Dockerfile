# Usa la imagen oficial de Node.js
FROM node:18

# Configura el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos de configuración y dependencias al contenedor
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente al contenedor
COPY . .

# Expone el puerto 3001 (el puerto que usa el backend)
EXPOSE 3001

# Inicia el servidor
CMD ["node", "index.js"]
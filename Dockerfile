FROM node:18-slim

# Installer ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Dossier de travail
WORKDIR /app

# Copier package.json et installer deps
COPY package.json ./
RUN npm install

# Copier le reste
COPY . .

# Railway fournit PORT automatiquement
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]

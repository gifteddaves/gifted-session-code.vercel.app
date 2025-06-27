FROM node:lts-buster

# Install required packages
RUN apt-get update && \
  apt-get install -y ffmpeg imagemagick webp && \
  apt-get upgrade -y && \
  rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy and install dependencies
COPY package.json ./
RUN npm install

# Copy all project files
COPY . .

# Expose port (if your bot runs a server e.g., for dashboard/pairing API)
EXPOSE 3000

# Start the bot from index.js
CMD ["node", "index.js"]

FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Run the application
CMD ["node", "index.js"]

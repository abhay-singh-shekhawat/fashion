# Dockerfile

FROM node:20-alpine

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start with nodemon in development, node in production
CMD ["npm", "start"]
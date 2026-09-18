# Dockerfile

FROM node:20-alpine

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

RUN npm ci --omit=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

CMD ["npm", "start"]
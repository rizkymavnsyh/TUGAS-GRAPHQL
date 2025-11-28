FROM node:20-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies (will be cached until package.json changes)
RUN npm install

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 4000

CMD ["npm", "start"]


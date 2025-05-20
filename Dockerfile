# Smart DNS Proxy Dockerfile

FROM node:16-alpine

# Install Dnsmasq
RUN apk update && \
    apk add --no-cache dnsmasq bash

# Set up working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Make scripts executable
RUN chmod +x /app/scripts/start.sh

# Create necessary directories
RUN mkdir -p /app/logs /app/data /etc/dnsmasq.d

# Expose ports
EXPOSE 53/udp 53/tcp 5000/tcp

# Start the application
CMD ["/app/scripts/start.sh"]

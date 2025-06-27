#!/bin/bash

# Smart DNS Proxy Startup Script
# This script is used to initialize and start the Smart DNS Proxy system

# Set up error handling
set -e

echo "Starting Smart DNS Proxy..."

# Ensure dnsmasq is installed
if ! which dnsmasq >/dev/null 2>&1; then
    echo "Dnsmasq is not installed. Please install it first."
    exit 1
fi

# Ensure logs directory exists
mkdir -p /root/smart-dns-proxy/logs

# Ensure data directory exists
mkdir -p /root/smart-dns-proxy/data

# Ensure dnsmasq.d directory exists
mkdir -p /etc/dnsmasq.d

# Initialize configuration if it doesn't exist
if [ ! -f "/root/smart-dns-proxy/data/config.json" ]; then
    echo '{"dnsServer":{"port":53,"cacheSize":1000,"logQueries":true},"alternativeDNS":["8.8.8.8","1.1.1.1"],"webInterface":{"port":5000,"enableAuth":false,"username":"admin","password":"admin"}}' > /root/smart-dns-proxy/data/config.json
    echo "Created default configuration."
fi

if [ ! -f "/root/smart-dns-proxy/data/ips.json" ]; then
    echo '{"domains":[{"domain":"netflix.com","resolveVia":"1.1.1.1"},{"domain":"spotify.com","resolveVia":"8.8.8.8"}]}' > /root/smart-dns-proxy/data/ips.json
    echo "Created default IP list."
fi

# Update dnsmasq configuration
echo "Configuring dnsmasq..."
node /root/smart-dns-proxy/scripts/configure-dnsmasq.js

# Start dnsmasq
echo "Starting dnsmasq service..."
service dnsmasq restart || {
    echo "Failed to start dnsmasq. Check if port 53 is already in use."
    exit 1
}

# Start the web interface
echo "Starting web interface..."
cd /root/smart-dns-proxy && node app.js

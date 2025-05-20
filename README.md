# Smart DNS Proxy

A containerized DNS proxy system that helps bypass geographic restrictions for specific domains on Linux servers.

## Overview

This Smart DNS Proxy system allows you to route DNS queries for specific domains through alternate DNS servers, which helps bypass geographic restrictions or censorship. It includes a web-based management interface and runs in a Docker container for easy deployment.

## Features

- Routes DNS traffic for specific domains through alternate DNS servers
- Containerized for easy deployment and management
- Simple web-based administration interface
- Configuration for specific domain routing rules
- Logging of DNS queries
- Low latency DNS resolution
- Easy to update IP address lists

## Requirements

- Docker and Docker Compose
- Port 53 (UDP/TCP) available for DNS services
- Port 5000 available for the web interface

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/smart-dns-proxy.git
   cd smart-dns-proxy
   ```

2. Build and start the Docker container:
   ```
   docker-compose up -d
   ```

3. Access the web interface:
   ```
   http://your-server-ip:5000
   ```

## Configuration

### Web Interface

The web interface allows you to:

1. Add, edit, and remove domains from your bypass list
2. Configure alternative DNS servers
3. Adjust DNS server settings such as cache size and port
4. View system logs and DNS query logs
5. Monitor system status

### Domain Configuration

To add a domain to be bypassed:

1. Navigate to the "Domain List" section in the web interface
2. Click "Add Domain"
3. Enter the domain name (e.g., "netflix.com")
4. Enter the IP address of the DNS server to use for this domain (e.g., "8.8.8.8")
5. Click "Add Domain"

## Technical Details

### Components

- **Dnsmasq**: Lightweight DNS forwarder and DHCP server
- **Node.js**: Powers the web-based management interface
- **Express**: Web application framework
- **Docker**: Containerization for easy deployment

### Directory Structure

- `/app.js`: Main application entry point
- `/config.js`: Configuration handler
- `/dnsconfig.js`: DNS configuration manager
- `/logger.js`: Logging system
- `/public/`: Web interface files
- `/routes/`: API and web routes
- `/scripts/`: Startup and configuration scripts
- `/data/`: Configuration data
- `/logs/`: Log files

## Troubleshooting

### DNS Service Not Starting

- Check if port 53 is already in use by another service
- Ensure the container has the NET_ADMIN capability
- Check error logs in the web interface or using `docker logs smart-dns-proxy`

### Can't Access Web Interface

- Verify that port 5000 is not blocked by your firewall
- Check if the container is running with `docker ps`
- Inspect container logs with `docker logs smart-dns-proxy`

### DNS Resolution Not Working

- Ensure your system is using the DNS proxy's IP address as its DNS server
- Check if the domain is correctly configured in the Domain List
- Review the DNS logs in the web interface

## Security Considerations

- The default configuration does not include authentication for the web interface
- Consider enabling authentication in the Settings page
- Consider placing the web interface behind a reverse proxy with HTTPS
- Limit access to port 5000 to trusted IP addresses

## License

This project is open source under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

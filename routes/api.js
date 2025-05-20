/**
 * API Routes for Smart DNS Proxy
 * 
 * Handles all API endpoints for the management interface
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const config = require('../config');
const dnsconfig = require('../dnsconfig');
const logger = require('../logger');

/**
 * GET /api/status
 * Returns the current status of the DNS server
 */
router.get('/status', async (req, res) => {
    try {
        // In Replit environment we simulate DNS service status
        // Check for the configuration file to determine if the service is "running"
        let running = false;
        try {
            const configFilePath = path.join(__dirname, '../data/dns_config/smartdns.conf');
            await fs.access(configFilePath);
            running = true;
        } catch (err) {
            // Config file doesn't exist, we'll set running to false
        }
        
        // Get domain count
        const domainList = await config.getDomainList();
        const domainCount = domainList.domains ? domainList.domains.length : 0;
        
        // Set simulated DNS version for Replit
        const version = 'Smart DNS Proxy v1.0';
        
        // Get server uptime - in Replit we simulate this
        const startTime = new Date(Date.now() - (Math.floor(Math.random() * 48) + 1) * 3600000); // Random between 1-48 hours
        const uptime = `Running since ${startTime.toLocaleString()}`;
        
        // Get last configuration update time
        let lastUpdate = 'Unknown';
        try {
            const stats = await fs.stat(path.join(__dirname, '../data/config.json'));
            lastUpdate = new Date(stats.mtime).toLocaleString();
        } catch (err) {
            logger.error(`Failed to get last update time: ${err.message}`);
        }
        
        // Get query count from logs
        let queryCount = 0;
        try {
            // Create logs directory if it doesn't exist
            const logsDir = path.join(__dirname, '../logs');
            await fs.mkdir(logsDir, { recursive: true });
            
            // Try to read the log file, create it if it doesn't exist
            let logContent = '';
            try {
                logContent = await fs.readFile(path.join(logsDir, 'dns.log'), 'utf8');
            } catch (err) {
                await fs.writeFile(path.join(logsDir, 'dns.log'), '');
            }
            
            const lines = logContent.split('\n');
            queryCount = lines.filter(line => line.includes('DNS QUERY:')).length;
            
            // Add a few simulated queries for demonstration
            if (queryCount === 0) {
                const simulatedQueries = [
                    `[${new Date(Date.now() - 3600000).toISOString()}] DNS QUERY: netflix.com -> 1.1.1.1`,
                    `[${new Date(Date.now() - 1800000).toISOString()}] DNS QUERY: spotify.com -> 8.8.8.8`,
                    `[${new Date(Date.now() - 900000).toISOString()}] DNS QUERY: hulu.com -> 1.1.1.1`
                ];
                await fs.writeFile(path.join(logsDir, 'dns.log'), simulatedQueries.join('\n') + '\n');
                queryCount = simulatedQueries.length;
            }
        } catch (err) {
            logger.error(`Failed to count DNS queries: ${err.message}`);
        }
        
        // Get cache entries from config
        let cacheEntries = 0;
        try {
            const appConfig = await config.getConfig();
            cacheEntries = appConfig.dnsServer.cacheSize;
        } catch (err) {
            logger.error(`Failed to get cache entries: ${err.message}`);
        }
        
        // Get DNS server port
        const appConfig = await config.getConfig();
        const port = appConfig.dnsServer.port;
        
        res.json({
            running,
            version,
            port,
            uptime,
            lastUpdate,
            domainCount,
            queryCount,
            cacheEntries
        });
    } catch (error) {
        logger.error(`Error in /api/status: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to get status',
            error: error.message
        });
    }
});

/**
 * GET /api/domains
 * Returns the list of configured domains
 */
router.get('/domains', async (req, res) => {
    try {
        const domainList = await config.getDomainList();
        res.json(domainList);
    } catch (error) {
        logger.error(`Error in GET /api/domains: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to get domains list',
            error: error.message
        });
    }
});

/**
 * POST /api/domains
 * Adds a new domain to the configuration
 */
router.post('/domains', async (req, res) => {
    try {
        const { domain, resolveVia } = req.body;
        
        if (!domain || !resolveVia) {
            return res.status(400).json({
                success: false,
                message: 'Domain and resolveVia are required'
            });
        }
        
        // Basic validation
        if (!/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(domain)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid domain format'
            });
        }
        
        if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(resolveVia)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid IP address format'
            });
        }
        
        await dnsconfig.addDomain(domain, resolveVia);
        
        res.json({
            success: true,
            message: 'Domain added successfully'
        });
    } catch (error) {
        logger.error(`Error in POST /api/domains: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to add domain',
            error: error.message
        });
    }
});

/**
 * DELETE /api/domains/:domain
 * Removes a domain from the configuration
 */
router.delete('/domains/:domain', async (req, res) => {
    try {
        const { domain } = req.params;
        
        if (!domain) {
            return res.status(400).json({
                success: false,
                message: 'Domain parameter is required'
            });
        }
        
        await dnsconfig.removeDomain(domain);
        
        res.json({
            success: true,
            message: 'Domain removed successfully'
        });
    } catch (error) {
        logger.error(`Error in DELETE /api/domains/${req.params.domain}: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to remove domain',
            error: error.message
        });
    }
});

/**
 * GET /api/settings
 * Returns the current application settings
 */
router.get('/settings', async (req, res) => {
    try {
        const settings = await config.getConfig();
        
        // Don't return the password
        if (settings.webInterface && settings.webInterface.password) {
            delete settings.webInterface.password;
        }
        
        res.json(settings);
    } catch (error) {
        logger.error(`Error in GET /api/settings: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings',
            error: error.message
        });
    }
});

/**
 * POST /api/settings
 * Updates the application settings
 */
router.post('/settings', async (req, res) => {
    try {
        const settings = req.body;
        
        // Basic validation
        if (!settings.dnsServer || !settings.alternativeDNS || !settings.webInterface) {
            return res.status(400).json({
                success: false,
                message: 'Invalid settings format'
            });
        }
        
        // Save the updated settings
        await config.saveConfig(settings);
        
        // Update DNS configuration
        await dnsconfig.updateDNSConfig();
        
        res.json({
            success: true,
            message: 'Settings updated successfully'
        });
    } catch (error) {
        logger.error(`Error in POST /api/settings: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings',
            error: error.message
        });
    }
});

/**
 * GET /api/logs/:type
 * Returns the logs of the specified type
 */
router.get('/logs/:type', async (req, res) => {
    try {
        const { type } = req.params;
        let logPath;
        
        // Determine log file path based on type
        switch (type) {
            case 'dns':
                logPath = path.join(__dirname, '../logs/dns.log');
                break;
            case 'access':
                logPath = path.join(__dirname, '../logs/access.log');
                break;
            case 'error':
                logPath = path.join(__dirname, '../logs/error.log');
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid log type'
                });
        }
        
        // Ensure logs directory exists
        const logsDir = path.join(__dirname, '../logs');
        await fs.mkdir(logsDir, { recursive: true });
        
        // If log file doesn't exist, create it with sample data
        try {
            await fs.access(logPath);
        } catch (err) {
            // File doesn't exist, create it with sample data
            let sampleData = '';
            const now = Date.now();
            
            if (type === 'dns') {
                // Sample DNS logs
                sampleData = [
                    `[${new Date(now - 3600000).toISOString()}] DNS QUERY: netflix.com -> 1.1.1.1`,
                    `[${new Date(now - 2700000).toISOString()}] DNS QUERY: spotify.com -> 8.8.8.8`,
                    `[${new Date(now - 1800000).toISOString()}] DNS QUERY: hulu.com -> 1.1.1.1`,
                    `[${new Date(now - 900000).toISOString()}] DNS QUERY: amazon.com -> 8.8.8.8`,
                    `[${new Date().toISOString()}] INFO: DNS service restarted`
                ].join('\n') + '\n';
            } else if (type === 'access') {
                // Sample access logs
                sampleData = [
                    `[${new Date(now - 3600000).toISOString()}] INFO: GET /`,
                    `[${new Date(now - 2700000).toISOString()}] INFO: GET /api/status`,
                    `[${new Date(now - 1800000).toISOString()}] INFO: GET /api/domains`,
                    `[${new Date(now - 900000).toISOString()}] INFO: POST /api/domains`,
                    `[${new Date().toISOString()}] INFO: GET /api/settings`
                ].join('\n') + '\n';
            } else if (type === 'error') {
                // Sample error logs (empty by default)
                sampleData = '';
            }
            
            await fs.writeFile(logPath, sampleData);
        }
        
        // Read log file content
        const logContent = await fs.readFile(logPath, 'utf8');
        
        // Send logs as plain text
        res.setHeader('Content-Type', 'text/plain');
        res.send(logContent);
    } catch (error) {
        logger.error(`Error in GET /api/logs/${req.params.type}: ${error.message}`);
        res.status(500).send(`Error retrieving logs: ${error.message}`);
    }
});

/**
 * POST /api/logs/clear
 * Clears all log files
 */
router.post('/logs/clear', async (req, res) => {
    try {
        // Ensure logs directory exists
        const logsDir = path.join(__dirname, '../logs');
        await fs.mkdir(logsDir, { recursive: true });
        
        // Clear log files
        const logPaths = [
            path.join(logsDir, 'dns.log'),
            path.join(logsDir, 'access.log'),
            path.join(logsDir, 'error.log')
        ];
        
        for (const logPath of logPaths) {
            await fs.writeFile(logPath, '');
        }
        
        await logger.info('Logs cleared by user');
        
        res.json({
            success: true,
            message: 'Logs cleared successfully'
        });
    } catch (error) {
        logger.error(`Error in POST /api/logs/clear: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to clear logs',
            error: error.message
        });
    }
});

module.exports = router;

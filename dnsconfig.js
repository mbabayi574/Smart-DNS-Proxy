/**
 * DNS Configuration Handler
 * 
 * Manages the configuration of DNS routing rules.
 * In Replit environment, we simulate the DNS configuration
 * since we don't have direct access to system services.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const logger = require('./logger');
const config = require('./config');

// Use local directory for configuration files in Replit
const DNSMASQ_CONFIG_DIR = path.join(__dirname, 'data', 'dns_config');
const CUSTOM_CONFIG_FILE = path.join(DNSMASQ_CONFIG_DIR, 'smartdns.conf');

/**
 * Initialize DNS configuration
 */
async function initializeDNSConfig() {
    logger.info('Initializing DNS configuration');
    
    try {
        // Create custom config directory if it doesn't exist
        await fs.mkdir(DNSMASQ_CONFIG_DIR, { recursive: true });
        
        // Get current configuration
        const appConfig = await config.getConfig();
        const domainList = await config.getDomainList();
        
        // Generate configuration
        await generateDnsmasqConfig(appConfig, domainList);
        
        // In Replit, we don't actually restart a service,
        // but we simulate the result for the UI
        logger.info('DNS configuration initialized successfully');
        return true;
    } catch (error) {
        logger.error(`Failed to initialize DNS configuration: ${error.message}`);
        throw error;
    }
}

/**
 * Generate DNS configuration based on application settings
 */
async function generateDnsmasqConfig(appConfig, domainList) {
    logger.info('Generating DNS configuration');
    
    let configContent = `# Smart DNS Proxy Configuration\n`;
    configContent += `# Generated at ${new Date().toISOString()}\n\n`;
    configContent += `# Basic configuration\n`;
    configContent += `port=${appConfig.dnsServer.port}\n`;
    configContent += `cache-size=${appConfig.dnsServer.cacheSize}\n`;
    configContent += `log-queries=${appConfig.dnsServer.logQueries ? 'true' : 'false'}\n\n`;
    
    // Set up alternative DNS servers
    configContent += `# Alternative DNS servers\n`;
    appConfig.alternativeDNS.forEach(dns => {
        configContent += `server=${dns}\n`;
    });
    
    configContent += `\n# Domain specific configurations\n`;
    if (domainList.domains && domainList.domains.length > 0) {
        domainList.domains.forEach(item => {
            configContent += `server=/${item.domain}/${item.resolveVia}\n`;
        });
    } else {
        configContent += `# No domains configured yet\n`;
    }
    
    // Write configuration to file
    await fs.writeFile(CUSTOM_CONFIG_FILE, configContent);
    logger.info(`DNS configuration generated at ${CUSTOM_CONFIG_FILE}`);
}

/**
 * Simulate restarting the DNS service
 * In Replit environment, we don't have dnsmasq service,
 * so we just simulate a successful restart
 */
async function restartDnsmasq() {
    try {
        logger.info('Simulating DNS service restart');
        // In a real environment, we would restart the service
        // But here we just log it for simulation
        await fs.appendFile(
            path.join(__dirname, 'logs', 'dns.log'), 
            `[${new Date().toISOString()}] INFO: DNS service restarted\n`
        );
        logger.info('DNS service restart simulated successfully');
        return true;
    } catch (error) {
        logger.error(`Failed to simulate DNS restart: ${error.message}`);
        throw error;
    }
}

/**
 * Update DNS configuration with new settings
 */
async function updateDNSConfig() {
    try {
        const appConfig = await config.getConfig();
        const domainList = await config.getDomainList();
        
        await generateDnsmasqConfig(appConfig, domainList);
        await restartDnsmasq();
        
        // Also generate a report of bypassed domains
        await generateBypassReport(domainList);
        
        logger.info('DNS configuration updated successfully');
        return true;
    } catch (error) {
        logger.error(`Failed to update DNS configuration: ${error.message}`);
        throw error;
    }
}

/**
 * Generate a report of bypassed domains for the UI
 */
async function generateBypassReport(domainList) {
    try {
        const reportPath = path.join(__dirname, 'data', 'bypass_report.json');
        const report = {
            timestamp: new Date().toISOString(),
            totalDomains: domainList.domains.length,
            domains: domainList.domains,
            dnsServers: {} // Group by DNS server for stats
        };
        
        // Count domains per DNS server
        domainList.domains.forEach(item => {
            if (!report.dnsServers[item.resolveVia]) {
                report.dnsServers[item.resolveVia] = 1;
            } else {
                report.dnsServers[item.resolveVia]++;
            }
        });
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        logger.info(`Bypass report generated at ${reportPath}`);
    } catch (error) {
        logger.error(`Failed to generate bypass report: ${error.message}`);
        // Non-critical error, so we don't throw
    }
}

/**
 * Add a new domain to the DNS configuration
 */
async function addDomain(domain, resolveVia) {
    try {
        await config.addDomain(domain, resolveVia);
        await updateDNSConfig();
        // Log the addition for DNS log view
        await fs.appendFile(
            path.join(__dirname, 'logs', 'dns.log'),
            `[${new Date().toISOString()}] INFO: Added domain ${domain} to bypass via ${resolveVia}\n`
        );
        return true;
    } catch (error) {
        logger.error(`Failed to add domain: ${error.message}`);
        throw error;
    }
}

/**
 * Remove a domain from the DNS configuration
 */
async function removeDomain(domain) {
    try {
        await config.removeDomain(domain);
        await updateDNSConfig();
        // Log the removal for DNS log view
        await fs.appendFile(
            path.join(__dirname, 'logs', 'dns.log'),
            `[${new Date().toISOString()}] INFO: Removed domain ${domain} from bypass list\n`
        );
        return true;
    } catch (error) {
        logger.error(`Failed to remove domain: ${error.message}`);
        throw error;
    }
}

module.exports = {
    initializeDNSConfig,
    updateDNSConfig,
    addDomain,
    removeDomain
};

/**
 * Dnsmasq Configuration Script
 * 
 * This script configures dnsmasq based on the application settings.
 * It's used during initialization and can be called to update the configuration.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CONFIG_PATH = path.join(__dirname, '../data/config.json');
const IP_LIST_PATH = path.join(__dirname, '../data/ips.json');
const DNSMASQ_CONFIG_PATH = '/etc/dnsmasq.conf';
const DNSMASQ_CUSTOM_CONF_DIR = '/etc/dnsmasq.d';
const CUSTOM_CONFIG_FILE = path.join(DNSMASQ_CUSTOM_CONF_DIR, 'smartdns.conf');

/**
 * Main function to configure dnsmasq
 */
async function configureService() {
    try {
        console.log('Configuring dnsmasq service...');
        
        // Read configuration files
        let configData, ipListData;
        
        try {
            configData = await fs.readFile(CONFIG_PATH, 'utf8');
            ipListData = await fs.readFile(IP_LIST_PATH, 'utf8');
        } catch (err) {
            console.error(`Error reading configuration files: ${err.message}`);
            console.log('Creating default configuration...');
            
            // Create default configuration if it doesn't exist
            const defaultConfig = {
                dnsServer: {
                    port: 53,
                    cacheSize: 1000,
                    logQueries: true,
                },
                alternativeDNS: [
                    '8.8.8.8',
                    '1.1.1.1'
                ],
                webInterface: {
                    port: 5000,
                    enableAuth: false,
                    username: 'admin',
                    password: 'admin'
                }
            };
            
            const defaultIpList = {
                domains: [
                    {
                        domain: 'netflix.com',
                        resolveVia: '1.1.1.1'
                    },
                    {
                        domain: 'spotify.com',
                        resolveVia: '8.8.8.8'
                    }
                ]
            };
            
            // Ensure directories exist
            await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
            
            // Write default configuration
            await fs.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
            await fs.writeFile(IP_LIST_PATH, JSON.stringify(defaultIpList, null, 2));
            
            // Read the newly created config
            configData = JSON.stringify(defaultConfig);
            ipListData = JSON.stringify(defaultIpList);
        }
        
        // Parse configuration
        const config = JSON.parse(configData);
        const ipList = JSON.parse(ipListData);
        
        // Create dnsmasq configuration
        let dnsmasqConfig = `# Smart DNS Proxy configuration\n`;
        dnsmasqConfig += `# Generated at ${new Date().toISOString()}\n\n`;
        
        // Basic configuration
        dnsmasqConfig += `# Basic configuration\n`;
        dnsmasqConfig += `port=${config.dnsServer.port}\n`;
        dnsmasqConfig += `cache-size=${config.dnsServer.cacheSize}\n`;
        dnsmasqConfig += `log-queries=${config.dnsServer.logQueries ? 'true' : 'false'}\n\n`;
        
        // Alternative DNS servers
        dnsmasqConfig += `# Alternative DNS servers\n`;
        config.alternativeDNS.forEach(dns => {
            dnsmasqConfig += `server=${dns}\n`;
        });
        
        // Domain-specific configurations
        dnsmasqConfig += `\n# Domain specific configurations\n`;
        ipList.domains.forEach(item => {
            dnsmasqConfig += `server=/${item.domain}/${item.resolveVia}\n`;
        });
        
        // Ensure custom configuration directory exists
        await execPromise(`mkdir -p ${DNSMASQ_CUSTOM_CONF_DIR}`);
        
        // Write configuration to file
        await fs.writeFile(CUSTOM_CONFIG_FILE, dnsmasqConfig);
        
        console.log(`Dnsmasq configuration written to ${CUSTOM_CONFIG_FILE}`);
        
        // Ensure the main config includes the custom config directory
        let mainConfigContent;
        try {
            mainConfigContent = await fs.readFile(DNSMASQ_CONFIG_PATH, 'utf8');
        } catch (err) {
            console.log(`Creating main dnsmasq configuration at ${DNSMASQ_CONFIG_PATH}`);
            mainConfigContent = '';
        }
        
        // Check if conf-dir is already included
        if (!mainConfigContent.includes('conf-dir=/etc/dnsmasq.d')) {
            mainConfigContent += '\n# Include configuration directory\nconf-dir=/etc/dnsmasq.d\n';
            await fs.writeFile(DNSMASQ_CONFIG_PATH, mainConfigContent);
            console.log('Updated main dnsmasq configuration');
        }
        
        console.log('Dnsmasq configuration completed successfully');
    } catch (error) {
        console.error(`Error configuring dnsmasq: ${error.message}`);
        process.exit(1);
    }
}

// Run the configuration function
configureService();

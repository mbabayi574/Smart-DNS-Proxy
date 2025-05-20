/**
 * Configuration handler for the Smart DNS Proxy
 * 
 * Manages loading and saving configuration settings
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

const CONFIG_PATH = path.join(__dirname, 'data', 'config.json');
const IPS_PATH = path.join(__dirname, 'data', 'ips.json');

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

async function ensureConfigExists() {
    try {
        await fs.access(CONFIG_PATH);
    } catch (error) {
        // Config doesn't exist, create it
        logger.info('Creating default configuration file');
        await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
        await fs.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    }

    try {
        await fs.access(IPS_PATH);
    } catch (error) {
        // IP list doesn't exist, create it
        logger.info('Creating default IP list file');
        await fs.mkdir(path.dirname(IPS_PATH), { recursive: true });
        await fs.writeFile(IPS_PATH, JSON.stringify(defaultIpList, null, 2));
    }
}

async function getConfig() {
    await ensureConfigExists();
    const configData = await fs.readFile(CONFIG_PATH, 'utf8');
    return JSON.parse(configData);
}

async function getDomainList() {
    await ensureConfigExists();
    const ipData = await fs.readFile(IPS_PATH, 'utf8');
    return JSON.parse(ipData);
}

async function saveConfig(config) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    logger.info('Configuration saved successfully');
    return true;
}

async function saveDomainList(domains) {
    await fs.writeFile(IPS_PATH, JSON.stringify({ domains }, null, 2));
    logger.info('Domain list saved successfully');
    return true;
}

async function addDomain(domain, resolveVia) {
    const domainList = await getDomainList();
    
    // Check if domain already exists
    const existingIndex = domainList.domains.findIndex(d => d.domain === domain);
    
    if (existingIndex !== -1) {
        domainList.domains[existingIndex].resolveVia = resolveVia;
    } else {
        domainList.domains.push({ domain, resolveVia });
    }
    
    await saveDomainList(domainList.domains);
    return domainList;
}

async function removeDomain(domain) {
    const domainList = await getDomainList();
    domainList.domains = domainList.domains.filter(d => d.domain !== domain);
    await saveDomainList(domainList.domains);
    return domainList;
}

module.exports = {
    getConfig,
    saveConfig,
    getDomainList,
    saveDomainList,
    addDomain,
    removeDomain
};

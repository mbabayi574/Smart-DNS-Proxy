/**
 * Logger Module
 * 
 * Handles logging for the Smart DNS Proxy application
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
try {
    if (!fsSync.existsSync(logsDir)) {
        fsSync.mkdirSync(logsDir, { recursive: true });
    }
} catch (err) {
    console.error(`Error creating logs directory: ${err.message}`);
}

// Log file paths
const accessLogPath = path.join(logsDir, 'access.log');
const errorLogPath = path.join(logsDir, 'error.log');
const dnsLogPath = path.join(logsDir, 'dns.log');

/**
 * Format a log message with timestamp
 */
function formatLogMessage(message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${message}\n`;
}

/**
 * Log an informational message
 */
async function info(message) {
    const formattedMessage = formatLogMessage(`INFO: ${message}`);
    console.log(formattedMessage.trim());
    try {
        await fs.appendFile(accessLogPath, formattedMessage);
    } catch (err) {
        console.error(`Failed to write to access log: ${err.message}`);
    }
}

/**
 * Log an error message
 */
async function error(message) {
    const formattedMessage = formatLogMessage(`ERROR: ${message}`);
    console.error(formattedMessage.trim());
    try {
        await fs.appendFile(errorLogPath, formattedMessage);
    } catch (err) {
        console.error(`Failed to write to error log: ${err.message}`);
    }
}

/**
 * Log a warning message
 */
async function warn(message) {
    const formattedMessage = formatLogMessage(`WARN: ${message}`);
    console.warn(formattedMessage.trim());
    try {
        await fs.appendFile(accessLogPath, formattedMessage);
    } catch (err) {
        console.error(`Failed to write to access log: ${err.message}`);
    }
}

/**
 * Log a DNS query
 */
async function dnsQuery(query, response) {
    const formattedMessage = formatLogMessage(`DNS QUERY: ${query} -> ${response}`);
    try {
        await fs.appendFile(dnsLogPath, formattedMessage);
    } catch (err) {
        console.error(`Failed to write to DNS log: ${err.message}`);
    }
}

module.exports = {
    info,
    error,
    warn,
    dnsQuery
};

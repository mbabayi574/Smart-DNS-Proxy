/**
 * Smart DNS Proxy - Main Application
 * 
 * This is the main entry point for the Smart DNS Proxy management interface.
 * It sets up an Express server that provides both a user interface and
 * API endpoints for managing the DNS proxy configuration.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const logger = require('./logger');
const config = require('./config');
const dnsconfig = require('./dnsconfig');

// Import routes
const indexRoutes = require('./routes/index');
const apiRoutes = require('./routes/api');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/', indexRoutes);
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server started on port ${PORT}`);
    
    // Initialize DNS configuration
    dnsconfig.initializeDNSConfig()
        .then(() => {
            logger.info('DNS configuration initialized successfully');
        })
        .catch(err => {
            logger.error(`Failed to initialize DNS configuration: ${err.message}`);
        });
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;

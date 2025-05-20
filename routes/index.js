/**
 * Index Routes for Smart DNS Proxy
 * 
 * Handles the web interface routes
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const logger = require('../logger');

/**
 * GET /
 * Render the main application interface
 */
router.get('/', (req, res) => {
    logger.info('Main interface accessed');
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { createToken } = require('../utils/token');
const logger = require('../utils/logger');

// Sunstone remote authentication endpoint
router.get('/sunstone', async (req, res) => {
  try {
    const remoteAuth = auth(req, 'remote');
    if (!remoteAuth.success) {
      return res.status(401).send('Unauthorized');
    }

    // Generate FireedgeToken
    const token = createToken(remoteAuth.userId, remoteAuth.username);

    // Set cookie with proper options
    res.cookie('FireedgeToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    logger.info(`Remote auth successful for user ${remoteAuth.username}`);
    return res.status(200).send('OK');
  } catch (error) {
    logger.error(`Remote auth error: ${error.message}`);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;

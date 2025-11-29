// OAuth Routes for Social Login
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { body, validationResult } = require('express-validator');

// @desc    Handle social login callback
// @route   POST /api/auth/social-login
// @access  Public
router.post('/social-login', [
  body('provider')
    .notEmpty().withMessage('Provider is required')
    .isIn(['google', 'facebook']).withMessage('Invalid provider'),
  body('user')
    .notEmpty().withMessage('User data is required'),
  body('token')
    .notEmpty().withMessage('Access token is required')
], authController.socialLogin);

// @desc    Get OAuth authorization URL
// @route   GET /api/auth/oauth/:provider
// @access  Public
router.get('/oauth/:provider', (req, res) => {
  const { provider } = req.params;
  const { OAUTH_CONFIG } = require('../../frontend/src/config/oauthConfig');
  
  try {
    const config = OAUTH_CONFIG[provider];
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported OAuth provider'
      });
    }
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Build authorization URL
    const params = new URLSearchParams({
      client_id: config.clientId || config.appId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: config.responseType,
      state: state
    });
    
    // Provider-specific parameters
    if (provider === 'google') {
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
    } else if (provider === 'facebook') {
      params.append('fields', config.fields);
    }
    
    const authUrl = `${config.authUrl}?${params.toString()}`;
    
    res.json({
      success: true,
      data: {
        authUrl,
        state
      }
    });
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate OAuth URL'
    });
  }
});

// @desc    Handle OAuth callback
// @route   GET /api/auth/oauth/:provider/callback
// @access  Public
router.get('/oauth/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(error)}`);
  }
  
  if (!code || !state) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=missing_parameters`);
  }
  
  try {
    // Redirect to frontend with OAuth parameters
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?provider=${provider}&code=${code}&state=${state}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_callback_failed`);
  }
});

// @desc    Exchange OAuth code for user info
// @route   POST /api/auth/oauth/:provider/exchange
// @access  Public
router.post('/oauth/:provider/exchange', [
  body('code')
    .notEmpty().withMessage('Authorization code is required'),
  body('state')
    .notEmpty().withMessage('State parameter is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }
    
    const { provider } = req.params;
    const { code, state } = req.body;
    
    // This would typically be handled by the frontend OAuth flow
    // For now, we'll just validate the parameters
    res.json({
      success: true,
      message: 'OAuth exchange endpoint ready',
      data: { provider, code, state }
    });
  } catch (error) {
    console.error('OAuth exchange error:', error);
    res.status(500).json({
      success: false,
      message: 'OAuth exchange failed'
    });
  }
});

module.exports = router;

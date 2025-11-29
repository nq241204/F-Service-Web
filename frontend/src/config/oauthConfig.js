// OAuth Configuration for Social Login
// Fix for Vite environment variables
const getEnvVar = (key) => {
  return import.meta.env[key];
};

export const OAUTH_CONFIG = {
  // Google OAuth Configuration
  google: {
    clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID') || 'your-google-client-id.apps.googleusercontent.com',
    redirectUri: getEnvVar('VITE_GOOGLE_REDIRECT_URI') || `${window.location.origin}/auth/google/callback`,
    scope: 'openid email profile',
    responseType: 'code',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
  },
  
  // Facebook OAuth Configuration
  facebook: {
    appId: getEnvVar('VITE_FACEBOOK_APP_ID') || 'your-facebook-app-id',
    redirectUri: getEnvVar('VITE_FACEBOOK_REDIRECT_URI') || `${window.location.origin}/auth/facebook/callback`,
    scope: 'email,public_profile',
    responseType: 'code',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me',
    fields: 'id,name,email,picture.type(large)'
  }
};

// Generate OAuth URL
export const generateOAuthUrl = (provider) => {
  const config = OAUTH_CONFIG[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
  
  try {
    const params = new URLSearchParams({
      client_id: config.clientId || config.appId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: config.responseType,
      state: generateState(),
      access_type: 'offline', // For Google
      prompt: 'consent' // For Google
    });
    
    // Facebook specific parameters
    if (provider === 'facebook') {
      params.append('fields', config.fields);
    }
    
    return `${config.authUrl}?${params.toString()}`;
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    throw new Error(`Failed to generate OAuth URL for ${provider}`);
  }
};

// Generate and store state for CSRF protection
export const generateState = () => {
  try {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state', state);
    return state;
  } catch (error) {
    console.error('State generation error:', error);
    return 'fallback-state-' + Date.now();
  }
};

// Verify state for CSRF protection
export const verifyState = (state) => {
  try {
    const storedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');
    return state === storedState;
  } catch (error) {
    console.error('State verification error:', error);
    return false;
  }
};

// Exchange authorization code for access token
export const exchangeCodeForToken = async (provider, code) => {
  const config = OAUTH_CONFIG[provider];
  
  try {
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId || config.appId,
        client_secret: getEnvVar('VITE_OAUTH_CLIENT_SECRET') || 'your-client-secret',
        code: code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Token exchange error:', error);
    throw error;
  }
};

// Get user info from OAuth provider
export const getUserInfo = async (provider, accessToken) => {
  const config = OAUTH_CONFIG[provider];
  
  try {
    const response = await fetch(`${config.userInfoUrl}?access_token=${accessToken}`);
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('User info error:', error);
    throw error;
  }
};

// Handle OAuth callback
export const handleOAuthCallback = async (provider, code, state) => {
  // Verify state for CSRF protection
  if (!verifyState(state)) {
    throw new Error('Invalid state parameter');
  }
  
  try {
    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(provider, code);
    
    // Get user info
    const userInfo = await getUserInfo(provider, tokenData.access_token);
    
    // Normalize user data
    const normalizedUser = normalizeUserData(provider, userInfo);
    
    return {
      user: normalizedUser,
      token: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in
    };
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw error;
  }
};

// Normalize user data from different providers
export const normalizeUserData = (provider, userData) => {
  try {
    switch (provider) {
      case 'google':
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          firstName: userData.given_name,
          lastName: userData.family_name,
          avatar: userData.picture,
          provider: 'google',
          verified: userData.verified_email || false
        };
        
      case 'facebook':
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          firstName: userData.first_name,
          lastName: userData.last_name,
          avatar: userData.picture?.data?.url,
          provider: 'facebook',
          verified: userData.verified || false
        };
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error('User data normalization error:', error);
    throw new Error(`Failed to normalize user data for ${provider}`);
  }
};

// Social login service
export const socialLoginService = {
  // Initiate social login
  initiateLogin: (provider) => {
    try {
      const authUrl = generateOAuthUrl(provider);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Social login initiation error:', error);
      throw new Error(`Không thể bắt đầu đăng nhập bằng ${provider}`);
    }
  },
  
  // Handle OAuth callback
  handleCallback: async (provider, code, state) => {
    try {
      const result = await handleOAuthCallback(provider, code, state);
      
      // Send user data to backend for authentication/registration
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider,
          user: result.user,
          token: result.token
        })
      });
      
      if (!response.ok) {
        throw new Error('Social login failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Social login error:', error);
      throw error;
    }
  }
};

export default OAUTH_CONFIG;

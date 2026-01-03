/**
 * Backend server for OAuth token exchange
 * 
 * IMPORTANT: This is a reference implementation that should be deployed
 * to your own secure server. Never expose your client secret in the plugin code!
 * 
 * Deployment options:
 * 1. Vercel/Netlify serverless functions
 * 2. AWS Lambda
 * 3. Google Cloud Functions
 * 4. Your own Express.js server
 * 
 * Required environment variables:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - ALLOWED_ORIGINS (comma-separated list of allowed origins)
 */

import https from 'https';

interface TokenExchangeRequest {
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

interface TokenRefreshRequest {
  refresh_token: string;
  client_id: string;
  client_secret: string;
}

/**
 * Exchange authorization code for tokens
 * POST /api/token/exchange
 */
export async function exchangeToken(req: any, res: any) {
  // CORS headers
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { code, client_id, client_secret, redirect_uri }: TokenExchangeRequest = req.body;

    // Validate client credentials against environment variables
    if (
      client_id !== process.env.GOOGLE_CLIENT_ID ||
      client_secret !== process.env.GOOGLE_CLIENT_SECRET
    ) {
      res.status(401).json({ error: 'Invalid client credentials' });
      return;
    }

    // Exchange code for tokens with Google
    const tokenData = await makeGoogleTokenRequest({
      code,
      client_id,
      client_secret,
      redirect_uri,
      grant_type: 'authorization_code',
    });

    // Return tokens to client
    res.status(200).json(tokenData);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ 
      error: 'Token exchange failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Refresh access token using refresh token
 * POST /api/token/refresh
 */
export async function refreshToken(req: any, res: any) {
  // CORS headers
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { refresh_token, client_id, client_secret }: TokenRefreshRequest = req.body;

    // Validate client credentials
    if (
      client_id !== process.env.GOOGLE_CLIENT_ID ||
      client_secret !== process.env.GOOGLE_CLIENT_SECRET
    ) {
      res.status(401).json({ error: 'Invalid client credentials' });
      return;
    }

    // Refresh token with Google
    const tokenData = await makeGoogleTokenRequest({
      refresh_token,
      client_id,
      client_secret,
      grant_type: 'refresh_token',
    });

    // Return new access token to client
    res.status(200).json(tokenData);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Token refresh failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Make request to Google's token endpoint
 */
function makeGoogleTokenRequest(params: Record<string, string>): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(params).toString();

    const options = {
      hostname: 'oauth2.googleapis.com',
      port: 443,
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Google API error: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Export handlers for serverless platforms
export default {
  exchangeToken,
  refreshToken,
};

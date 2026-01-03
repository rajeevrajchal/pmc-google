# OAuth Token Exchange Server

This directory contains the backend server implementation for secure OAuth token exchange. The client secret should **never** be exposed in the plugin code, so this server acts as a secure proxy for token operations.

## Why is this needed?

OAuth 2.0 authorization code flow requires a client secret to exchange authorization codes for tokens. For security:
- ✅ Client secret stays on your server
- ✅ Plugin never has access to client secret
- ✅ Tokens are securely exchanged through your backend

## Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Create `vercel.json`:
```json
{
  "functions": {
    "api/token/exchange.ts": {
      "runtime": "@vercel/node@3"
    },
    "api/token/refresh.ts": {
      "runtime": "@vercel/node@3"
    }
  },
  "env": {
    "GOOGLE_CLIENT_ID": "@google-client-id",
    "GOOGLE_CLIENT_SECRET": "@google-client-secret",
    "ALLOWED_ORIGINS": "app://obsidian.md,https://your-callback-domain.com"
  }
}
```

3. Create API endpoints:

`api/token/exchange.ts`:
```typescript
import { exchangeToken } from '../server/token-exchange-server';
export default exchangeToken;
```

`api/token/refresh.ts`:
```typescript
import { refreshToken } from '../server/token-exchange-server';
export default refreshToken;
```

4. Deploy:
```bash
vercel --prod
```

5. Add environment variables in Vercel dashboard

### Option 2: Netlify Functions

1. Create `.netlify/functions/exchange-token.ts`:
```typescript
import { Handler } from '@netlify/functions';
import { exchangeToken } from '../../server/token-exchange-server';

export const handler: Handler = async (event, context) => {
  const req = {
    method: event.httpMethod,
    headers: event.headers,
    body: JSON.parse(event.body || '{}'),
  };
  
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      return {
        statusCode: this.statusCode,
        headers: {
          ...this.headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      };
    },
    end() {
      return {
        statusCode: this.statusCode,
        headers: this.headers,
        body: '',
      };
    },
  };
  
  return await exchangeToken(req, res);
};
```

2. Similar for `refresh-token.ts`

3. Deploy:
```bash
netlify deploy --prod
```

### Option 3: AWS Lambda

1. Create Lambda functions for exchange and refresh
2. Set up API Gateway endpoints
3. Configure environment variables
4. Deploy using AWS CLI or console

### Option 4: Express.js Server

```typescript
import express from 'express';
import cors from 'cors';
import { exchangeToken, refreshToken } from './server/token-exchange-server';

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
}));
app.use(express.json());

app.post('/api/token/exchange', exchangeToken);
app.post('/api/token/refresh', refreshToken);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Environment Variables

Set these in your deployment platform:

- `GOOGLE_CLIENT_ID`: Your OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your OAuth client secret
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins (e.g., `app://obsidian.md,https://your-callback-url.com`)

## Update Plugin Configuration

After deploying, update these URLs in `src/components/tabs/google/types.ts`:

```typescript
export const GOOGLE_TOKEN_EXCHANGE_URL =
  "https://your-server.com/api/token/exchange";
  
export const GOOGLE_TOKEN_REFRESH_URL =
  "https://your-server.com/api/token/refresh";
```

## Testing

Test your endpoints:

```bash
# Test token exchange
curl -X POST https://your-server.com/api/token/exchange \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test-code",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "redirect_uri": "your-redirect-uri"
  }'

# Test token refresh
curl -X POST https://your-server.com/api/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "test-refresh-token",
    "client_id": "your-client-id",
    "client_secret": "your-client-secret"
  }'
```

## Security Best Practices

1. ✅ Never commit secrets to git
2. ✅ Use environment variables
3. ✅ Enable CORS only for trusted origins
4. ✅ Validate all inputs
5. ✅ Log errors but not sensitive data
6. ✅ Use HTTPS only
7. ✅ Rate limit requests
8. ✅ Monitor for suspicious activity

## Cost Considerations

- **Vercel**: Free tier includes 100GB bandwidth/month
- **Netlify**: Free tier includes 100GB bandwidth/month + 125k function invocations
- **AWS Lambda**: Free tier includes 1M requests/month
- **Self-hosted**: Variable costs based on your hosting

For a personal Obsidian plugin, free tiers should be sufficient.

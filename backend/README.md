# PMC Google Calendar Backend

Simple serverless backend for OAuth token exchange.

## Deploy to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd backend
vercel
```

3. Set environment variables in Vercel dashboard:
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret

4. Your backend URL will be: `https://your-project.vercel.app`

## Endpoints

- `POST /api/exchange` - Exchange authorization code for tokens
- `POST /api/refresh` - Refresh access token

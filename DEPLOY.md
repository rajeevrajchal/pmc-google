# Deploy Backend to Vercel

## Quick Start

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
cd backend
vercel
```

3. **Set Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Add these variables:
     - `GOOGLE_CLIENT_ID`: Your Web application Client ID
     - `GOOGLE_CLIENT_SECRET`: Your Web application Client Secret

4. **Update Plugin**:
   - Open `src/components/tabs/google/types.ts`
   - Update `BACKEND_URL` to your Vercel URL (e.g., `https://your-project.vercel.app`)

5. **Rebuild Plugin**:
```bash
pnpm run build
```

## Done!

Now your plugin will:
- ✅ Get refresh tokens that last months/years
- ✅ Automatically refresh tokens in background
- ✅ No manual reconnection needed
- ✅ Client secret stays secure on backend

# Deployment Configuration

## Vercel Environment Variables (Frontend)

Go to your Vercel project settings → Environment Variables and add:

```
NEXT_PUBLIC_API_URL=https://infinite-ttt-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://infinite-ttt-backend.onrender.com
```

**Important**: After adding these, redeploy your frontend for the changes to take effect.

## Render Environment Variables (Backend)

Your backend already has these configured (verified working):
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `REDIS_URL` - Redis connection string
- `WS_URL` - WebSocket URL (optional)

## Verification

After redeploying the frontend with the correct API URL:

1. The frontend will connect to the Render backend
2. Friends and Challenges providers will load successfully
3. The "Something Went Wrong" error should disappear

## Optional: Create Missing Pages

The following pages show 404 but are not critical:
- `/about` - About page
- `/terms` - Terms of Service
- `/privacy` - Privacy Policy

These can be created later if needed.

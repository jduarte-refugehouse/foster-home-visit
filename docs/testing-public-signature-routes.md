# Testing Public Signature Routes

The signature functionality uses public routes that bypass authentication. Here are several ways to test them:

## 1. Test Endpoint (Easiest)

Visit this URL in any browser (even when logged in):
```
https://your-app.vercel.app/api/public/test-signature-route
```

If you see a success message, public routes are working correctly.

## 2. Incognito/Private Browser Window

1. Open an incognito/private browser window
2. Navigate directly to a signature link:
   ```
   https://your-app.vercel.app/signature/[token]
   ```
3. This should work without requiring authentication

## 3. Test API Directly (curl/Postman)

### Test the public API endpoint:
```bash
# GET - Validate token
curl https://your-app.vercel.app/api/public/signature-tokens/[token]

# POST - Submit signature
curl -X POST https://your-app.vercel.app/api/public/signature-tokens/[token] \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "data:image/png;base64,...",
    "signerName": "Test User"
  }'
```

## 4. Local Testing

Run the app locally and test:
```bash
npm run dev
# Then visit http://localhost:3000/signature/[token]
```

## 5. Using Browser DevTools

1. Open browser DevTools (F12)
2. Go to Network tab
3. Navigate to the signature page
4. Check if requests to `/api/public/signature-tokens/` return 200 (not 401/403)

## Why This Works

- The signature page is **not** in the `(protected)` folder
- The API route is in `/api/public/` and has no authentication checks
- The middleware is passive and doesn't block these routes
- `ClerkProvider` only provides context - it doesn't block access

## Troubleshooting

If you're still being redirected to sign-in:
1. Check if you're accessing the correct URL (should be `/signature/[token]`, not `/protected/signature/...`)
2. Clear browser cookies for the domain
3. Try a different browser or incognito mode
4. Check Vercel logs for any middleware redirects


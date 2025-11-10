# Testing Public Signature Routes

The signature functionality uses public routes that bypass authentication. Here are several ways to test them:

## ⚠️ Important: Vercel Deployment Protection

If you're testing on a Vercel preview deployment, you may encounter **Vercel's deployment protection** (not application authentication). This is a Vercel feature that requires Vercel team authentication before accessing the site.

### Solutions:

1. **Disable Deployment Protection** (Recommended for testing):
   - Go to Vercel Dashboard → Your Project → Settings → Deployment Protection
   - Disable protection for preview deployments (or specific branches)
   - This allows external users to access signature links

2. **Test on Production Deployment**:
   - Production deployments typically don't have protection enabled
   - Use your production URL for testing signature links

3. **Test Locally**:
   - Run `npm run dev` locally
   - Access `http://localhost:3000/signature/[token]`
   - No Vercel authentication required

4. **Use Vercel Bypass Token** (if available):
   - Some Vercel plans allow bypass tokens
   - Check Vercel documentation for your plan

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

### Application Authentication Issues:
If you're being redirected to the application's sign-in page:
1. Check if you're accessing the correct URL (should be `/signature/[token]`, not `/protected/signature/...`)
2. Clear browser cookies for the domain
3. Try a different browser or incognito mode
4. Check Vercel logs for any middleware redirects

### Vercel Deployment Protection:
If you see a Vercel authentication screen (not the application sign-in):
1. **This is Vercel's deployment protection, not application auth**
2. Disable it in Vercel Dashboard → Settings → Deployment Protection
3. Or test on production deployment (usually not protected)
4. Or test locally with `npm run dev`

**Note**: For production use, you'll want deployment protection disabled (or configured to allow public access) so that foster parents can access signature links without Vercel authentication.


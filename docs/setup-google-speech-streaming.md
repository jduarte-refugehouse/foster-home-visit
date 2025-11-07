# Setting Up Google Cloud Speech-to-Text Streaming API

This guide walks you through setting up the service account for real-time speech transcription.

## Prerequisites

- Google Cloud account
- Project with billing enabled (same project as Google Maps API)

## Step-by-Step Setup

### 1. Enable the API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Library**
4. Search for "**Cloud Speech-to-Text API**"
5. Click **Enable**

### 2. Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **Service Account**
3. Enter details:
   - **Name**: `home-visit-speech-to-text`
   - **Description**: `Service account for real-time speech transcription`
4. Click **CREATE AND CONTINUE**

### 3. Grant Permissions

1. In "Grant this service account access to project":
   - Role: **Cloud Speech-to-Text API User** (or **Cloud Speech Client**)
2. Click **CONTINUE** → **DONE**

### 4. Generate JSON Key

1. Click on your new service account email
2. Go to **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON**
5. Click **CREATE**
6. Save the downloaded JSON file securely

⚠️ **SECURITY**: Never commit this file to Git! It contains sensitive credentials.

### 5. Configure Environment Variables

#### Local Development (.env.local)

Create or update `.env.local`:

```bash
# Option A: JSON content (recommended for Vercel)
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'

# Option B: File path (local only)
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account-key.json
```

#### Vercel Deployment

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value**: Paste the entire JSON file contents
   - **Environment**: Production, Preview, Development
3. Click **Save**
4. Redeploy your application

### 6. Test

After deployment:

1. Open your application
2. Go to a form with voice input
3. Click the microphone button
4. Speak a few sentences
5. You should see text appearing in real-time as you speak

### Troubleshooting

#### "No authentication configured" error

- Verify `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set in Vercel
- Check the JSON is valid (use a JSON validator)
- Ensure there are no extra quotes or escape characters

#### "Permission denied" error

- Verify the service account has "Cloud Speech Client" role
- Check that Speech-to-Text API is enabled in your project
- Ensure billing is enabled for the project

#### No transcription results

- Check server logs for authentication errors
- Verify audio format is supported (WebM Opus, MP3, MP4)
- Ensure microphone permissions are granted in browser

## Cost Estimate

Google Cloud Speech-to-Text pricing:
- **Standard model**: $0.006 per 15 seconds (~$1.44/hour)
- **Enhanced model**: $0.009 per 15 seconds (~$2.16/hour)

For clinical documentation with average 2-3 minute voice notes:
- ~200 voice entries/month = ~6 hours audio = **$8-12/month**

Free tier: 60 minutes/month

## Security Best Practices

1. ✅ Store credentials in environment variables (never in code)
2. ✅ Add `*service-account*.json` to `.gitignore`
3. ✅ Use separate service accounts for dev/prod
4. ✅ Rotate keys periodically
5. ✅ Limit service account permissions to Speech API only

## Next Steps

Once configured, the voice input will work like Google Docs:
- Real-time transcription as you speak
- Progressive refinement (text improves while speaking)
- Proper punctuation based on speech patterns
- Works on iPad Safari (your primary use case)


# Google Cloud Speech-to-Text API Setup Guide

## Prerequisites
- Google account
- Google Cloud project with billing enabled
- Speech-to-Text API enabled
- API key created

## Environment Variable

Add the following to your environment variables (`.env.local` for local development, or your hosting platform's environment variables):

```bash
GOOGLE_CLOUD_SPEECH_API_KEY=your-api-key-here
```

## For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Name**: `GOOGLE_CLOUD_SPEECH_API_KEY`
   - **Value**: Your Google Cloud API key
   - **Environment**: Production, Preview, Development (as needed)
4. Click "Save"
5. Redeploy your application

## For Local Development

Create a `.env.local` file in the project root (if it doesn't exist):

```bash
GOOGLE_CLOUD_SPEECH_API_KEY=your-api-key-here
```

**Important**: Add `.env.local` to `.gitignore` to prevent committing your API key.

## API Key Security Best Practices

1. **Restrict the API key** in Google Cloud Console:
   - Application restrictions: HTTP referrers (your domain)
   - API restrictions: Only Cloud Speech-to-Text API

2. **Never commit** the API key to git

3. **Use environment variables** - never hardcode in source code

4. **Rotate keys** if they're accidentally exposed

## Pricing

- **Free Tier**: 60 minutes of audio transcription per month
- **After Free Tier**: ~$0.036 per minute (video model)
- **Standard Model**: ~$0.006 per 15 seconds

See: https://cloud.google.com/speech-to-text/pricing

## Features Enabled

When using Google Cloud Speech-to-Text:
- ✅ Automatic punctuation based on pauses
- ✅ Spoken punctuation recognition
- ✅ Better accuracy than Web Speech API
- ✅ No truncation issues
- ✅ Handles long transcripts



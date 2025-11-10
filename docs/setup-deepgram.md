# Setting Up Deepgram Real-Time Speech-to-Text

Deepgram provides industry-leading real-time speech recognition, specifically designed for browser streaming.

## Why Deepgram?

- ✅ **Real-time**: ~200ms latency (like Google Docs)
- ✅ **Reliable**: Purpose-built for WebSocket streaming
- ✅ **Works on iPad**: Native Safari support
- ✅ **Better accuracy**: Nova-2 model outperforms Google
- ✅ **Simpler**: No service account, just API key
- ✅ **Lower cost**: $0.0043 per minute vs Google's $0.024/min

## Quick Setup (5 minutes)

### 1. Create Deepgram Account

1. Go to [Deepgram Console](https://console.deepgram.com/)
2. Sign up (free $200 credit, no credit card required)
3. Verify your email

### 2. Get API Key

1. In Deepgram Console, go to **API Keys**
2. Click **Create New Key**
3. Name it: `home-visit-transcription`
4. Copy the API key (starts with `dpk_...`)

⚠️ **Save this key securely - you won't be able to see it again!**

### 3. Add to Environment Variables

#### Local Development (.env.local)

```bash
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

#### Vercel Deployment

1. Go to Vercel → Your Project → **Settings** → **Environment Variables**
2. Add:
   - **Name**: `DEEPGRAM_API_KEY`
   - **Value**: `dpk_...your key...`
   - **Environment**: Production, Preview, Development
3. Click **Save**
4. **Redeploy** your application

### 4. Test

1. Open your application
2. Go to a form with voice input
3. Click the microphone button
4. Speak - you should see text appearing **in real-time** as you speak!

## Features

### Real-Time Transcription
- Text appears as you speak (~200ms latency)
- Progressive refinement (interim results improve while speaking)
- Proper punctuation based on speech patterns
- Works like Google Docs voice typing

### Optimized for Clinical Use
- **Nova-2 model**: Best accuracy for medical/clinical language
- **Smart formatting**: Automatic capitalization and punctuation
- **Endpointing**: Detects natural sentence breaks
- **Works offline-first**: Reliable on iPad in the field

## Cost Estimate

**Deepgram Pricing**: $0.0043 per minute (~$0.26/hour)

**For your use case** (clinical documentation, 2-3 minute notes):
- ~200 voice entries/month = ~6 hours
- **Cost: ~$1.56/month**

**Free tier**: $200 credit = ~46,500 minutes = **775 hours** of transcription

## Comparison: Deepgram vs Google

| Feature | Deepgram | Google Streaming |
|---------|----------|------------------|
| **Real-time** | ✅ ~200ms | ✅ ~500ms |
| **Works on iPad** | ✅ Native | ⚠️ Spotty |
| **Setup** | ✅ Just API key | ❌ Service account + IAM |
| **Accuracy** | ✅ 95%+ | ✅ 94%+ |
| **Cost** | ✅ $0.0043/min | ❌ $0.024/min |
| **Reliability** | ✅ Purpose-built | ⚠️ Complex setup |

## Troubleshooting

### "Failed to get Deepgram API key"
- Verify `DEEPGRAM_API_KEY` is set in Vercel
- Check the key starts with `dpk_`
- Ensure you redeployed after adding the env var

### "Connection error"
- Check browser console for WebSocket errors
- Verify microphone permissions are granted
- Try refreshing the page

### No transcription appearing
- Check Deepgram Console → Usage to see if requests are coming through
- Verify API key has not expired
- Check browser console for error messages

## Security

- ✅ API key is stored server-side only
- ✅ Temporary keys generated for browser use
- ✅ Audio is not stored by Deepgram (unless you enable it)
- ✅ HIPAA-compliant tier available if needed

## Next Steps

Once configured, voice input will work like Google Docs:
- Click microphone → speak → see text appear in real-time
- Perfect for clinical documentation on iPad
- Fast, accurate, and reliable


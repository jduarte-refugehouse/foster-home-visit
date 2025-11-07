# Google Streaming Speech-to-Text API - Implementation Blockers

## What We Tried

We attempted to implement Google's Streaming Speech-to-Text API for real-time transcription.

## Current Status: **BLOCKED**

### What Works
- ✅ Service account authentication
- ✅ Speech client creation  
- ✅ Audio capture from browser
- ✅ Sending audio to Google with proper request format

### What Doesn't Work
- ❌ **Google returns ZERO transcription results**
- ❌ No interim results
- ❌ No final results  
- ❌ No error messages

### Evidence from Logs
```
✅ [STREAMING] Speech client created successfully
✍️ [STREAMING] Wrote audio chunk to Google: 65536 bytes
🏁 [STREAMING] Ending recognition stream
```

**MISSING**: `📨 [STREAMING] Received data from Google`

### Possible Causes

1. **WebM/Opus Format Issue**
   - Despite docs saying WEBM_OPUS is supported
   - Node.js gRPC client may not properly handle WebM containers
   - Browser's MediaRecorder produces WebM with Opus codec
   
2. **Service Account Permissions**
   - Role: "Cloud Speech-to-Text Service Agent"
   - May need additional IAM permissions for streaming
   
3. **API Configuration**
   - `singleUtterance: false` may not work as expected
   - `useEnhanced: true` may require different billing tier
   - Model `'default'` may not support streaming properly

4. **gRPC vs REST**
   - Node.js client uses gRPC
   - Our setup (Vercel serverless) may not be compatible with long-lived gRPC streams
   - Vercel functions have 10-second timeout for hobby tier

## Recommendation

**Use synchronous API (`speech:recognize`) with optimizations:**

### Advantages
- ✅ Known to work (we used it successfully before)
- ✅ Works with WebM/Opus
- ✅ Works with API key (no service account needed)
- ✅ Compatible with serverless (no long-lived connections)
- ✅ Simpler error handling

### Optimizations for Better UX
1. Send audio every 3-5 seconds for pseudo-real-time updates
2. Accumulate transcripts on client side
3. Show "processing..." indicators
4. Final transcript when user stops recording

### Cost Comparison
- Streaming: $0.006 per 15 seconds
- Synchronous: $0.006 per 15 seconds  
*Same cost, synchronous is just more reliable*

## Next Steps

1. Revert to synchronous API approach
2. Optimize chunking for faster updates (3-5 second chunks)
3. Improve UI feedback during processing
4. Test on iPad Safari (primary use case)

## If We Want to Retry Streaming Later

Would need to investigate:
1. Converting WebM to LINEAR16 PCM in browser before sending
2. Using different Google Cloud project with enhanced permissions
3. Testing with self-hosted Node.js server (not serverless)
4. Contacting Google Cloud support for WebM streaming guidance


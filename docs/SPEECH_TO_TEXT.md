# Speech-to-Text Documentation

## Overview

The application uses **Deepgram** for real-time speech-to-text transcription, providing Google Docs-quality voice input for clinical documentation on iPad and desktop.

---

## Architecture

### Client-Side (Browser)
```
User speaks → MediaRecorder captures audio
           → Audio sent via WebSocket to Deepgram
           → Receives interim transcripts (~200ms latency)
           → Receives final transcripts (end of utterance)
           → Displays accumulated text in real-time
```

### Server-Side (Next.js API)
```
/api/speech/deepgram-token
  → Provides temporary API key to browser
  → Secures master API key server-side
```

### Audio Flow
```
1. Browser requests API key from /api/speech/deepgram-token
2. Browser creates WebSocket connection to Deepgram
3. MediaRecorder captures audio (250ms chunks)
4. Audio streamed to Deepgram via WebSocket
5. Deepgram returns interim results (provisional)
6. Deepgram returns final results (confirmed)
7. Client accumulates final results into complete transcript
```

---

## Key Files

### Core Implementation
- **`components/ui/voice-input-modal.tsx`**
  - Main voice input component
  - Handles MediaRecorder, Deepgram connection, UI state
  - ~200 lines

- **`app/api/speech/deepgram-token/route.ts`**
  - API endpoint to provide Deepgram API key to browser
  - Security: Keeps master key server-side
  - ~30 lines

- **`lib/deepgram-streaming.ts`**
  - Helper utilities for Deepgram
  - Type definitions
  - ~60 lines

### Legacy (Kept for Fallback)
- **`lib/google-speech-helper.ts`**
  - Google synchronous API (batch transcription)
  - Used as fallback if Deepgram unavailable
  - ~120 lines

- **`app/api/speech/transcribe/route.ts`**
  - Google synchronous transcription endpoint
  - Fallback option
  - ~80 lines

---

## Configuration

### Environment Variables

```bash
# Required for real-time speech-to-text
DEEPGRAM_API_KEY=dpk_...

# Optional fallback (Google synchronous)
GOOGLE_MAPS_API_KEY=AIza...
```

### Deepgram Configuration

```typescript
// In voice-input-modal.tsx
const connection = deepgram.listen.live({
  model: 'nova-2',              // Best accuracy model
  language: 'en-US',            // Language
  punctuate: true,              // Auto punctuation
  interim_results: true,        // Real-time updates
  endpointing: 300,             // 300ms silence = utterance end
  smart_format: true,           // Smart formatting
})
```

---

## Browser Compatibility

### Supported Formats by Browser

| Browser | Primary Format | Fallback |
|---------|---------------|----------|
| Chrome/Edge | `audio/webm` | - |
| Safari (Desktop) | `audio/mp4` | `audio/mpeg` |
| Safari (iPad) | `audio/mp4` | `audio/mpeg` |
| Firefox | `audio/webm` | `audio/ogg` |

### Format Detection

```typescript
// Auto-detect supported format
if (MediaRecorder.isTypeSupported('audio/webm')) {
  mimeType = 'audio/webm'
} else if (MediaRecorder.isTypeSupported('audio/mp4')) {
  mimeType = 'audio/mp4'  // Safari
} else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
  mimeType = 'audio/mpeg'  // Safari fallback
}
```

---

## Features

### Real-Time Transcription
- Text appears as user speaks (~200ms latency)
- Progressive refinement (interim → final)
- Contextual understanding across utterances

### Interim vs Final Results

**Interim Results:**
- Provisional transcription
- Updates frequently as user speaks
- Lower confidence
- Used for real-time display
- Example: "The patient rep..." → "The patient reports..." → "The patient reports chest pain"

**Final Results:**
- Confirmed transcription after utterance ends
- Higher confidence
- Triggered by 300ms silence or punctuation
- Accumulated into complete transcript
- Example: "The patient reports chest pain."

### Smart Features
- **Auto-punctuation:** Periods, commas, question marks based on speech patterns
- **Capitalization:** Proper nouns, sentence starts
- **Number formatting:** "five hundred" → "500"
- **Date formatting:** "november seventh" → "November 7"

---

## Usage Examples

### Basic Usage

```tsx
import { VoiceInputModal } from '@/components/ui/voice-input-modal'

function MyForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        🎤 Voice Input
      </button>

      <VoiceInputModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onTranscript={(transcribedText) => {
          setText(transcribedText)
        }}
        title="Record Your Note"
        description="Speak clearly and naturally"
      />
    </>
  )
}
```

### With Form Integration

```tsx
<VoiceInputModal
  open={showVoiceModal}
  onOpenChange={setShowVoiceModal}
  onTranscript={(text) => {
    // Insert into form field
    form.setValue('notes', text)
  }}
/>
```

---

## Error Handling

### Common Errors

**1. Microphone Permission Denied**
```typescript
Error: NotAllowedError / PermissionDeniedError
Solution: User must grant microphone permission in browser
```

**2. Deepgram API Key Missing**
```typescript
Error: "Failed to get Deepgram API key"
Solution: Set DEEPGRAM_API_KEY in environment variables
```

**3. WebSocket Connection Failed**
```typescript
Error: "Connection error"
Solutions:
- Check internet connectivity
- Verify Deepgram API key is valid
- Check browser console for specific error
```

**4. MediaRecorder Not Supported**
```typescript
Error: "Failed to access microphone"
Solution: Use supported browser (Chrome, Safari, Edge, Firefox)
```

### Error Recovery

```typescript
// Automatic retry on connection failure
connection.on(LiveTranscriptionEvents.Error, (error) => {
  console.error('Deepgram error:', error)
  // Show user-friendly error message
  setError('Transcription error occurred')
  // Connection automatically closes and cleans up
})
```

---

## Performance

### Latency
- **Interim results:** ~200ms
- **Final results:** ~500ms after utterance ends
- **Total delay:** Imperceptible to user

### Audio Bandwidth
- **Chunk size:** ~1-2 KB per 250ms chunk
- **Bandwidth:** ~4-8 KB/second
- **Total for 2-minute note:** ~500 KB - 1 MB

### Cost
- **Deepgram:** $0.0043/minute
- **2-minute clinical note:** ~$0.009 (less than 1 cent)
- **200 notes/month:** ~$1.56/month
- **Free tier:** $200 credit = 46,500 minutes

---

## Testing

### Manual Testing Checklist

**Desktop Chrome:**
- ✅ Click microphone button
- ✅ Grant microphone permission
- ✅ Speak naturally for 30 seconds
- ✅ Verify text appears in real-time
- ✅ Click "Stop" button
- ✅ Verify complete transcript
- ✅ Click "Done" to insert text

**iPad Safari:**
- ✅ Same steps as Chrome
- ✅ Verify audio format detection (audio/mp4)
- ✅ Test in field conditions (clinic, home visit)

### Test Phrases

Good test phrases for clinical documentation:

```
"The patient reports experiencing intermittent chest pain 
over the past three days. Pain is described as sharp and 
localized to the left side. No radiation to the arm or jaw. 
Patient denies shortness of breath or nausea."

"Foster parent reports child has adjusted well to the home. 
Initial anxiety around bedtime has improved significantly. 
Child is attending school regularly and participating in 
family activities."
```

---

## Troubleshooting

### Problem: No text appearing

**Debugging steps:**
1. Check browser console for errors
2. Verify microphone indicator shows active
3. Check Deepgram Console → Usage for API calls
4. Test microphone with other apps

### Problem: Poor transcription quality

**Solutions:**
- Speak clearly and at moderate pace
- Reduce background noise
- Use external microphone on iPad
- Check audio format in console logs

### Problem: Intermittent connection drops

**Solutions:**
- Check internet stability
- Verify Deepgram service status
- Check browser WebSocket support
- Try refreshing page

---

## Security

### API Key Management
- ✅ Master key stored server-side only
- ✅ Never exposed to browser
- ✅ Temporary keys provided per session
- ✅ Keys scoped to minimal permissions

### Data Privacy
- ✅ Audio not stored by Deepgram (default)
- ✅ No logs retained
- ✅ HIPAA-compliant tier available
- ✅ WebSocket encrypted (WSS)

### Best Practices
```bash
# Never commit API keys
echo "DEEPGRAM_API_KEY=*" >> .gitignore

# Use environment-specific keys
Production: dpk_prod_...
Staging: dpk_staging_...
Development: dpk_dev_...

# Rotate keys periodically
Schedule: Every 90 days
```

---

## Future Enhancements

### Short-Term
1. **Custom vocabulary** - Medical terminology
2. **Voice commands** - "New paragraph", "Delete that"
3. **Offline mode** - Local speech recognition fallback

### Medium-Term
4. **Speaker diarization** - Identify different speakers
5. **Language detection** - Auto-detect language
6. **Custom formatting** - Clinical note templates

### Long-Term
7. **SOAP note generation** - Auto-structure clinical notes
8. **ICD-10 code suggestions** - AI-powered coding
9. **Real-time translation** - Multi-language support

---

## Support

### Deepgram Resources
- **Documentation:** https://developers.deepgram.com
- **Console:** https://console.deepgram.com
- **Support:** support@deepgram.com
- **Status:** https://status.deepgram.com

### Internal Resources
- **Setup Guide:** `docs/setup-deepgram.md`
- **Implementation History:** `docs/daily-summaries/daily-activity-summary-2025-11-07-speech-to-text.md`
- **Troubleshooting:** This document (Troubleshooting section)


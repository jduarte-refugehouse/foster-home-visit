# How to View Browser Console on iPad Safari

## Method 1: Using Safari Web Inspector (Recommended)

### Prerequisites:
- iPad connected to a Mac via USB cable
- Safari enabled on both devices
- Developer menu enabled on Mac Safari

### Steps:

1. **On your Mac:**
   - Open Safari
   - Go to Safari → Settings → Advanced
   - Check "Show Develop menu in menu bar"

2. **On your iPad:**
   - Go to Settings → Safari → Advanced
   - Enable "Web Inspector"

3. **Connect iPad to Mac:**
   - Connect iPad to Mac via USB cable
   - Trust the computer if prompted

4. **Open Web Inspector:**
   - On your Mac, open Safari
   - Go to Develop menu → [Your iPad Name] → [Website Name]
   - This opens Web Inspector showing the iPad's Safari console

5. **View Console:**
   - In Web Inspector, click the "Console" tab
   - You'll see all console.log, console.error, etc. messages
   - Look for messages starting with 🎤 (microphone emoji) for voice input debugging

## Method 2: Using Remote Debugging (Wireless)

1. **Enable on iPad:**
   - Settings → Safari → Advanced → Web Inspector (ON)

2. **On Mac Safari:**
   - Develop menu → [Your iPad Name] → [Website Name]
   - Note: Both devices must be on the same Wi-Fi network

## Method 3: Using Eruda Console (Temporary Debug Tool)

If you can't use Web Inspector, you can temporarily add a console viewer to the page:

1. Add this to your page temporarily:
```javascript
// Add to page temporarily for debugging
const script = document.createElement('script')
script.src = 'https://cdn.jsdelivr.net/npm/eruda'
document.body.appendChild(script)
script.onload = () => {
  eruda.init()
}
```

2. This adds a floating console button on the page
3. Tap it to see console messages directly on iPad
4. **Remove this before production!**

## Debugging Voice Input Issues

When debugging voice input on iPad, look for these console messages:

- `🎤 Speech recognition started` - Recognition started successfully
- `🎤 Recognition result received` - Speech was detected
- `❌ Speech recognition error` - An error occurred
- `🎤 Speech recognition ended` - Recognition stopped (normal or unexpected)

Common iPad Safari issues:
- Recognition ends immediately → Check for permission issues
- No speech detected → Check microphone permissions
- Aborted errors → Usually normal, can be ignored


# Enabling Location Permissions on iPhone/iPad

This guide explains how to enable location permissions for the foster home visit application on iPhone/iPad devices.

## Why Location Permissions Are Needed

The app uses location services to:
- Capture your starting location when you click "Start Drive"
- Capture your arrival location when you click "Arrived"
- Calculate accurate mileage for reimbursement
- Track travel legs for continuum logging

## Step-by-Step Instructions

### Method 1: Enable Location Services in Safari Settings

1. **Open iPhone/iPad Settings**
   - Tap the Settings app on your home screen

2. **Go to Privacy & Security**
   - Scroll down and tap "Privacy & Security"

3. **Tap Location Services**
   - Make sure "Location Services" is turned ON (green toggle at the top)

4. **Find Safari Websites**
   - Scroll down to find "Safari Websites" (under "System Services" section)

5. **Enable Location Access**
   - Tap "Safari Websites"
   - Make sure "Ask" or "Allow" is selected
   - If you see your app's website listed, tap it and select "Allow"

### Method 2: Enable Location When Prompted in Safari

When you first use a location feature in the app:

1. **Open the app in Safari** (not Chrome or other browsers - Safari is required for iOS)

2. **Click "Start Drive" or "Arrived" button**

3. **Safari will show a permission prompt** at the top of the screen:
   - Tap "Allow" when prompted
   - The prompt will say something like: "v0-home-visits-application.vercel.app" would like to use your current location

4. **If you accidentally denied it:**
   - See Method 1 above to change it in Settings

### Method 3: Reset Location Permissions for the Website

If location isn't working:

1. **Open Safari Settings**
   - Go to Settings → Safari

2. **Clear Website Data**
   - Scroll down and tap "Clear History and Website Data"
   - This will reset all website permissions (you'll need to log in again)

3. **Or Reset Just This Website:**
   - Go to Settings → Safari → Advanced → Website Data
   - Search for your app's domain (e.g., "vercel.app")
   - Swipe left and tap "Delete" to remove just this site's data

4. **Reopen the app** and allow location when prompted

## Troubleshooting

### Location Permission Denied Error

**Symptoms:**
- Error message: "Location permission denied. Please enable location access in your browser settings."
- Button doesn't capture location

**Solution:**
1. Go to Settings → Privacy & Security → Location Services → Safari Websites
2. Find your app's website
3. Change from "Deny" to "Ask" or "Allow"

### Location Information Unavailable Error

**Symptoms:**
- Error message: "Location information is unavailable. Please check your device's location settings."

**Solutions:**
1. Make sure Location Services is ON: Settings → Privacy & Security → Location Services
2. Make sure you're outside or near a window (GPS needs satellite signal)
3. Check if Airplane Mode is OFF
4. Make sure Wi-Fi or Cellular data is ON

### Location Request Timed Out

**Symptoms:**
- Error message: "Location request timed out. Please try again."

**Solutions:**
1. Make sure you have a clear view of the sky (GPS needs satellite signal)
2. Try moving to a different location
3. Make sure Wi-Fi or Cellular data is ON
4. Wait a moment and try again

### Using Chrome or Other Browsers

**Important:** On iOS, only Safari supports the full Geolocation API with proper permissions. Other browsers (Chrome, Firefox, etc.) may not work correctly.

**Solution:** Always use Safari on iPhone/iPad for the best experience.

## Testing Location Permissions

To test if location is working:

1. Open the app in Safari
2. Navigate to an appointment detail page
3. Click "Start Drive" button
4. You should see:
   - A brief "Capturing location..." message
   - Then "Drive Started" success message
   - The button should change to show "Arrived" or "Stop Drive"

## Best Practices

1. **Always use Safari** on iOS devices (not Chrome or other browsers)
2. **Allow location when first prompted** - it's easier than changing it later
3. **Keep Location Services ON** in device settings
4. **Use outdoors or near windows** for better GPS accuracy
5. **Wait a few seconds** after clicking location buttons - GPS can take 5-10 seconds

## Privacy Note

The app only captures your location when you explicitly click "Start Drive" or "Arrived" buttons. It does not track your location continuously. Location data is stored securely and only used for mileage calculation and travel tracking purposes.


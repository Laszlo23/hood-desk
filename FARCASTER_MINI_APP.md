# Farcaster Mini App Setup Guide

This document explains how doghood.aibusiness.fun was transformed into a Farcaster mini app and what remains to be done.

## What was changed

### 1. Added Farcaster SDK
- **Package**: `@farcaster/miniapp-sdk` (v0.3.0)
- **Init**: `src/lib/farcaster.ts` - wrapper that initializes SDK and calls `ready()` only when in mini app
- **Integration**: `src/main.tsx` - initializes SDK on mount
- **Detection**: Uses `await sdk.isInMiniApp()` to properly detect Farcaster context (not Promise checks)

### 2. Updated Farcaster manifest
File: `public/.well-known/farcaster.json`

Key changes:
- **name**: "Hood Street" (focuses on the game, not the desk)
- **homeUrl**: `/#/street` (opens directly to Hood Street)
- **buttonTitle**: "Check in" (action-oriented)
- **category**: "social" (was "finance")
- **description**: Honest description of the check-in game
- **imageUrl**: Uses `og-street.jpg` (already exists)

### 3. Made Street the mini app home
- `src/App.tsx` detects Farcaster context via SDK
- Routes to `/#/street` automatically when opened in Farcaster
- Landing page is bypassed for mini app users

### 4. Show real server errors
- `src/pages/Street.tsx` now captures and displays actual error messages
- **"You already checked in today."** is shown when server refuses (not generic failure)
- Gate is enforced in `server/nightDesk.js` line 318

### 5. Added share functionality
- Share button appears after check-in (only in Farcaster context)
- Opens Warpcast composer with real stats (streak, points, rank)
- No fake data in cast content

## What still needs to be done

### 🔴 Critical: Fix frame headers (server-side, NOT in this repo)

Current headers block framing:
```
X-Frame-Options: DENY
Content-Security-Policy: frame-ancestors 'none'
```

**Where to fix this:**
- If using Caddy: Update `Caddyfile`
- If using nginx: Update `nginx.conf` or site config
- If using Vercel/Netlify: Update `headers` file or `vercel.json`/`netlify.toml`

**Recommended CSP for Farcaster:**
```
Content-Security-Policy: frame-ancestors https://warpcast.com https://*.farcaster.xyz https://*.frames.sh 'self'
```

Remove or don't send `X-Frame-Options: DENY`.

### 🔴 Critical: Sign accountAssociation

File: `public/.well-known/farcaster.json`

Current state:
```json
"accountAssociation": {
  "header": "",
  "payload": "",
  "signature": ""
}
```

**Who can do this:** Only @0xleonardo (FID 873944)

**How to sign:**
1. Go to https://warpcast.com/~/developers/mini-apps
2. Add domain: `doghood.aibusiness.fun`
3. Use FID: `873944`
4. Copy the three signed fields
5. Paste into `farcaster.json` and commit

**Do not:**
- Guess or invent these values
- Use a placeholder signature
- Skip this step (mini app won't verify without it)

## Testing locally

### 1. Install dependencies
```bash
npm install
```

### 2. Start dev server
```bash
npm run dev
```

### 3. Start backend (if testing check-ins)
```bash
npm run server:install  # first time only
npm run server
```

### 4. Open in browser
- Visit http://localhost:5182/#/street
- The app should detect it's NOT in Farcaster context
- Check-in and share buttons should work
- Share button will not appear (only shows in Farcaster)

### 5. Simulate Farcaster context
The SDK detects Farcaster context automatically. To test the detection logic:
- Check `src/lib/farcaster.ts` - `isFarcasterContext()` function
- When SDK has a real context, it returns true
- Locally it will return false (normal browser, not a frame)

## Testing in production (after deployment + server headers fix)

### 1. Test framing
Try to embed the site in an iframe:
```html
<iframe src="https://doghood.aibusiness.fun/#/street"></iframe>
```

**Expected:**
- ✅ Loads without X-Frame-Options error
- ✅ No CSP violation in browser console

**If it fails:**
- ❌ Check server headers (Caddy/nginx config)
- ❌ Verify CSP allows frame-ancestors

### 2. Test in Warpcast
1. Open https://warpcast.com
2. Go to Mini Apps directory (or share the link)
3. Open doghood.aibusiness.fun

**Expected:**
- ✅ Splash screen appears (from manifest)
- ✅ Splash dismisses after SDK `ready()` call
- ✅ App opens to Hood Street (`/#/street`)
- ✅ Can connect wallet and check in
- ✅ Real error message shows on duplicate check-in
- ✅ Share button appears after check-in

**If splash doesn't dismiss:**
- Check browser console for SDK errors
- Verify `initFarcasterSDK()` is called in `main.tsx`
- Check that `ready()` is called in `farcaster.ts`

### 3. Test the game loop
1. Connect wallet
2. Check in (should succeed first time)
3. Try to check in again immediately
   - **Expected**: "You already checked in today."
4. Check streak counter (local storage)
5. Tip a neighbor (if any on board)
6. Dig with a neighbor (if pot has funds)
7. Click Share
   - **Expected**: Opens Warpcast compose with real stats

## Architecture notes

### Farcaster SDK wrapper
`src/lib/farcaster.ts` provides:
- `initFarcasterSDK()` - Call once on mount, only calls `ready()` when in mini app
- `isFarcasterContext()` - Async function that returns true when in Farcaster (uses `await sdk.isInMiniApp()`)
- `sdk` - Direct access to SDK instance

**Important**: `sdk.isInMiniApp()` is the correct detection method. Do NOT use `sdk.context !== null` (context is a Promise, never null).

### Routing logic
`src/App.tsx`:
- Calls `isFarcasterContext()` (async) on mount
- If true AND route is `landing`, redirect to `street`
- Normal browser visits stay on landing page
- Regular navigation works normally

### Street component
`src/pages/Street.tsx`:
- Shows check-in button (always)
- Shows share button (only after check-in, only in Farcaster)
- Displays real server errors (not generic messages)
- Uses `sdk.actions.composeCast()` to create casts with the mini app

### Server gate
`server/nightDesk.js` line 318:
```javascript
if (alreadyCheckedIn) {
  return { error: 'You already checked in today.' }
}
```

This error now reaches the UI and is shown to the user.

## Troubleshooting

### SDK not initializing
**Symptom**: Splash screen doesn't dismiss
**Fix**: Check that `initFarcasterSDK()` is called in `main.tsx` `useEffect`

### Wrong route on normal browser
**Symptom**: Browser visits go to `/#/street` instead of landing
**Fix**: This was a bug in the original implementation. The fixed version uses `await sdk.isInMiniApp()` which returns false in browsers.

### Headers still blocking
**Symptom**: "Refused to frame" error in console
**Fix**: Update server config (Caddy/nginx/hosting platform)

### accountAssociation invalid
**Symptom**: Farcaster shows "Domain not verified"
**Fix**: Sign with correct FID (873944) using official tool

### Check-in not working
**Symptom**: Button does nothing or shows generic error
**Fix**: 
- Check that backend is running (`npm run server`)
- Verify API endpoint `/api/night` is reachable
- Check browser console for fetch errors

### Share button not showing
**Expected**: Only shows in Farcaster context after check-in
**Fix**: 
- If in browser: Normal behavior (not Farcaster)
- If in Warpcast and missing: Check `isFarcasterContext()` returns true

## Files changed in this PR

```
package.json                        # Added @farcaster/frame-sdk
package-lock.json                   # Lockfile update
public/.well-known/farcaster.json   # Updated manifest
src/lib/farcaster.ts                # NEW - SDK wrapper
src/main.tsx                        # Initialize SDK on mount
src/App.tsx                         # Route to street in Farcaster
src/pages/Street.tsx                # Show real errors, add share
src/pages/street.css                # Share button styles
```

## Next steps

1. **Merge this PR** ✅ (code changes complete)
2. **Fix server headers** ⚠️ (NOT in this repo)
3. **Sign accountAssociation** ⚠️ (only @0xleonardo can do this)

After all three, doghood.aibusiness.fun will be a real, working Farcaster mini app.

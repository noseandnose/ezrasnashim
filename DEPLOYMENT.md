# Deployment Guide

## PWA Cache Version Update

When you deploy a new version of the app, you need to update the service worker's cache version so users get the latest changes.

### Option 1: Automatic via Admin Endpoint (Recommended)

After deploying to production, make a POST request to regenerate the cache version:

```bash
curl -X POST https://your-app-url.com/api/regenerate-cache-version \
  -H "Authorization: Bearer YOUR_ADMIN_PASSWORD"
```

This will:
- Update `server/version.json` with new timestamp
- Update `client/public/sw.js` with new CACHE_VERSION
- Return confirmation with the new version number

Users will receive an update prompt within minutes of opening the app.

### Option 2: Manual Script Execution

Run the version generation script manually before deploying:

```bash
node scripts/generate-version.js
```

Then commit and push the updated `sw.js` and `version.json` files.

### How Update Distribution Works

1. **On deployment**: Server starts with new timestamp
2. **User opens app**: Version check runs immediately (new in this update)
3. **Version mismatch detected**: Update banner appears
4. **User clicks "Refresh"**: All caches cleared, new version loads
5. **Service worker updates**: New SW downloaded and activated

### Update Flow Timeline

- **Without cache regeneration**: Users may stay on old version indefinitely
- **With cache regeneration**: Users see update prompt within 1-5 minutes of app focus
- **Critical updates**: Auto-refresh after 5-minute countdown

### Environment Variables for Critical Updates

Set these when deploying urgent fixes:

```bash
CRITICAL_UPDATE=true
RELEASE_NOTES="Updated prayer times to show correct midnight for Maariv. Your app will refresh in a few minutes to ensure you have the most accurate zmanim."
```

**In Replit:** Add these as Secrets in your environment settings, then restart the server.

This will:
- Show friendly purple/pink update banner with sparkles ✨
- Display "Important Update Available" (warm and friendly)
- Auto-refresh after 5-minute countdown
- Prevent dismissal of update prompt
- Show your custom release notes to explain the update

## Testing Updates Locally

1. Make code changes
2. Run `node scripts/generate-version.js`
3. Restart server
4. Open app in two browser tabs
5. In first tab, refresh to get new version
6. In second tab, you should see update prompt appear

## Troubleshooting

**Problem**: Users not getting updates even after regeneration

**Solution**: 
1. Verify the cache version changed in `client/public/sw.js`
2. Check that `/api/version` returns new timestamp
3. Hard refresh with Ctrl+Shift+R (or Cmd+Shift+R on Mac)
4. Clear browser cache and service workers manually

**Problem**: Update prompt appears but refresh doesn't load new version

**Solution**: This is now fixed with aggressive cache clearing on refresh

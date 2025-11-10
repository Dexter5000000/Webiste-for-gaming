# Honeybadger Quick Reference

## Get Your API Key

1. Sign up: https://www.honeybadger.io/
2. Create project: "Zenith DAW"
3. Copy API key from Settings
4. Add to `.env`:
   ```
   VITE_HONEYBADGER_API_KEY=your_key_here
   ```

## GitHub Student Pack (FREE)

https://education.github.com/pack → Find "Honeybadger" → Get access

## Common Commands

```typescript
import honeybadger, { trackAudioError, trackComponentError, addBreadcrumb } from './utils/honeybadger';

// Track audio error
trackAudioError(error, { contextState: 'suspended' });

// Track component error
trackComponentError(error, 'TransportBar', { isPlaying: true });

// Add debugging breadcrumb
addBreadcrumb('User action', { button: 'play' });

// Manual error reporting
honeybadger.notify(new Error('Custom error'));
```

## View Errors

Dashboard: https://app.honeybadger.io/

## Files Changed

- ✅ `src/utils/honeybadger.ts` - Configuration
- ✅ `src/main.tsx` - Initialization
- ✅ `src/components/ErrorBoundary.tsx` - React errors
- ✅ `.env.example` - Template
- ✅ `HONEYBADGER_SETUP.md` - Full guide

## Next Steps

1. Create Honeybadger account
2. Add API key to `.env` file
3. Test: `honeybadger.notify(new Error('Test'))`
4. Set up alerts (email/Slack)
5. Deploy and monitor errors!

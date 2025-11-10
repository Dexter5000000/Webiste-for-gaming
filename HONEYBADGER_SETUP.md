# Honeybadger Error Monitoring Setup Guide

## Overview

Honeybadger error monitoring is now integrated into Zenith DAW to track and report errors in production.

## Features

✅ **Automatic Error Tracking**
- Uncaught exceptions
- Unhandled promise rejections
- React component errors via Error Boundary

✅ **Custom Error Tracking**
- Audio-specific errors
- Component errors
- Custom breadcrumbs for debugging

✅ **Development vs Production**
- Errors only reported in production
- Debug mode in development
- Breadcrumb tracking for better context

## Setup Instructions

### 1. Create Honeybadger Account

1. Go to https://www.honeybadger.io/
2. Sign up for free account (GitHub Student Pack offers free plan!)
3. Create a new project for "Zenith DAW"
4. Copy your API key

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your API key:

```env
VITE_HONEYBADGER_API_KEY=your_actual_api_key_here
VITE_APP_VERSION=1.0.0
```

**Important:** Never commit `.env` file to git! It's already in `.gitignore`.

### 3. GitHub Student Pack Benefits

If you're a GitHub Student:
- Free Honeybadger plan included
- Go to https://education.github.com/pack
- Find Honeybadger in the list
- Click "Get access" to redeem

## Usage

### Automatic Error Tracking

Errors are automatically tracked:

```typescript
// This error will be automatically reported
throw new Error('Something went wrong');

// Unhandled promise rejection - also automatically reported
Promise.reject(new Error('Async error'));
```

### Custom Error Tracking

Track audio-specific errors:

```typescript
import { trackAudioError } from './utils/honeybadger';

try {
  audioContext.resume();
} catch (error) {
  trackAudioError(error as Error, {
    audioContextState: audioContext.state,
    sampleRate: audioContext.sampleRate,
  });
}
```

Track component errors:

```typescript
import { trackComponentError } from './utils/honeybadger';

try {
  // Component logic
} catch (error) {
  trackComponentError(error as Error, 'TransportBar', {
    isPlaying: true,
    currentTime: 0,
  });
}
```

### Add Breadcrumbs for Debugging

```typescript
import { addBreadcrumb } from './utils/honeybadger';

// Track user actions
addBreadcrumb('User clicked play button', {
  tempo: 120,
  trackCount: 3,
});

// Track audio events
addBreadcrumb('Audio context resumed', {
  sampleRate: 44100,
  latency: 0.01,
});
```

## Integration Examples

### In AudioEngine.ts

```typescript
import { trackAudioError, addBreadcrumb } from '../utils/honeybadger';

class AudioEngine {
  async play() {
    try {
      addBreadcrumb('Starting audio playback');
      await this.context.resume();
      // ... playback logic
    } catch (error) {
      trackAudioError(error as Error, {
        contextState: this.context.state,
        trackCount: this.tracks.size,
      });
      throw error;
    }
  }
}
```

### In React Components

```typescript
import { trackComponentError, addBreadcrumb } from '../utils/honeybadger';

function TransportBar() {
  const handlePlay = () => {
    try {
      addBreadcrumb('User clicked play button');
      audioEngine.play();
    } catch (error) {
      trackComponentError(error as Error, 'TransportBar', {
        transport: { isPlaying, currentTime },
      });
    }
  };
}
```

## Dashboard & Alerts

### View Errors

1. Go to https://app.honeybadger.io/
2. Select "Zenith DAW" project
3. View error list with:
   - Error message and stack trace
   - Breadcrumbs showing user actions
   - Environment details
   - User context

### Set Up Alerts

1. Go to Project Settings → Alerts
2. Configure notifications:
   - Email alerts
   - Slack integration
   - Discord webhooks
   - GitHub issues

### Error Grouping

Errors are automatically grouped by:
- Error message
- Stack trace
- Custom fingerprints

## Environment-Specific Behavior

### Development
- Errors logged to console
- Not reported to Honeybadger (unless you enable it)
- Debug mode enabled
- Breadcrumbs visible in console

### Production
- Errors reported to Honeybadger
- User-friendly error messages
- Full breadcrumb trail
- Performance metrics

## Configuration Options

Edit `src/utils/honeybadger.ts` to customize:

```typescript
const honeybadger = Honeybadger.configure({
  apiKey: '...',
  environment: 'production',
  
  // Custom options
  revision: '1.0.0',              // Track which version has errors
  breadcrumbsEnabled: true,       // Enable breadcrumbs
  maxBreadcrumbs: 40,             // Number of breadcrumbs to keep
  
  // Privacy filters
  filters: ['password', 'apiKey'], // Filter sensitive data
  
  // Enable/disable features
  enableUnhandledRejection: true,
  enableUncaught: true,
});
```

## Testing

Test error reporting:

```typescript
// In browser console
import honeybadger from './utils/honeybadger';

// Test basic error
honeybadger.notify(new Error('Test error'));

// Test with context
honeybadger.notify(new Error('Audio test'), {
  context: { audioContext: 'suspended' }
});
```

## Troubleshooting

### Errors Not Showing Up

1. **Check API Key**: Verify `.env` has correct API key
2. **Check Environment**: Errors only report in production by default
3. **Check Console**: Look for Honeybadger initialization message
4. **Network Issues**: Check browser console for failed requests

### Too Many Errors

1. **Filter Noise**: Add error filters in Honeybadger dashboard
2. **Rate Limiting**: Configure in project settings
3. **Ignore Patterns**: Add patterns to ignore list

### Development Testing

To test in development, edit `src/utils/honeybadger.ts`:

```typescript
const honeybadger = Honeybadger.configure({
  reportData: true, // Force reporting in development
  debug: true,      // Enable debug logging
});
```

## CI/CD Integration

Add to `.travis.yml`:

```yaml
env:
  global:
    - VITE_HONEYBADGER_API_KEY=$HONEYBADGER_API_KEY
    - VITE_APP_VERSION=$TRAVIS_COMMIT
```

Set `HONEYBADGER_API_KEY` in Travis CI environment variables.

## Privacy & Security

- API key is client-side visible (this is normal)
- Use `filters` to remove sensitive data
- Never log passwords or tokens
- Review error context before enabling breadcrumbs

## Support

- Honeybadger Docs: https://docs.honeybadger.io/
- GitHub Issues: Report bugs in your repo
- Email: support@honeybadger.io

## Next Steps

1. ✅ Create Honeybadger account
2. ✅ Add API key to `.env`
3. ✅ Test error reporting
4. ⬜ Set up Slack/email alerts
5. ⬜ Add custom error tracking to audio code
6. ⬜ Configure error grouping rules
7. ⬜ Set up deployment tracking

---

**Note:** Remember to add `.env` to `.gitignore` to keep your API key secure!

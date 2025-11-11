# 🤗 HuggingFace Token Setup Guide

## For End Users (Recommended)

Your users can now add their HuggingFace API token **directly in the DAW** without accessing your source code!

### How to Add Token in the App

1. **Open Settings**
   - Click the ⚙️ **Settings** button in the DAW interface

2. **Find HuggingFace Section**
   - Scroll down to "🤗 HuggingFace API Token"

3. **Get Your Free Token**
   - Click the link to visit [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Sign up for a free account if you don't have one
   - Click **"New token"**
   - Name it (e.g., "Zenith DAW")
   - Select **"Read"** role
   - Click **"Create"**
   - Copy the token (starts with `hf_...`)

4. **Save in Settings**
   - Paste the token into the input field
   - Click **"💾 Save Token"**
   - You'll see a success message!

5. **Done!**
   - Your token is stored locally in your browser
   - It's **never sent to any server** except HuggingFace's API
   - Reload the AI Music panel to start using high-quality models

### Privacy & Security

✅ **Your token is safe:**
- Stored only in your browser's `localStorage`
- Never transmitted to the DAW's servers
- Only used to authenticate directly with HuggingFace's API
- You can clear it anytime from Settings

⚠️ **Best Practices:**
- Don't share your token with others
- Create a new token if you suspect it's been compromised
- You can revoke tokens anytime at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

### What Happens Without a Token?

Don't worry! The DAW still works great:

- **Automatic Fallback**: If no token is detected, the app uses the **Procedural (No API Key)** generator
- **Local Generation**: Runs 100% in your browser with no network calls
- **Good Quality**: Produces layered drum/bass/melody loops suitable for demos and inspiration
- **No Limits**: Generate as much as you want offline

The token is **optional** but provides:
- 🎵 Higher quality AI models (Stable Audio Open, MusicGen, etc.)
- ⚡ Faster generation
- 🎨 More style variety
- 🔊 Better fidelity

## For Developers

If you're running the source code locally, you can also use an environment variable:

### Option A: `.env.local` File

1. Create `.env.local` in your project root
2. Add: `VITE_HUGGINGFACE_TOKEN=hf_your_token_here`
3. Restart dev server

**Priority:**
- User's localStorage token (from Settings UI) takes precedence
- Falls back to `.env.local` if no user token exists

### Option B: Programmatic Access

The token utility is available at `src/utils/storage.ts`:

```typescript
import { getHuggingFaceToken, saveHuggingFaceToken, clearHuggingFaceToken } from './utils/storage';

// Get current token (checks localStorage first, then env)
const token = getHuggingFaceToken();

// Save a token
saveHuggingFaceToken('hf_abc123...');

// Clear token
clearHuggingFaceToken();
```

## Troubleshooting

### "Token saved but AI generation still fails"

- Make sure you copied the full token (starts with `hf_...`)
- Try generating again (the page doesn't need a reload)
- Check browser console for detailed error messages

### "Token field is empty after reload"

- Your browser might have localStorage disabled
- Try enabling cookies/storage for the site
- Use Incognito/Private mode as a test

### "Still seeing 'Procedural fallback' warning"

- Click the 👁️ button to verify your token is saved
- Make sure the token is valid (test at huggingface.co)
- Try clearing and re-saving the token

### "Rate limit errors"

- HuggingFace free tier has rate limits
- Wait a few minutes between generations
- Consider upgrading to HuggingFace Pro (optional, paid)

## API Token Limits (Free Tier)

HuggingFace free tier includes:

- ✅ Unlimited inference requests
- ✅ All open-source models
- ⚠️ Shared infrastructure (slower during peak times)
- ⚠️ Cold start time (1-2 min if model not loaded)
- ⚠️ Rate limits (fair use policy)

For production use with high volume, consider [HuggingFace Pro](https://huggingface.co/pricing) (optional).

## Need Help?

- **HuggingFace Docs**: [huggingface.co/docs/inference-endpoints](https://huggingface.co/docs/inference-endpoints)
- **Token Management**: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- **DAW Issues**: Check the main README or open an issue

---

**Last Updated**: November 10, 2025  
**Feature**: In-App Token Settings  
**Storage**: Browser localStorage (client-side only)

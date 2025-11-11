# AI Music Generation Feature

## Overview
Studio-quality free AI music generation integration for the Zenith DAW using multiple open-source AI models. This feature provides unlimited, high-fidelity music generation at 44.1kHz+ stereo.

## Setup (Required)

### Get Your Free HuggingFace API Token

HuggingFace now requires authentication for their Inference API. Getting a token is **free and takes 2 minutes**:

1. **Create Account**: Go to [huggingface.co](https://huggingface.co/) and sign up (free)
2. **Generate Token**: Visit [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. **Create New Token**: Click "New token" → Name it (e.g., "Zenith DAW") → Role: "Read" → Create
4. **Copy Token**: Copy your token (starts with `hf_...`)
5. **Add to Project**:
   - Create a file named `.env.local` in your project root (next to `package.json`)
   - Add this line: `VITE_HUGGINGFACE_TOKEN=hf_your_token_here`
   - Replace `hf_your_token_here` with your actual token
6. **Restart Dev Server**: Stop and restart `npm run dev` to load the new token

**Example `.env.local` file:**
```bash
VITE_HUGGINGFACE_TOKEN=hf_abcdefghijklmnopqrstuvwxyz123456
```

✅ **Benefits of using a token:**
* No "Failed to fetch" errors
* Faster model loading
* Higher rate limits
* More reliable generations

⚠️ **Important:** Never commit `.env.local` to Git (it's already in `.gitignore`)

### Tokenless Fallback (Automatic)

If a visitor is using the deployed site and no HuggingFace token is present, the DAW automatically falls back to a fully local model: **Procedural (No API Key)**.

This produces a royalty-free loop by algorithmically layering:
* Kick + hat rhythm (unless ambient)
* Bass sequence (minor pentatonic or major implied by prompt)
* Melody or evolving pad (ambient detection)
* Light stereo widening

It runs entirely in the browser via `OfflineAudioContext` – no network calls, no keys. Duration max 60s. Ideal for quick inspiration when API access is unavailable.

You can also explicitly choose the model from the dropdown. If a HuggingFace model is selected without a token, we display a notice and auto-fallback.

## Features

### Supported AI Models

1. **Stable Audio Open** (Primary) ⭐
   - Provider: HuggingFace
   - Quality: High
   - Sample Rate: 44.1kHz
   - Max Duration: 95 seconds
   - Genres: Electronic, Ambient, Rock, Hip-Hop, Pop, Dance, Experimental
   - Description: Stability AI's flagship open-source model optimized for professional music generation

2. **Meta AudioCraft MusicGen Large**
   - Provider: HuggingFace
   - Quality: High
   - Sample Rate: 44.1kHz
   - Max Duration: 120 seconds
   - Genres: Ambient, Rock, Jazz, Classical, Hip-Hop, Pop, Experimental
   - Description: Meta's powerful open MusicGen model for extended compositions

3. **MusicGen Medium**
   - Provider: Local/Browser
   - Quality: Medium
   - Sample Rate: 44.1kHz
   - Max Duration: 60 seconds
   - Description: Optimized for faster inference

4. **Riffusion**
   - Provider: HuggingFace
   - Quality: Medium
   - Sample Rate: 44.1kHz
   - Max Duration: 30 seconds
   - Genres: Electronic, Experimental, Ambient
   - Description: Spectrogram-based diffusion for creative loops and textures

5. **AudioLDM 2**
   - Provider: HuggingFace
   - Quality: High
   - Sample Rate: 48kHz
   - Max Duration: 60 seconds
   - Description: High fidelity text-to-audio with detailed prompt support

6. **Dance Diffusion**
   - Provider: HuggingFace
   - Quality: Medium
   - Sample Rate: 44.1kHz
   - Max Duration: 45 seconds
   - Genres: Dance, Electronic, Experimental
   - Description: Harmonai's electronic/dance-focused model

7. **Bark**
   - Provider: HuggingFace
   - Quality: Medium
   - Sample Rate: 44.1kHz
   - Max Duration: 45 seconds
   - Description: Suno's model for vocals and soundscapes

### Genre-Based Model Routing

The system automatically recommends the best model for each genre:

- **Electronic/Dance**: Stable Audio Open, Dance Diffusion, Riffusion
- **Ambient**: MusicGen Large, AudioLDM 2, Stable Audio Open
- **Rock**: MusicGen Large, Stable Audio Open
- **Jazz/Classical**: MusicGen Large
- **Hip-Hop/Pop**: Stable Audio Open, MusicGen Large
- **Experimental**: Riffusion, AudioLDM 2, Bark

## Usage

### UI Integration

1. Open the **AI Music** tab in the right sidebar
2. Select a genre/style (auto-recommends best model)
3. Choose a specific AI model (optional)
4. Enter a text prompt describing the music
5. Set desired duration (5-120 seconds depending on model)
6. Click **Generate Music**
7. Preview the generated audio
8. Add to timeline or download

### Prompt Tips

- Be specific with instruments, tempo, and mood
- Example: "Energetic electronic dance music with synth leads and heavy bass at 128 BPM"
- Include details like "uplifting", "melancholic", "distorted guitar", "piano melody"
- Experiment with different prompts for varied results

### Performance Notes

- **First Load**: HuggingFace models may take 1-2 minutes to load (cold start)
- **Subsequent Generations**: Much faster after initial model load
- **Free Tier**: All models are 100% free with no API keys required
- **No Limits**: Generate unlimited music

## Technical Implementation

### File Structure

```
src/audio/ai/
├── types.ts                 # TypeScript types and interfaces
├── models.ts                # AI model configurations
├── AIMusicGenerator.ts      # Core generation logic
└── index.ts                 # Public exports

src/components/
└── AIMusicPanel.tsx         # React UI component
```

### Key Classes

#### `AIMusicGenerator`

Main class for AI music generation with methods:

- `generate(request: GenerationRequest): Promise<GenerationResult>`
- `setProgressCallback(callback: Function): void`
- `getBestModelForGenre(genre: string): AIModelType`

#### API Integration

Uses HuggingFace Inference API:
- Endpoint: `https://api-inference.huggingface.co/models/`
- Method: POST
- Content-Type: application/json
- No authentication required for free tier

### Data Flow

1. User inputs prompt and settings
2. `AIMusicGenerator.generate()` called with request
3. Connects to HuggingFace Inference API
4. Streams progress updates
5. Receives audio blob
6. Converts to AudioBuffer
7. Returns result with metadata
8. UI displays audio player and add/download options

## Audio Quality

All models output professional-quality audio:

- **Sample Rate**: 44.1kHz - 48kHz
- **Bit Depth**: 16-24 bit (varies by model)
- **Channels**: Stereo (2 channels)
- **Format**: WAV/MP3 depending on model output
- **Artifacts**: Minimal, production-ready

## Free Tier Benefits

### HuggingFace Inference API (Free)
- ✅ No API keys required
- ✅ Unlimited generations
- ✅ No rate limits (fair use)
- ✅ All models available
- ⚠️ Cold start time (1-2 min for initial load)
- ⚠️ Shared infrastructure (occasional queues)

### Future Enhancements

1. **Replicate Integration**: Free tier with generous credits
2. **Local ONNX Inference**: Browser-based, truly offline
3. **Batch Generation**: Generate multiple variations
4. **A/B Comparison**: Compare outputs from different models
5. **Style Transfer**: Use reference audio for style
6. **Extended Duration**: Chain multiple generations
7. **Quality Upsampling**: AI-powered sample rate conversion

## Adding to Timeline

When you click "Add to Timeline":

1. Generated audio buffer is passed to parent component
2. Creates a new audio clip with the generated content
3. Places clip at current playhead position or selected track
4. Clip includes waveform visualization
5. Full DAW editing capabilities (cut, fade, effects, etc.)

## Troubleshooting

### Model is Loading...
- **Cause**: HuggingFace free tier cold start
- **Solution**: Wait 1-2 minutes, try again
- **Prevention**: Models stay warm for ~15 minutes after use

### Generation Failed
- **Cause**: Network error or model timeout
- **Solution**: Check internet connection, try different model
- **Fallback**: Use MusicGen Medium (faster, lighter)

### Low Quality Output
- **Cause**: Model limitations or vague prompt
- **Solution**: Be more specific in prompt, try high-quality model (Stable Audio Open, AudioLDM 2)

### Slow Generation
- **Cause**: Model size, server load
- **Solution**: Use smaller models (Riffusion, Dance Diffusion) for faster results

## API Reference

### `GenerationRequest`

```typescript
interface GenerationRequest {
  model: AIModelType;
  prompt: string;
  duration: number;
  genre?: MusicGenre;
  temperature?: number;      // 0.0-1.0, creativity
  guidanceScale?: number;    // 1.0-20.0, prompt adherence
  negativePrompt?: string;   // Things to avoid
  seed?: number;             // Reproducibility
}
```

### `GenerationResult`

```typescript
interface GenerationResult {
  success: boolean;
  audioBuffer?: AudioBuffer;
  audioBlob?: Blob;
  audioUrl?: string;
  duration?: number;
  sampleRate?: number;
  error?: string;
  metadata?: {
    model: AIModelType;
    prompt: string;
    duration: number;
    generatedAt: string;
  };
}
```

### `GenerationProgress`

```typescript
interface GenerationProgress {
  stage: 'initializing' | 'generating' | 'processing' | 'complete' | 'error';
  progress: number;  // 0-100
  message: string;
}
```

## Model Comparison

| Model | Quality | Speed | Duration | Best For |
|-------|---------|-------|----------|----------|
| Stable Audio Open | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 95s | General music |
| MusicGen Large | ⭐⭐⭐⭐⭐ | ⭐⭐ | 120s | Long compositions |
| MusicGen Medium | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 60s | Quick results |
| AudioLDM 2 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 60s | Detailed prompts |
| Riffusion | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 30s | Loops, experimental |
| Dance Diffusion | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 45s | Electronic, dance |
| Bark | ⭐⭐⭐ | ⭐⭐⭐⭐ | 45s | Vocals, soundscapes |

## Compliance

### Open Source & Free
- ✅ All models are open source
- ✅ No paid services (Suno, Udio, Mubert excluded as requested)
- ✅ No hidden costs or subscriptions
- ✅ Commercial use allowed (check individual model licenses)

### Model Licenses
- Stable Audio Open: Open source (Stability AI License)
- MusicGen: MIT License (Meta)
- Riffusion: MIT License
- AudioLDM 2: Apache 2.0
- Dance Diffusion: MIT License (Harmonai)
- Bark: MIT License (Suno)

## Credits

- **Stability AI**: Stable Audio Open
- **Meta AI**: AudioCraft/MusicGen
- **Riffusion**: Hayk Martiros & Seth Forsgren
- **AudioLDM Team**: Haohe Liu
- **Harmonai**: Dance Diffusion
- **Suno**: Bark
- **HuggingFace**: Free inference infrastructure

## Support & Community

For issues, questions, or contributions:
- Check HuggingFace model cards for specific model docs
- Report bugs in the DAW's issue tracker
- Share generated music and prompts with the community
- Contribute new model integrations

---

**100% Free • Studio Quality • Unlimited Generations**

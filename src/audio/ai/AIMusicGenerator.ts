import type {
  AIModelType,
  GenerationRequest,
  GenerationResult,
  GenerationProgress,
  AIModelConfig,
} from './types';
import { AI_MODELS } from './models';

export class AIMusicGenerator {
  private progressCallback?: (progress: GenerationProgress) => void;

  setProgressCallback(callback: (progress: GenerationProgress) => void): void {
    this.progressCallback = callback;
  }

  private updateProgress(
    stage: GenerationProgress['stage'],
    progress: number,
    message: string
  ): void {
    this.progressCallback?.({
      stage,
      progress: Math.min(100, Math.max(0, progress)),
      message,
    });
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const modelConfig = AI_MODELS[request.model];

    if (!modelConfig) {
      return {
        success: false,
        error: `Unknown model: ${request.model}`,
      };
    }

    try {
      this.updateProgress('initializing', 0, `Initializing ${modelConfig.name}...`);

      if (modelConfig.provider === 'huggingface') {
        return await this.generateWithHuggingFace(request, modelConfig);
      } else if (modelConfig.provider === 'replicate') {
        return await this.generateWithReplicate(request, modelConfig);
      } else if (modelConfig.provider === 'local') {
        return await this.generateWithLocalInference(request, modelConfig);
      }

      return {
        success: false,
        error: `Unsupported provider: ${modelConfig.provider}`,
      };
    } catch (error) {
      this.updateProgress('error', 0, `Generation failed: ${(error as Error).message}`);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private async generateWithHuggingFace(
    request: GenerationRequest,
    modelConfig: AIModelConfig
  ): Promise<GenerationResult> {
    this.updateProgress('generating', 10, 'Connecting to HuggingFace Inference API...');

    const inputs = {
      prompt: request.prompt,
      duration: Math.min(request.duration, modelConfig.maxDuration),
      temperature: request.temperature ?? 0.7,
      guidance_scale: request.guidanceScale ?? 7.5,
      negative_prompt: request.negativePrompt ?? '',
    };

    try {
      this.updateProgress('generating', 30, 'Sending generation request...');

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${modelConfig.modelId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(inputs),
        }
      );

      this.updateProgress('generating', 60, 'Receiving audio data...');

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 503) {
          throw new Error(
            'Model is loading. Please try again in a few moments. HuggingFace free tier may take 1-2 minutes to load models.'
          );
        }
        throw new Error(`HuggingFace API error: ${errorText}`);
      }

      const audioBlob = await response.blob();
      this.updateProgress('processing', 80, 'Converting audio format...');

      const audioBuffer = await this.blobToAudioBuffer(audioBlob);

      this.updateProgress('complete', 100, 'Generation complete!');

      return {
        success: true,
        audioBuffer,
        audioBlob,
        audioUrl: URL.createObjectURL(audioBlob),
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        metadata: {
          model: request.model,
          prompt: request.prompt,
          duration: request.duration,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(`HuggingFace generation failed: ${(error as Error).message}`);
    }
  }

  private async generateWithReplicate(
    _request: GenerationRequest,
    _modelConfig: AIModelConfig
  ): Promise<GenerationResult> {
    this.updateProgress('generating', 10, 'Connecting to Replicate API...');

    return {
      success: false,
      error: 'Replicate integration coming soon. Use HuggingFace models for now.',
    };
  }

  private async generateWithLocalInference(
    _request: GenerationRequest,
    _modelConfig: AIModelConfig
  ): Promise<GenerationResult> {
    this.updateProgress('generating', 10, 'Starting local inference...');

    return {
      success: false,
      error:
        'Local ONNX inference coming soon. Use cloud-based models (HuggingFace) for now.',
    };
  }

  private async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: 44100 });
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      await audioContext.close();
      return audioBuffer;
    } catch (error) {
      await audioContext.close();
      throw new Error(`Failed to decode audio: ${(error as Error).message}`);
    }
  }

  getBestModelForGenre(genre: string): AIModelType {
    const genreModels: Record<string, AIModelType> = {
      electronic: 'stable-audio-open',
      dance: 'dance-diffusion',
      ambient: 'musicgen-large',
      rock: 'musicgen-large',
      jazz: 'musicgen-large',
      classical: 'musicgen-large',
      'hip-hop': 'stable-audio-open',
      pop: 'stable-audio-open',
      experimental: 'riffusion',
    };

    return genreModels[genre.toLowerCase()] ?? 'stable-audio-open';
  }
}

export const aiMusicGenerator = new AIMusicGenerator();

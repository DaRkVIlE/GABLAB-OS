/**
 * SKYROS Agent — HuggingFace Provider
 * Connects to Qwen3.5 Claude 4.6 Opus distillations via HF Inference Router
 * Uses OpenAI-compatible API — zero new dependencies
 */

import { BaseProvider } from './base.js';

/**
 * HuggingFace model catalog for SKYROS
 */
export const HF_MODELS = {
  'qwen-27b-reasoning': {
    id: 'Jackrong/Qwen3.5-27B-Claude-4.6-Opus-Reasoning-Distilled',
    tier: 'supreme',
    params: '27.8B',
    description: 'Reasoning distilled from Claude 4.6 Opus',
  },
  'qwen-35b-aggressive': {
    id: 'HauhauCS/Qwen3.5-35B-A3B-Uncensored-HauhauCS-Aggressive',
    tier: 'light-uncensored',
    params: '35B MoE (3B active)',
    description: 'Fast uncensored MoE',
  },
  'qwen-40b-thinking': {
    id: 'DavidAU/Qwen3.5-40B-Claude-4.6-Opus-Deckard-Heretic-Uncensored-Thinking',
    tier: 'god',
    params: '39.5B',
    description: 'Heavy thinking — uncensored Claude 4.6 Opus distillation',
  },
};

export class HuggingFaceProvider extends BaseProvider {
  /**
   * @param {Object} config - { keys: [hf_token], model, baseUrl, rpmPerKey }
   */
  constructor(config) {
    super({
      keys: config.keys || [],
      baseUrl: config.baseUrl || 'https://router.huggingface.co/hf-inference/v1',
      model: config.model || HF_MODELS['qwen-27b-reasoning'].id,
      rpmPerKey: config.rpmPerKey || 10,
    });
    this.name = 'huggingface';
    this.modelCatalog = HF_MODELS;
  }

  /**
   * Resolve model alias to full HuggingFace model ID
   * Supports: alias ('qwen-27b-reasoning'), tier ('supreme'), or full ID
   */
  resolveModel(modelInput) {
    if (!modelInput) return this.model;

    // Check alias
    if (HF_MODELS[modelInput]) return HF_MODELS[modelInput].id;

    // Check tier
    const byTier = Object.values(HF_MODELS).find(m => m.tier === modelInput);
    if (byTier) return byTier.id;

    // Full model ID passthrough
    return modelInput;
  }

  /**
   * Override complete to use dynamic baseURL per model
   * HF Inference Router format: https://router.huggingface.co/hf-inference/models/{MODEL}/v1
   */
  async complete(messages, tools = [], options = {}) {
    const resolvedModel = this.resolveModel(options.model);
    
    // Build dynamic with model-specific baseURL
    const originalBaseUrl = this.baseUrl;
    this.baseUrl = `https://router.huggingface.co/hf-inference/models/${resolvedModel}/v1`;
    
    // Override model in options to strictly use the resolved one
    const mergedOptions = { ...options, model: resolvedModel };

    try {
      return await super.complete(messages, tools, mergedOptions);
    } finally {
      // Restore baseUrl
      this.baseUrl = originalBaseUrl;
    }
  }

  /**
   * List available models
   */
  static getCatalog() {
    return HF_MODELS;
  }
}

export default HuggingFaceProvider;

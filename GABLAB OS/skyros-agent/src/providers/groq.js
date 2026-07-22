/**
 * SKYROS Agent — Groq Provider
 * Groq via OpenAI-compatible API (2 keys round-robin)
 */

import { BaseProvider } from './base.js';

export class GroqProvider extends BaseProvider {
  constructor(config) {
    super({
      keys: config.keys,
      baseUrl: config.baseUrl || 'https://api.groq.com/openai/v1',
      model: config.model || 'llama-3.1-8b-instant',
      rpmPerKey: config.rpmPerKey || 30,
    });
    this.name = 'groq';
    this.modelHeavy = config.modelHeavy || 'llama-3.3-70b-versatile';
  }
}

export default GroqProvider;

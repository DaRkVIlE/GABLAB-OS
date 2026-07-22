/**
 * SKYROS Agent — Gemini Provider
 * Google Gemini via OpenAI-compatible API (5 keys round-robin)
 */

import { BaseProvider } from './base.js';

export class GeminiProvider extends BaseProvider {
  constructor(config) {
    super({
      keys: config.keys,
      baseUrl: config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: config.model || 'gemini-2.5-flash',
      rpmPerKey: config.rpmPerKey || 15,
    });
    this.name = 'gemini';
  }
}

export default GeminiProvider;

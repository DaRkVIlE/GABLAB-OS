/**
 * SKYROS Agent — Provider Router
 * Routes LLM calls to the right provider based on complexity or explicit choice
 */

import { GeminiProvider } from './gemini.js';
import { GroqProvider } from './groq.js';
import { HuggingFaceProvider } from './huggingface.js';
import { RedHatProvider } from './redhat.js';
import { ProviderHealth } from './health.js';

export class ProviderRouter {
  constructor(config) {
    this.providers = {};
    this.routing = config.routing;
    this.defaultTier = 'medium';
    this.deadProviders = new Set(); // Cache de providers mortos

    // Initialize providers that have keys
    if (config.providers.gemini.keys.length > 0) {
      this.providers.gemini = new GeminiProvider(config.providers.gemini);
    }
    if (config.providers.groq.keys.length > 0) {
      this.providers.groq = new GroqProvider(config.providers.groq);
    }
    if (config.providers.huggingface?.keys?.length > 0) {
      this.providers.huggingface = new HuggingFaceProvider(config.providers.huggingface);
    }
    if (config.providers.redhat?.keys?.length > 0) {
      this.providers.redhat = new RedHatProvider(config.providers.redhat);
    }

    // Determine the best available default
    if (Object.keys(this.providers).length === 0) {
      throw new Error('No API keys configured! Add keys to god-kairos/api-keys.yaml or .env');
    }
  }

  /**
   * Executa check de saude de todos providers (no boot)
   */
  async checkHealth() {
    const status = await ProviderHealth.checkAll(this);
    for (const [name, result] of Object.entries(status)) {
      if (result.status === 'dead') {
        this.deadProviders.add(name);
        console.error(`⚠️  [HealthCheck] Provider ${name} is dead. It will be excluded from routing.`);
      }
    }
    return status;
  }

  /**
   * Get a provider by name
   */
  getProvider(name) {
    const provider = this.providers[name];
    if (!provider) {
      throw new Error(`Provider '${name}' not available. Available: ${Object.keys(this.providers).join(', ')}`);
    }
    if (this.deadProviders.has(name)) {
      throw new Error(`Provider '${name}' is marked as DEAD by health checks.`);
    }
    return provider;
  }

  /**
   * Get the best provider for a given tier (light/medium/heavy/night)
   * Falls back gracefully if preferred provider isn't available or is dead
   */
  getProviderForTier(tier) {
    const route = this.routing[tier] || this.routing.medium;
    const preferredProvider = route.provider;
    
    // Try preferred provider first
    if (this.providers[preferredProvider] && !this.deadProviders.has(preferredProvider)) {
      return { provider: this.providers[preferredProvider], model: route.model };
    }

    // Fallback chain (Pool de APIs - isolamos o redhat para não ser usado de fallback de dia)
    // Se o night shift (Red Hat) falhar, caímos suavemente no pool de Free Tier (Groq/Gemini) para não quebrar a automação.
    const fallbackPool = tier === 'night' 
      ? ['groq', 'gemini'] 
      : ['huggingface', 'gemini', 'groq']; // Pool diurno

    const fallbackOrder = fallbackPool.filter(n => n !== preferredProvider && !this.deadProviders.has(n));
    
    // API Pooling Strategy: Embaralhar as opções de dia para distribuir a carga (Load Balancing real)
    if (fallbackOrder.length > 1 && tier !== 'night') {
       fallbackOrder.sort(() => Math.random() - 0.5);
    }

    for (const fbName of fallbackOrder) {
      if (this.providers[fbName]) {
        return { provider: this.providers[fbName], model: this.providers[fbName].model };
      }
    }
    
    throw new Error('No providers available for fallback. All preferred and fallback chains are dead or unconfigured.');
  }

  /**
   * Smart complete — routes to correct provider
   */
  async complete(messages, tools = [], options = {}) {
    let provider, model;

    if (options.provider) {
      // Explicit provider choice
      provider = this.getProvider(options.provider);
      model = options.model || provider.model;
    } else {
      // Route by tier
      const route = this.getProviderForTier(options.tier || this.defaultTier);
      provider = route.provider;
      model = options.model || route.model;
    }

    try {
      return await provider.complete(messages, tools, { ...options, model });
    } catch (error) {
      // On failure, try fallback chain
      if (error.status === 429 || error.status === 503 || error.status === 401 || error.status === 403 || error.status === 500) {
        
        // Mark as dead if it's an auth error or unrecoverable error
        if (error.status === 401 || error.status === 403) {
           this.deadProviders.add(provider.name);
        }

        // Determine fallback pool based on tier
        const tier = options.tier || this.defaultTier;
        const fallbackPool = tier === 'night' ? ['groq', 'gemini'] : ['huggingface', 'gemini', 'groq'];
        const fallbackOrder = fallbackPool.filter(n => n !== provider.name && !this.deadProviders.has(n));
        
        for (const fallbackName of fallbackOrder) {
          const fallback = this.providers[fallbackName];
          if (fallback) {
            console.error(`⚠️  [Router] ${provider.name} failed (${error.status}), falling back to ${fallbackName}`);
            try {
               // Update provider reference for potential subsequent errors
               provider = fallback;
               return await fallback.complete(messages, tools, { ...options, model: fallback.model });
            } catch (fbErr) {
               // Mark fallback as dead if auth error
               if (fbErr.status === 401 || fbErr.status === 403) {
                 this.deadProviders.add(fallbackName);
               }
               continue; // try next in chain
            }
          }
        }
      }
      throw error;
    }
  }

  /**
   * Get status info about all providers
   */
  getStatus() {
    const status = {};
    for (const [name, provider] of Object.entries(this.providers)) {
      status[name] = {
        keys: provider.keys.length,
        model: provider.model,
        totalRpm: provider.keys.length * provider.rpmPerKey,
      };
    }
    return status;
  }
}

export default ProviderRouter;

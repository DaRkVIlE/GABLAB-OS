/**
 * SKYROS Agent — Provider Health Checker
 * Tests connectivity and latency for all initialized providers
 */

export class ProviderHealth {
  /**
   * Pings all providers in the router
   * @param {ProviderRouter} router 
   * @returns {Object} Map of provider names to their health status
   */
  static async checkAll(router) {
    const results = {};
    for (const [name, provider] of Object.entries(router.providers)) {
      results[name] = await this.ping(provider);
    }
    return results;
  }

  /**
   * Pings a specific provider
   */
  static async ping(provider) {
    const start = Date.now();
    try {
      if (!provider.keys || provider.keys.length === 0) {
        return { status: 'dead', message: 'No API keys configured' };
      }

      // Minimal payload for ping
      const messages = [{ role: 'user', content: 'Reply with the single word PONG.' }];
      await provider.complete(messages, [], { maxTokens: 10 });
      
      return { 
        status: 'alive', 
        latency: Date.now() - start
      };
    } catch (e) {
      return { 
        status: 'dead', 
        error: e.message,
        code: e.status
      };
    }
  }
}

export default ProviderHealth;

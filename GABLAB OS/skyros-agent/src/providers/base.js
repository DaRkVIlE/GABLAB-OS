/**
 * SKYROS Agent — Base Provider Interface
 * All providers implement this interface via OpenAI-compatible API using native fetch
 */

export class BaseProvider {
  /**
   * @param {Object} options
   * @param {string[]} options.keys
   * @param {string} options.baseUrl
   * @param {string} options.model
   * @param {number} [options.rpmPerKey=0]
   */
  constructor({ keys, baseUrl, model, rpmPerKey = 0 }) {
    if (!keys || keys.length === 0) throw new Error('At least one API key is required');
    if (!baseUrl) throw new Error('baseUrl is required');
    if (!model) throw new Error('model is required');

    this.keys = keys;
    this.baseUrl = baseUrl;
    this.model = model;
    this.rpmPerKey = rpmPerKey;
    this.currentKeyIndex = 0;
    this.name = 'base';
  }

  /**
   * Pega a próxima key via Round-Robin
   */
  getNextKey() {
    const key = this.keys[this.currentKeyIndex];
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
    return key;
  }

  /**
   * Native fetch to OpenAI-compatible endpoint
   */
  async _chatComplete(key, baseUrl, params) {
    const base = baseUrl.replace(/\/$/, '');
    
    let headers = {
      'Content-Type': 'application/json',
    };

    // Google API uses x-goog-api-key sometimes, but OpenAI compat usually uses Bearer
    // We send Bearer by default
    headers['Authorization'] = `Bearer ${key}`;

    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = new Error(`${res.status} ${res.statusText}`);
      err.status = res.status;
      try { err.body = await res.text(); } catch {}
      throw err;
    }

    return res.json();
  }

  /**
   * Executa um completion chamando a API Rest OpenAI-compatible local/remota
   */
  async complete(messages, tools = [], options = {}) {
    const maxAttempts = this.keys.length;
    let lastError;

    const params = {
      model: options.model || this.model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
    };

    if (tools && tools.length > 0) {
      params.tools = tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        }
      }));
      params.tool_choice = 'auto';
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const key = this.getNextKey();
      try {
        const completion = await this._chatComplete(key, this.baseUrl, params);
        
        const choice = completion.choices[0];
        const message = choice.message;
        
        return {
          text: message.content || '',
          toolCalls: message.tool_calls || [],
          usage: completion.usage || {},
          model: completion.model || params.model,
          raw: message,
          stopReason: choice.finish_reason,
        };
      } catch (error) {
        lastError = error;
        // Se for rate limit (429), tenta a próxima chave
        if (error.status === 429) {
          console.error(`⚠️  [${this.name}] Rate limit (429) on key index ${(this.currentKeyIndex - 1 + this.keys.length) % this.keys.length}, rotating...`);
          continue;
        }
        // Outros erros (401, 404, etc), falha imediatamente para não queimar todas as chaves
        throw new Error(`[${this.name}] Completion Error: ${error.message}${error.body ? ` - ${error.body}` : ''}`);
      }
    }

    throw new Error(`All ${maxAttempts} API keys exhausted for ${this.name}: ${lastError?.message}`);
  }
}

export default BaseProvider;

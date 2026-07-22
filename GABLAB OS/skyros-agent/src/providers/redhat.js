/**
 * SKYROS Agent — Red Hat OpenShift Inference Provider Stub
 * Implements BaseProvider connected to OpenShift AI / Red Hat Sandbox endpoints
 */

import { BaseProvider } from './base.js';

export class RedHatProvider extends BaseProvider {
  /**
   * @param {Object} config - { keys: [], model, baseUrl, rpmPerKey }
   */
  constructor(config) {
    super({
      keys: config.keys || ['internal'],
      baseUrl: config.baseUrl || 'https://sandbox.inference.redhat.com/v1',
      model: config.model || 'qwen3.5-40b-thinking',
      rpmPerKey: config.rpmPerKey || 60,
    });
    this.name = 'redhat';
  }
}

export default RedHatProvider;

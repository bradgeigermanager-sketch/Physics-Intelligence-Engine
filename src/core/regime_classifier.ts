// src/core/regime-classifier.ts

import {
  Regime,
  RegimeClassification,
  RegimePlugin,
} from "./types";

export interface RegimeClassifierConfig {
  plugins: RegimePlugin[];
}

export class RegimeClassifier {
  private regimes: Map<string, Regime>;

  constructor(config: RegimeClassifierConfig) {
    this.regimes = new Map();
    for (const plugin of config.plugins) {
      for (const regime of plugin.regimes) {
        if (this.regimes.has(regime.id)) {
          throw new Error(`Duplicate regime id: ${regime.id}`);
        }
        this.regimes.set(regime.id, regime);
      }
    }
  }

  classify(capabilities: Record<string, unknown>): RegimeClassification[] {
    const results: RegimeClassification[] = [];
    for (const regime of this.regimes.values()) {
      const classification = regime.classify(capabilities);
      results.push(classification);
    }
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}

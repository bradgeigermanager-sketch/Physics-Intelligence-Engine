// src/core/regime-classifier.ts

import {
  Regime,
  RegimeClassification,
  RegimePlugin,
} from "./types";

export interface RegimeClassifierConfig {
  plugins: RegimePlugin[];
}

/**
 * RegimeClassifier
 *
 * Consumes capability maps and produces a sorted list of regime
 * classifications. Each regime plugin contributes a set of regimes,
 * each with its own classification logic.
 */
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

  /**
   * Classify the system using all registered regimes.
   *
   * @param capabilities - map from capability id → capability result
   * @returns sorted array of regime classifications (highest confidence first)
   */
  classify(capabilities: Record<string, unknown>): RegimeClassification[] {
    const results: RegimeClassification[] = [];

    for (const regime of this.regimes.values()) {
      const classification = regime.classify(capabilities);
      results.push(classification);
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Retrieve a single regime definition.
   */
  getRegime(id: string): Regime | undefined {
    return this.regimes.get(id);
  }

  /**
   * List all regime ids.
   */
  listRegimeIds(): string[] {
    return Array.from(this.regimes.keys());
  }
}

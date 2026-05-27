// src/core/capability-engine.ts

import {
  Capability,
  CapabilityPlugin,
} from "./types";

export interface CapabilityEngineConfig {
  plugins: CapabilityPlugin[];
}

/**
 * CapabilityEngine
 *
 * Aggregates capability plugins and evaluates all capabilities
 * against a given measurement map.
 */
export class CapabilityEngine {
  private capabilities: Map<string, Capability>;

  constructor(config: CapabilityEngineConfig) {
    this.capabilities = new Map();

    for (const plugin of config.plugins) {
      for (const cap of plugin.capabilities) {
        if (this.capabilities.has(cap.id)) {
          throw new Error(`Duplicate capability id: ${cap.id}`);
        }
        this.capabilities.set(cap.id, cap);
      }
    }
  }

  /**
   * Evaluate all registered capabilities.
   *
   * @param measurements - map from measurement id → value
   * @returns map from capability id → capability result
   */
  evaluate(measurements: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [id, cap] of this.capabilities.entries()) {
      result[id] = cap.evaluate(measurements);
    }

    return result;
  }

  /**
   * Get a single capability by id, if needed for introspection.
   */
  getCapability(id: string): Capability | undefined {
    return this.capabilities.get(id);
  }

  /**
   * List all capability ids.
   */
  listCapabilityIds(): string[] {
    return Array.from(this.capabilities.keys());
  }
}

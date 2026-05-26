// src/core/capability-engine.ts

import {
  Capability,
  CapabilityPlugin,
} from "./types";

export interface CapabilityEngineConfig {
  plugins: CapabilityPlugin[];
}

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

  evaluate(measurements: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [id, cap] of this.capabilities.entries()) {
      result[id] = cap.evaluate(measurements);
    }
    return result;
  }
}

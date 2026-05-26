// physics_intelligence_pack/src/index.ts

import { MeasurementDAG } from "./core/measurement-dag";
import { CapabilityEngine } from "./core/capability-engine";
import { RegimeClassifier } from "./core/regime-classifier";
import { TransitionDetector } from "./core/transition-detector";
import {
  FieldState,
  RegimeTransition,
} from "./core/types";

// In real usage these would be imported from plugins/* packages.
import type {
  MeasurementPlugin,
  CapabilityPlugin,
  RegimePlugin,
} from "./core/types";

export interface PhysicsIntelligencePackConfig {
  measurementPlugins: MeasurementPlugin[];
  capabilityPlugins: CapabilityPlugin[];
  regimePlugins: RegimePlugin[];
  transitionActiveThreshold?: number;
}

export interface PhysicsIntelligenceResult {
  measurements: Record<string, unknown>;
  capabilities: Record<string, unknown>;
  regimes: ReturnType<RegimeClassifier["classify"]>;
  transition: RegimeTransition | null;
}

export class PhysicsIntelligencePack {
  private measurementDag: MeasurementDAG;
  private capabilityEngine: CapabilityEngine;
  private regimeClassifier: RegimeClassifier;
  private transitionDetector: TransitionDetector;

  constructor(config: PhysicsIntelligencePackConfig) {
    this.measurementDag = new MeasurementDAG({
      plugins: config.measurementPlugins,
    });

    this.capabilityEngine = new CapabilityEngine({
      plugins: config.capabilityPlugins,
    });

    this.regimeClassifier = new RegimeClassifier({
      plugins: config.regimePlugins,
    });

    this.transitionDetector = new TransitionDetector({
      activeThreshold: config.transitionActiveThreshold ?? 0.6,
    });
  }

  run(state: FieldState): PhysicsIntelligenceResult {
    const measurements = this.measurementDag.evaluate(state);
    const capabilities = this.capabilityEngine.evaluate(measurements);
    const regimes = this.regimeClassifier.classify(capabilities);
    const transition = this.transitionDetector.detect(
      state.timestamp,
      regimes
    );

    return {
      measurements,
      capabilities,
      regimes,
      transition,
    };
  }

  // Placeholder for future regime timeline engine integration
  finalizeTimeline() {
    // will be wired to plugins/regime_timeline/engine.ts
    return {
      epochs: [],
      summary: {},
    };
  }
}

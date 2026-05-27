// src/runtime/regime_timeline_engine.ts

import {
  RegimeClassification,
  RegimeTransition,
  RegimeExplanation,
  RegimeExplanationPlugin,
} from "../core/types";

import { RegimeTransitionDetector } from "./regime_transition_detector";

/**
 * A single timeline entry.
 */
export interface RegimeTimelineEntry {
  timestamp: string;
  stateId?: string;
  regimes: RegimeClassification[];
}

/**
 * Full timeline structure.
 */
export interface RegimeTimeline {
  entries: RegimeTimelineEntry[];
  transitions: RegimeTransition[];
  explanations: Record<string, RegimeExplanation>;
}

/**
 * Engine configuration.
 */
export interface RegimeTimelineEngineConfig {
  explanationPlugin: RegimeExplanationPlugin;
  transitionDetector: RegimeTransitionDetector;
}

/**
 * The Regime Timeline Engine:
 * - Processes a stream of regime profiles
 * - Records regime classifications over time
 * - Detects transitions
 * - Generates explanations for each timestamp
 */
export class RegimeTimelineEngine {
  private readonly explanationPlugin: RegimeExplanationPlugin;
  private readonly transitionDetector: RegimeTransitionDetector;

  private readonly entries: RegimeTimelineEntry[] = [];
  private readonly transitions: RegimeTransition[] = [];
  private readonly explanations: Record<string, RegimeExplanation> = {};

  constructor(config: RegimeTimelineEngineConfig) {
    this.explanationPlugin = config.explanationPlugin;
    this.transitionDetector = config.transitionDetector;
  }

  /**
   * Process a single regime profile.
   */
  process(profile: {
    timestamp?: string;
    stateId?: string;
    regimes: RegimeClassification[];
    capabilities: Record<string, number>;
  }) {
    const ts = profile.timestamp ?? new Date().toISOString();

    // 1. Record timeline entry
    const entry: RegimeTimelineEntry = {
      timestamp: ts,
      stateId: profile.stateId,
      regimes: profile.regimes,
    };
    this.entries.push(entry);

    // 2. Detect transitions
    const detected = this.transitionDetector.process({
      timestamp: ts,
      stateId: profile.stateId,
      regimes: profile.regimes.map((r) => ({
        regimeId: r.regimeId,
        family: r.regimeId.split(".")[1] ?? "unknown",
        label: r.label,
        score: r.confidence,
        active: true,
        explanation: r.description,
      })),
    });
    this.transitions.push(...detected);

    // 3. Generate explanation for this timestamp
    const explanation = this.explanationPlugin.explain(
      profile.regimes,
      profile.capabilities
    );
    this.explanations[ts] = explanation;
  }

  /**
   * Finalize and return the timeline.
   */
  finalize(): RegimeTimeline {
    return {
      entries: [...this.entries],
      transitions: [...this.transitions],
      explanations: { ...this.explanations },
    };
  }
}

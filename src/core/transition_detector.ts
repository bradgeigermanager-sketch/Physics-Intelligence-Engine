// src/core/transition-detector.ts

import {
  RegimeClassification,
  RegimeTransition,
} from "./types";

export interface TransitionDetectorConfig {
  /**
   * Minimum confidence required for a regime to be considered "active".
   * Typical values: 0.5–0.7
   */
  activeThreshold: number;
}

/**
 * TransitionDetector
 *
 * Tracks the currently active regime and emits a transition event
 * whenever the dominant regime changes. This is a lightweight,
 * single-family detector; multi-family transitions are handled
 * by the Regime Timeline Engine.
 */
export class TransitionDetector {
  private config: TransitionDetectorConfig;
  private lastActiveRegimeId: string | null = null;

  constructor(config: TransitionDetectorConfig) {
    this.config = config;
  }

  /**
   * Detect a regime transition.
   *
   * @param timestamp - ISO 8601 timestamp of the current state
   * @param classifications - sorted list of regime classifications
   * @returns a transition event or null if no transition occurred
   */
  detect(
    timestamp: string,
    classifications: RegimeClassification[]
  ): RegimeTransition | null {
    const active = classifications.find(
      (c) => c.confidence >= this.config.activeThreshold
    );

    const currentId = active?.regimeId ?? null;

    // No change
    if (currentId === this.lastActiveRegimeId) {
      return null;
    }

    // Construct transition event
    const transition: RegimeTransition = {
      fromRegimeId: this.lastActiveRegimeId,
      toRegimeId: currentId!,
      timestamp,
      confidence: active?.confidence ?? 0,
    };

    // Update internal state
    this.lastActiveRegimeId = currentId;

    return transition;
  }

  /**
   * Reset the detector (useful for new sequences).
   */
  reset() {
    this.lastActiveRegimeId = null;
  }

  /**
   * Get the currently active regime id.
   */
  getActiveRegimeId(): string | null {
    return this.lastActiveRegimeId;
  }
}

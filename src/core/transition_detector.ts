// src/core/transition-detector.ts

import {
  RegimeClassification,
  RegimeTransition,
} from "./types";

export interface TransitionDetectorConfig {
  /**
   * Minimum confidence to consider a regime "active".
   */
  activeThreshold: number;
}

export class TransitionDetector {
  private config: TransitionDetectorConfig;
  private lastActiveRegimeId: string | null = null;

  constructor(config: TransitionDetectorConfig) {
    this.config = config;
  }

  detect(
    timestamp: string,
    classifications: RegimeClassification[]
  ): RegimeTransition | null {
    const active = classifications.find(
      (c) => c.confidence >= this.config.activeThreshold
    );

    const currentId = active?.regimeId ?? null;

    if (currentId === this.lastActiveRegimeId) {
      return null;
    }

    const transition: RegimeTransition = {
      fromRegimeId: this.lastActiveRegimeId,
      toRegimeId: currentId!,
      timestamp,
      confidence: active?.confidence ?? 0,
    };

    this.lastActiveRegimeId = currentId;
    return transition;
  }
}

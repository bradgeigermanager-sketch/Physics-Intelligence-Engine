// src/runtime/anomaly_overlay_engine.ts

import {
  RegimeTimeline,
  RegimeTimelineEntry,
} from "./regime_timeline_engine";

export type AnomalySeverity = "info" | "warning" | "critical";

export interface AnomalyEvent {
  id: string;
  timestamp: string;
  stateId?: string;
  severity: AnomalySeverity;
  label: string;
  description?: string;
  regimeIds?: string[];
  tags?: string[];
  // arbitrary metadata for downstream consumers
  meta?: Record<string, unknown>;
}

export interface AnomalyOverlayEntry {
  timestamp: string;
  stateId?: string;

  // timeline context
  regimes: RegimeTimelineEntry["regimes"];

  // anomalies at this timestamp
  anomalies: AnomalyEvent[];

  // convenience: dominant regime (if any)
  dominantRegimeId?: string;
  dominantRegimeLabel?: string;
  dominantRegimeConfidence?: number;
}

export interface AnomalyOverlay {
  entries: AnomalyOverlayEntry[];
  byAnomalyId: Record<string, AnomalyOverlayEntry>;
  byTimestamp: Record<string, AnomalyOverlayEntry>;
}

export interface AnomalyOverlayEngineConfig {
  /**
   * If true, timestamps are matched exactly (string equality).
   * If false, engine may later support nearest-neighbor matching.
   */
  strictTimestamps?: boolean;
}

/**
 * Anomaly Overlay Engine:
 * - merges a RegimeTimeline with a list of AnomalyEvent
 * - produces overlay-ready structures for UI and analytics
 */
export class AnomalyOverlayEngine {
  private readonly strictTimestamps: boolean;

  constructor(config?: AnomalyOverlayEngineConfig) {
    this.strictTimestamps = config?.strictTimestamps ?? true;
  }

  /**
   * Build overlay from timeline + anomalies.
   */
  buildOverlay(
    timeline: RegimeTimeline,
    anomalies: AnomalyEvent[]
  ): AnomalyOverlay {
    // Index timeline by timestamp
    const byTs = new Map<string, RegimeTimelineEntry>();
    for (const e of timeline.entries) {
      byTs.set(e.timestamp, e);
    }

    // Group anomalies by timestamp
    const anomaliesByTs = new Map<string, AnomalyEvent[]>();
    for (const a of anomalies) {
      const ts = a.timestamp;
      const arr = anomaliesByTs.get(ts) ?? [];
      arr.push(a);
      anomaliesByTs.set(ts, arr);
    }

    const entries: AnomalyOverlayEntry[] = [];
    const byAnomalyId: Record<string, AnomalyOverlayEntry> = {};
    const byTimestamp: Record<string, AnomalyOverlayEntry> = {};

    // Build overlay entries for all timestamps present in either timeline or anomalies
    const allTimestamps = new Set<string>([
      ...Array.from(byTs.keys()),
      ...Array.from(anomaliesByTs.keys()),
    ]);

    for (const ts of Array.from(allTimestamps).sort()) {
      const timelineEntry = byTs.get(ts);
      const tsAnoms = anomaliesByTs.get(ts) ?? [];

      const regimes = timelineEntry?.regimes ?? [];

      // dominant regime (if any)
      let dominantRegimeId: string | undefined;
      let dominantRegimeLabel: string | undefined;
      let dominantRegimeConfidence: number | undefined;

      if (regimes.length > 0) {
        const dominant = regimes.reduce((best, r) =>
          !best || r.confidence > best.confidence ? r : best
        );
        dominantRegimeId = dominant.regimeId;
        dominantRegimeLabel = dominant.label;
        dominantRegimeConfidence = dominant.confidence;
      }

      const overlayEntry: AnomalyOverlayEntry = {
        timestamp: ts,
        stateId: timelineEntry?.stateId,
        regimes,
        anomalies: tsAnoms,
        dominantRegimeId,
        dominantRegimeLabel,
        dominantRegimeConfidence,
      };

      entries.push(overlayEntry);
      byTimestamp[ts] = overlayEntry;

      for (const a of tsAnoms) {
        byAnomalyId[a.id] = overlayEntry;
      }
    }

    return {
      entries,
      byAnomalyId,
      byTimestamp,
    };
  }
}

// src/core/types.ts

export type Scalar = number;

export interface Timestamped {
  timestamp: string; // ISO 8601
}

export interface FieldState extends Timestamped {
  fields: Record<string, Scalar | Scalar[] | Record<string, unknown>>;
}

/**
 * A measurement is an atomic or composite quantity evaluated from fields
 * and/or other measurements.
 */
export interface MeasurementNode {
  id: string;
  label: string;
  description?: string;
  /**
   * IDs of other measurements this one depends on.
   */
  dependencies: string[];
  /**
   * IDs of raw fields this measurement reads from the state.
   */
  fieldDependencies: string[];
  /**
   * Category tags: "thermodynamic", "transport", "kinematic", "radiation", "coupling", etc.
   */
  tags: string[];
  /**
   * Pure function: given state and resolved dependency values, compute this measurement.
   */
  evaluate: (ctx: MeasurementEvalContext) => Scalar | Record<string, unknown>;
}

export interface MeasurementEvalContext {
  state: FieldState;
  /**
   * Map from measurement id → already evaluated value.
   */
  measurements: Record<string, unknown>;
}

/**
 * Capability is a regime‑agnostic “ability” derived from measurements.
 * Example: "strong_shock", "high_optical_depth", "supersonic".
 */
export interface Capability {
  id: string;
  label: string;
  description?: string;
  /**
   * IDs of measurements this capability depends on.
   */
  measurementDependencies: string[];
  /**
   * Evaluate capability score in [0, 1] or a structured object.
   */
  evaluate: (measurements: Record<string, unknown>) => number | Record<string, unknown>;
}

/**
 * A regime is a qualitative state of the system, built from capabilities.
 */
export interface Regime {
  id: string;
  label: string;
  description?: string;
  /**
   * IDs of capabilities this regime depends on.
   */
  capabilityDependencies: string[];
  /**
   * Returns a confidence in [0, 1] plus optional structured metadata.
   */
  classify: (capabilities: Record<string, unknown>) => RegimeClassification;
}

export interface RegimeClassification {
  regimeId: string;
  confidence: number;
  details?: Record<string, unknown>;
}

/**
 * Transition between regimes over time.
 */
export interface RegimeTransition {
  fromRegimeId: string | null;
  toRegimeId: string;
  timestamp: string;
  confidence: number;
}

/**
 * Plugin registration interfaces
 */

export interface MeasurementPlugin {
  namespace: string; // e.g. "thermodynamic_composites"
  measurements: MeasurementNode[];
}

export interface CapabilityPlugin {
  namespace: string; // e.g. "thermodynamic_capability_library"
  capabilities: Capability[];
}

export interface RegimePlugin {
  namespace: string; // e.g. "regimes/thermodynamic"
  regimes: Regime[];
}

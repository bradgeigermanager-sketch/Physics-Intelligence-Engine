// plugins/thermodynamic_regime_pack/index.ts

import {
  Regime,
  RegimePlugin,
  RegimeClassification,
} from "../../src/core/types";

/**
 * Helper to read a capability.
 */
function c(caps: Record<string, unknown>, id: string): number {
  const v = caps[id];
  if (typeof v !== "number") {
    throw new Error(`Expected capability "${id}"`);
  }
  return v;
}

/**
 * Clamp to [0, 1].
 */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Thermodynamic regimes:
 * - hot plasma
 * - cold plasma
 * - high-entropy flow
 * - acoustic-dominated
 * - pressure-dominated
 */

const thermoRegimes: Regime[] = [
  // Hot plasma: high temperature + high sound speed
  {
    id: "regime.thermo.hot_plasma",
    label: "Hot Plasma",
    description: "High temperature and high sound speed.",
    capabilityDependencies: [
      "cap.thermo.high_T",
      "cap.thermo.high_sound_speed",
    ],
    classify: (caps): RegimeClassification => {
      const T = c(caps, "cap.thermo.high_T");
      const cs = c(caps, "cap.thermo.high_sound_speed");
      const score = clamp01((T + cs) / 2);
      return {
        regimeId: "regime.thermo.hot_plasma",
        confidence: score,
        label: "Hot Plasma",
        description: "High temperature and high sound speed.",
      };
    },
  },

  // Cold plasma: low temperature + low sound speed
  {
    id: "regime.thermo.cold_plasma",
    label: "Cold Plasma",
    description: "Low temperature and low sound speed.",
    capabilityDependencies: [
      "cap.thermo.low_T",
      "cap.thermo.high_sound_speed",
    ],
    classify: (caps): RegimeClassification => {
      const lowT = c(caps, "cap.thermo.low_T");
      const highCs = c(caps, "cap.thermo.high_sound_speed");
      const score = clamp01((lowT + (1 - highCs)) / 2);
      return {
        regimeId: "regime.thermo.cold_plasma",
        confidence: score,
        label: "Cold Plasma",
        description: "Low temperature and low sound speed.",
      };
    },
  },

  // High-entropy flow
  {
    id: "regime.thermo.high_entropy",
    label: "High-Entropy Flow",
    description: "Flow dominated by high entropy.",
    capabilityDependencies: ["cap.thermo.high_entropy"],
    classify: (caps): RegimeClassification => {
      const S = c(caps, "cap.thermo.high_entropy");
      return {
        regimeId: "regime.thermo.high_entropy",
        confidence: S,
        label: "High-Entropy Flow",
        description: "Flow dominated by high entropy.",
      };
    },
  },

  // Acoustic-dominated: high sound speed relative to gradients
  {
    id: "regime.thermo.acoustic_dominated",
    label: "Acoustic-Dominated",
    description: "Sound speed dominates over kinematic gradients.",
    capabilityDependencies: [
      "cap.thermo.high_sound_speed",
      "cap.kin.grad_v",
    ],
    classify: (caps): RegimeClassification => {
      const cs = c(caps, "cap.thermo.high_sound_speed");
      const grad = c(caps, "cap.kin.grad_v");
      const score = clamp01(cs * (1 - grad));
      return {
        regimeId: "regime.thermo.acoustic_dominated",
        confidence: score,
        label: "Acoustic-Dominated",
        description: "Sound speed dominates over kinematic gradients.",
      };
    },
  },

  // Pressure-dominated: high p/rho ratio
  {
    id: "regime.thermo.pressure_dominated",
    label: "Pressure-Dominated",
    description: "Pressure-to-density ratio dominates thermodynamic behavior.",
    capabilityDependencies: ["cap.thermo.pressure_ratio"],
    classify: (caps): RegimeClassification => {
      const ratio = c(caps, "cap.thermo.pressure_ratio");
      return {
        regimeId: "regime.thermo.pressure_dominated",
        confidence: ratio,
        label: "Pressure-Dominated",
        description: "High pressure-to-density ratio.",
      };
    },
  },
];

export const ThermodynamicRegimePlugin: RegimePlugin = {
  namespace: "thermodynamic_regime_pack",
  regimes: thermoRegimes,
};
